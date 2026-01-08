import { Router } from 'express';
import { accountsController } from './accounts.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

const router = Router();

// All account routes require authentication
router.use(authMiddleware);

// GET /api/v1/accounts - Get all accounts
router.get('/', accountsController.getAccounts.bind(accountsController));

// GET /api/v1/accounts/summary - Get account summary
router.get('/summary', accountsController.getAccountSummary.bind(accountsController));

// POST /api/v1/accounts - Create new account
router.post('/', accountsController.createAccount.bind(accountsController));

// POST /api/v1/accounts/transfer - Transfer money between accounts
router.post('/transfer', accountsController.transferMoney.bind(accountsController));

export default router;
