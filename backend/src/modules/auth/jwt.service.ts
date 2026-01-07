import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { getDatabase } from '@config/database';
import { logger } from '@utils/logger';
import type { RefreshToken, AuthTokens } from '@/types/auth.types';

/**
 * JWTService - Handles JWT token generation and verification
 */
export class JWTService {
  private readonly JWT_SECRET: string;
  private readonly JWT_ACCESS_EXPIRY: string;
  private readonly JWT_REFRESH_EXPIRY: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || '';
    this.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

    if (!this.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Generate access token
   * @param userId - User ID
   * @param email - User email
   * @returns Access token string
   */
  generateAccessToken(userId: string, email: string): string {
    try {
      const payload = {
        userId,
        email,
        type: 'access',
      };

      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_ACCESS_EXPIRY,
        issuer: 'fintracker-api',
        audience: 'fintracker-client',
      } as jwt.SignOptions);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate refresh token
   * @param userId - User ID
   * @returns Refresh token string
   */
  generateRefreshToken(userId: string): string {
    try {
      const payload = {
        userId,
        type: 'refresh',
        jti: crypto.randomUUID(), // Unique token ID
      };

      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_REFRESH_EXPIRY,
        issuer: 'fintracker-api',
        audience: 'fintracker-client',
      } as jwt.SignOptions);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   * @param userId - User ID
   * @param email - User email
   * @returns Object containing both tokens
   */
  async generateTokenPair(userId: string, email: string): Promise<AuthTokens> {
    try {
      const accessToken = this.generateAccessToken(userId, email);
      const refreshToken = this.generateRefreshToken(userId);

      // Store hashed refresh token in database
      await this.storeRefreshToken(userId, refreshToken);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Error generating token pair:', error);
      throw error;
    }
  }

  /**
   * Store refresh token in database (hashed)
   * @param userId - User ID
   * @param refreshToken - Refresh token to store
   */
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const db = getDatabase();

      // Decode token to get expiration
      const decoded = jwt.decode(refreshToken) as { exp?: number; jti?: string };
      if (!decoded || !decoded.exp || !decoded.jti) {
        throw new Error('Invalid refresh token');
      }

      // Hash the token before storing
      const tokenHash = await bcrypt.hash(refreshToken, 10);

      // Calculate expiration date
      const expiresAt = new Date(decoded.exp * 1000);

      // Insert into database
      const insertResult = await db<RefreshToken>('refresh_tokens').insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        is_revoked: false,
      });

      if (!insertResult) {
        throw new Error('Failed to store refresh token');
      }

      logger.info(`Refresh token stored for user: ${userId}`);
    } catch (error) {
      logger.error('Error storing refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   * @param token - Access token to verify
   * @returns Decoded token payload
   */
  verifyAccessToken(token: string): { userId: string; email: string; type: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'fintracker-api',
        audience: 'fintracker-client',
      }) as { userId: string; email: string; type: string };

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   * @param token - Refresh token to verify
   * @returns Decoded token payload
   */
  verifyRefreshToken(token: string): { userId: string; type: string; jti: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'fintracker-api',
        audience: 'fintracker-client',
      }) as { userId: string; type: string; jti: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw error;
    }
  }

  /**
   * Validate refresh token against database
   * @param userId - User ID
   * @param refreshToken - Refresh token to validate
   * @returns True if token is valid
   */
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    try {
      const db = getDatabase();

      // Get all active refresh tokens for user
      const tokens = await db<RefreshToken>('refresh_tokens')
        .where({ user_id: userId, is_revoked: false })
        .where('expires_at', '>', new Date());

      // Check if any token matches the provided one
      for (const tokenRecord of tokens) {
        const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token_hash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error validating refresh token:', error);
      return false;
    }
  }

  /**
   * Revoke refresh token
   * @param userId - User ID
   * @param refreshToken - Refresh token to revoke
   */
  async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    try {
      const db = getDatabase();

      // Get all active refresh tokens for user
      const tokens = await db<RefreshToken>('refresh_tokens')
        .where({ user_id: userId, is_revoked: false })
        .where('expires_at', '>', new Date());

      // Find and revoke the matching token
      for (const tokenRecord of tokens) {
        const isMatch = await bcrypt.compare(refreshToken, tokenRecord.token_hash);
        if (isMatch) {
          const updateResult = await db<RefreshToken>('refresh_tokens').where({ id: tokenRecord.id }).update({
            is_revoked: true,
            revoked_at: new Date(),
          });

          if (!updateResult) {
            throw new Error('Failed to revoke refresh token');
          }

          logger.info(`Refresh token revoked for user: ${userId}`);
          return;
        }
      }

      logger.warn(`Refresh token not found for user: ${userId}`);
    } catch (error) {
      logger.error('Error revoking refresh token:', error);
      throw error;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId - User ID
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      const db = getDatabase();

      const updateResult = await db<RefreshToken>('refresh_tokens')
        .where({ user_id: userId, is_revoked: false })
        .update({
          is_revoked: true,
          revoked_at: new Date(),
        });

      if (!updateResult) {
        logger.warn(`No refresh tokens found to revoke for user: ${userId}`);
      } else {
        logger.info(`All refresh tokens revoked for user: ${userId}`);
      }
    } catch (error) {
      logger.error('Error revoking all refresh tokens:', error);
      throw error;
    }
  }
}

export const jwtService = new JWTService();
