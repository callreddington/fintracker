import * as bcrypt from 'bcryptjs';
import { getDatabase } from '@config/database';
import { logger } from '@utils/logger';
import { jwtService } from './jwt.service';
import type { RegisterUserInput, LoginUserInput, UserResponse, User, LoginResponse } from '@/types/auth.types';

/**
 * AuthService - Handles authentication business logic
 */
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Register a new user
   * @param input - User registration data
   * @returns User object without password
   * @throws Error if email already exists or database error
   */
  async register(input: RegisterUserInput): Promise<UserResponse> {
    const { email, password, full_name } = input;

    try {
      const db = getDatabase();

      // Check if user already exists
      const existingUser = await db<User>('users').where({ email }).first();

      if (existingUser) {
        logger.warn(`Registration attempt with existing email: ${email}`);
        throw new Error('Email already registered');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Insert user into database
      const [user] = await db<User>('users')
        .insert({
          email,
          password_hash,
          full_name,
          email_verified: false,
          email_verified_at: null,
        })
        .returning(['id', 'email', 'full_name', 'email_verified', 'email_verified_at', 'created_at', 'updated_at']);

      if (!user) {
        throw new Error('Failed to create user');
      }

      logger.info(`User registered successfully: ${user.id}`);

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      logger.error('Error during user registration:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   * @param email - User email
   * @returns User object or undefined
   */
  async findUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = getDatabase();
      const user = await db<User>('users').where({ email }).first();
      return user || undefined;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object or undefined
   */
  async findUserById(id: string): Promise<User | undefined> {
    try {
      const db = getDatabase();
      const user = await db<User>('users').where({ id }).first();
      return user || undefined;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Verify password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if password matches
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error verifying password:', error);
      throw error;
    }
  }

  /**
   * Login user and generate tokens
   * @param input - User login data
   * @returns Login response with tokens and user data
   * @throws Error if credentials are invalid
   */
  async login(input: LoginUserInput): Promise<LoginResponse> {
    const { email, password } = input;

    try {
      // Find user by email
      const user = await this.findUserByEmail(email);

      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        logger.warn(`Login attempt with invalid password: ${email}`);
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const { accessToken, refreshToken } = await jwtService.generateTokenPair(user.id, user.email);

      logger.info(`User logged in successfully: ${user.id}`);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          email_verified: user.email_verified,
          email_verified_at: user.email_verified_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns New token pair
   * @throws Error if refresh token is invalid or revoked
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Validate token against database
      const isValid = await jwtService.validateRefreshToken(decoded.userId, refreshToken);

      if (!isValid) {
        logger.warn(`Refresh token validation failed for user: ${decoded.userId}`);
        throw new Error('Invalid or revoked refresh token');
      }

      // Get user
      const user = await this.findUserById(decoded.userId);

      if (!user) {
        logger.warn(`Refresh token for non-existent user: ${decoded.userId}`);
        throw new Error('User not found');
      }

      // Revoke old refresh token
      await jwtService.revokeRefreshToken(decoded.userId, refreshToken);

      // Generate new token pair (token rotation)
      const tokens = await jwtService.generateTokenPair(user.id, user.email);

      logger.info(`Token refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout user and revoke refresh token
   * @param refreshToken - Refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);

      // Revoke refresh token
      await jwtService.revokeRefreshToken(decoded.userId, refreshToken);

      logger.info(`User logged out: ${decoded.userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
