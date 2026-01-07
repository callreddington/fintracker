import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// GET /api/v1/dashboard/stats
router.get('/stats', dashboardController.getDashboardStats.bind(dashboardController));

export default router;
