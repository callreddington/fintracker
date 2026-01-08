import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// All expense routes require authentication
router.use(authMiddleware);

// GET /api/v1/expenses - Get all expenses
router.get('/', expensesController.getExpenses.bind(expensesController));

// GET /api/v1/expenses/summary - Get expense summary
router.get('/summary', expensesController.getExpenseSummary.bind(expensesController));

// GET /api/v1/expenses/category-breakdown - Get category breakdown
router.get('/category-breakdown', expensesController.getCategoryBreakdown.bind(expensesController));

// POST /api/v1/expenses - Create new expense
router.post('/', expensesController.createExpense.bind(expensesController));

// DELETE /api/v1/expenses/:id - Delete expense
router.delete('/:id', expensesController.deleteExpense.bind(expensesController));

export default router;
