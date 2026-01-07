import { Router } from 'express';
import { IncomeController } from './income.controller';
import { authMiddleware } from '@middleware/auth.middleware';

const router = Router();
const incomeController = new IncomeController();

// PAYE Calculator routes (public - no auth required for calculator)
router.post('/paye/calculate', incomeController.calculatePaye.bind(incomeController));
router.get('/paye/tax-tables', incomeController.getTaxTables.bind(incomeController));

// Protected routes (require authentication)
router.use(authMiddleware);

// Employer routes
router.post('/employers', incomeController.createEmployer.bind(incomeController));
router.get('/employers', incomeController.getEmployers.bind(incomeController));

// Income entry routes
router.post('/entries', incomeController.createIncomeEntry.bind(incomeController));
router.get('/entries', incomeController.getIncomeEntries.bind(incomeController));
router.get('/entries/:entryId', incomeController.getIncomeEntryById.bind(incomeController));

// Summary routes
router.get('/summary', incomeController.getIncomeSummary.bind(incomeController));

export default router;
