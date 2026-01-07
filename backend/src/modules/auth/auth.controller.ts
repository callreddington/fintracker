import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';
import { logger } from '@utils/logger';
import type { RegisterUserInput, LoginUserInput, RefreshTokenInput } from '@/types/auth.types';

/**
 * AuthController - Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body) as RegisterUserInput;

      // Register user
      const user = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already registered') {
          res.status(409).json({
            success: false,
            error: 'Email already registered',
          });
          return;
        }

        // Zod validation error
        if (error.name === 'ZodError') {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error,
          });
          return;
        }
      }

      logger.error('Registration error:', error);
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body) as LoginUserInput;

      // Login user
      const result = await authService.login(validatedData);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          res.status(401).json({
            success: false,
            error: 'Invalid email or password',
          });
          return;
        }

        // Zod validation error
        if (error.name === 'ZodError') {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error,
          });
          return;
        }
      }

      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body) as RefreshTokenInput;

      // Refresh tokens
      const tokens = await authService.refreshToken(validatedData.refreshToken);

      res.status(200).json({
        success: true,
        ...tokens,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Invalid or revoked refresh token' ||
          error.message === 'Invalid refresh token' ||
          error.message === 'Refresh token expired'
        ) {
          res.status(401).json({
            success: false,
            error: error.message,
          });
          return;
        }

        // Zod validation error
        if (error.name === 'ZodError') {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error,
          });
          return;
        }
      }

      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get refresh token from request body
      const { refreshToken } = req.body as { refreshToken?: string };

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      // Logout user
      await authService.logout(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid refresh token' || error.message === 'Refresh token expired') {
          res.status(401).json({
            success: false,
            error: error.message,
          });
          return;
        }
      }

      logger.error('Logout error:', error);
      next(error);
    }
  }
}

export const authController = new AuthController();
