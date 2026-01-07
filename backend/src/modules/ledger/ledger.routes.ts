import { Router } from 'express';
import { LedgerController } from './ledger.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();
const ledgerController = new LedgerController();

// All ledger routes require authentication
router.use(authMiddleware);

// Account routes
router.post('/accounts', ledgerController.createAccount.bind(ledgerController));
router.get('/accounts', ledgerController.getAccounts.bind(ledgerController));
router.get('/accounts/:accountId', ledgerController.getAccountById.bind(ledgerController));
router.get('/accounts/:accountId/balance', ledgerController.getAccountBalance.bind(ledgerController));

// Transaction routes
router.post('/transactions', ledgerController.createTransaction.bind(ledgerController));
router.get('/transactions', ledgerController.getTransactions.bind(ledgerController));
router.get('/transactions/:transactionId', ledgerController.getTransactionById.bind(ledgerController));
router.post('/transactions/:transactionId/void', ledgerController.voidTransaction.bind(ledgerController));

export default router;
