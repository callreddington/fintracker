import { Request, Response, NextFunction } from 'express';
import { PayeService } from './paye.service';
import { IncomeService } from './income.service';
import type { PayeCalculationInput, CreateIncomeEntryInput } from './paye.types';

const payeService = new PayeService();
const incomeService = new IncomeService();

export class IncomeController {
  /**
   * POST /api/v1/income/paye/calculate
   * Calculate PAYE for a given gross salary
   */
  async calculatePaye(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: PayeCalculationInput = req.body;

      // Validation
      if (!input.gross_salary || input.gross_salary <= 0) {
        res.status(400).json({ error: 'Invalid gross_salary' });
        return;
      }

      const result = await payeService.calculatePaye(input);

      res.json({
        success: true,
        calculation: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/income/paye/tax-tables
   * Get tax tables for a specific year
   */
  async getTaxTables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

      const tables = await payeService.getTaxTables(year);

      res.json({
        success: true,
        year,
        tables,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/income/employers
   * Create employer
   */
  async createEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name, pin_number, address, phone, email, is_current } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Employer name is required' });
        return;
      }

      const employer = await incomeService.createEmployer(userId, {
        name,
        pin_number,
        address,
        phone,
        email,
        is_current,
      });

      res.status(201).json({
        success: true,
        employer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/income/employers
   * Get employers
   */
  async getEmployers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const employers = await incomeService.getEmployers(userId);

      res.json({
        success: true,
        employers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/income/entries
   * Create income entry
   */
  async createIncomeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input: CreateIncomeEntryInput = req.body;

      // Validation
      if (!input.gross_amount || input.gross_amount <= 0) {
        res.status(400).json({ error: 'Invalid gross_amount' });
        return;
      }

      if (!input.income_date) {
        res.status(400).json({ error: 'income_date is required' });
        return;
      }

      if (!input.description) {
        res.status(400).json({ error: 'description is required' });
        return;
      }

      const entry = await incomeService.createIncomeEntry(userId, input);

      res.status(201).json({
        success: true,
        income_entry: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/income/entries
   * Get income entries
   */
  async getIncomeEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const income_type = req.query.income_type as string | undefined;
      const employer_id = req.query.employer_id as string | undefined;
      const from_date = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
      const to_date = req.query.to_date ? new Date(req.query.to_date as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const entries = await incomeService.getIncomeEntries(userId, {
        income_type,
        employer_id,
        from_date,
        to_date,
        limit,
        offset,
      });

      res.json({
        success: true,
        income_entries: entries,
        pagination: {
          limit,
          offset,
          count: entries.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/income/entries/:entryId
   * Get income entry by ID
   */
  async getIncomeEntryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { entryId } = req.params;

      if (!entryId) {
        res.status(400).json({ error: 'Entry ID is required' });
        return;
      }

      const entry = await incomeService.getIncomeEntryById(userId, entryId);

      if (!entry) {
        res.status(404).json({ error: 'Income entry not found' });
        return;
      }

      res.json({
        success: true,
        income_entry: entry,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/income/summary
   * Get income summary for a period
   */
  async getIncomeSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const from_date = req.query.from_date
        ? new Date(req.query.from_date as string)
        : new Date(new Date().getFullYear(), 0, 1);
      const to_date = req.query.to_date ? new Date(req.query.to_date as string) : new Date();

      const summary = await incomeService.getIncomeSummary(userId, from_date, to_date);

      res.json({
        success: true,
        summary,
        period: {
          from: from_date.toISOString().split('T')[0],
          to: to_date.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
