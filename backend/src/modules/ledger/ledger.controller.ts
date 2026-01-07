import { Request, Response, NextFunction } from 'express';
import { LedgerService } from './ledger.service';
import type { CreateAccountInput, CreateTransactionInput } from './ledger.types';

const ledgerService = new LedgerService();

export class LedgerController {
  /**
   * POST /api/v1/ledger/accounts
   * Create a new account
   */
  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input: CreateAccountInput = req.body;

      // Validation
      if (!input.name || !input.type || !input.subtype) {
        res.status(400).json({ error: 'Missing required fields: name, type, subtype' });
        return;
      }

      const account = await ledgerService.createAccount(userId, input);

      res.status(201).json({
        success: true,
        account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ledger/accounts
   * Get all accounts for user
   */
  async getAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const type = req.query.type as string | undefined;
      const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;

      const accounts = await ledgerService.getAccounts(userId, {
        type: type as any,
        is_active,
      });

      res.json({
        success: true,
        accounts,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ledger/accounts/:accountId
   * Get account by ID
   */
  async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { accountId } = req.params;

      const account = accountId ? await ledgerService.getAccountById(userId, accountId) : null;

      if (!account) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      res.json({
        success: true,
        account,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ledger/accounts/:accountId/balance
   * Get account balance
   */
  async getAccountBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { accountId } = req.params;

      const balance = accountId ? await ledgerService.getAccountBalance(userId, accountId) : null;

      if (!balance) {
        res.status(404).json({ error: 'Account not found' });
        return;
      }

      res.json({
        success: true,
        balance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ledger/transactions
   * Create a new transaction
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const input: CreateTransactionInput = req.body;

      // Validation
      if (!input.description || !input.transaction_date || !input.entries || input.entries.length < 2) {
        res.status(400).json({
          error: 'Missing required fields: description, transaction_date, entries (minimum 2)',
        });
        return;
      }

      const transaction = await ledgerService.createTransaction(userId, input);

      res.status(201).json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ledger/transactions/:transactionId
   * Get transaction by ID
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { transactionId } = req.params;

      const transaction = transactionId ? await ledgerService.getTransactionById(userId, transactionId) : null;

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      res.json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/ledger/transactions
   * Get transactions for user
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const status = req.query.status as string | undefined;
      const from_date = req.query.from_date ? new Date(req.query.from_date as string) : undefined;
      const to_date = req.query.to_date ? new Date(req.query.to_date as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const transactions = await ledgerService.getTransactions(userId, {
        status,
        from_date,
        to_date,
        limit,
        offset,
      });

      res.json({
        success: true,
        transactions,
        pagination: {
          limit,
          offset,
          count: transactions.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ledger/transactions/:transactionId/void
   * Void a transaction
   */
  async voidTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { transactionId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ error: 'Missing required field: reason' });
        return;
      }

      if (!transactionId) {
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const transaction = await ledgerService.voidTransaction(userId, transactionId, reason);

      res.json({
        success: true,
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
}
