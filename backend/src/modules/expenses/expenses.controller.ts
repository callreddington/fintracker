import { Request, Response, NextFunction } from 'express';
import { expensesService, CreateExpenseDto } from './expenses.service';

export class ExpensesController {
  /**
   * GET /api/v1/expenses
   * Get all expenses for the authenticated user
   */
  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filters = {
        category_id: req.query.category_id as string,
        payment_method: req.query.payment_method as string,
        start_date: req.query.start_date ? new Date(req.query.start_date as string) : undefined,
        end_date: req.query.end_date ? new Date(req.query.end_date as string) : undefined,
      };

      const expenses = await expensesService.getExpenses(userId, filters);

      res.json({
        success: true,
        expenses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/summary
   * Get expense summary statistics
   */
  async getExpenseSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const start_date = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const end_date = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const summary = await expensesService.getExpenseSummary(userId, start_date, end_date);

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/expenses/category-breakdown
   * Get expense breakdown by category
   */
  async getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const start_date = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const end_date = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const breakdown = await expensesService.getCategoryBreakdown(userId, start_date, end_date);

      res.json({
        success: true,
        breakdown,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/expenses
   * Create a new expense
   */
  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const data: CreateExpenseDto = {
        ...req.body,
        expense_date: req.body.expense_date ? new Date(req.body.expense_date) : new Date(),
      };

      // Validate required fields
      if (!data.category_id || !data.description || !data.amount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (data.amount <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }

      const expense = await expensesService.createExpense(userId, data);

      res.status(201).json({
        success: true,
        expense,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/expenses/:id
   * Delete an expense
   */
  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const expenseId = req.params.id;
      if (!expenseId) {
        res.status(400).json({ error: 'Expense ID is required' });
        return;
      }

      await expensesService.deleteExpense(userId, expenseId);

      res.json({
        success: true,
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const expensesController = new ExpensesController();
