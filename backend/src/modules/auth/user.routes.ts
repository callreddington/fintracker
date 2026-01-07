import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authMiddleware, (req, res) => userController.getProfile(req, res));

export { router as userRoutes };
