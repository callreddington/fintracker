import type { Request, Response, NextFunction } from 'express';
import { jwtService } from '@modules/auth/jwt.service';
import { authService } from '@modules/auth/auth.service';
import { logger } from '@utils/logger';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request object
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
      });
      return;
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    // Verify token
    let decoded;
    try {
      decoded = jwtService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({
          success: false,
          error: error.message,
        });
        return;
      }
      throw error;
    }

    // Get user from database
    const user = await authService.findUserById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user to request object (without password)
    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      email_verified: user.email_verified,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
}

/**
 * Optional authentication middleware
 * Verifies JWT access token if provided, but doesn't fail if not
 * Useful for endpoints that have different behavior for authenticated vs anonymous users
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth header, continue without user
      next();
      return;
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    // Verify token
    try {
      const decoded = jwtService.verifyAccessToken(token);

      // Get user from database
      const user = await authService.findUserById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          email_verified: user.email_verified,
          email_verified_at: user.email_verified_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      }
    } catch (error) {
      // Token invalid, continue without user
      logger.warn('Invalid token in optional auth middleware:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
}
