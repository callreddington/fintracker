import { Request, Response, NextFunction } from 'express';
import { accountsService, CreateAccountDto, TransferMoneyDto } from './accounts.service';

export class AccountsController {
  /**
   * GET /api/v1/accounts
   * Get all accounts for the authenticated user
   */
  async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const type = (req.query.type as 'ASSET' | 'LIABILITY' | 'ALL') || 'ALL';
      const accounts = await accountsService.getAccounts(userId, type);

      res.json({
        success: true,
        accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/accounts/summary
   * Get account summary statistics
   */
  async getAccountSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const summary = await accountsService.getAccountSummary(userId);

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accounts
   * Create a new account
   */
  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const data: CreateAccountDto = req.body;

      // Validate required fields
      if (!data.name || !data.type || !data.subtype) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const account = await accountsService.createAccount(userId, data);

      res.status(201).json({
        success: true,
        account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/accounts/transfer
   * Transfer money between accounts
   */
  async transferMoney(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const data: TransferMoneyDto = {
        ...req.body,
        transfer_date: req.body.transfer_date ? new Date(req.body.transfer_date) : new Date(),
      };

      // Validate required fields
      if (!data.from_account_id || !data.to_account_id || !data.amount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (data.amount <= 0) {
        res.status(400).json({ error: 'Amount must be positive' });
        return;
      }

      await accountsService.transferMoney(userId, data);

      res.json({
        success: true,
        message: 'Transfer completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const accountsController = new AccountsController();
