import type { Request, Response } from 'express';
import { logger } from '@utils/logger';

/**
 * UserController - Handles user-related endpoints (protected)
 */
export class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/me
   */
  getProfile(req: Request, res: Response): void {
    try {
      // User is attached by authMiddleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user: req.user,
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

export const userController = new UserController();
