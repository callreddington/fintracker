import { getDatabase } from '@config/database';
import { LedgerService } from '@modules/ledger/ledger.service';
import { PayeService } from './paye.service';
import type { Employer, IncomeEntry, CreateIncomeEntryInput } from './paye.types';

export class IncomeService {
  private payeService: PayeService;
  private ledgerService: LedgerService;

  constructor() {
    this.payeService = new PayeService();
    this.ledgerService = new LedgerService();
  }

  /**
   * Create or get employer
   */
  async createEmployer(
    userId: string,
    data: {
      name: string;
      pin_number?: string;
      address?: string;
      phone?: string;
      email?: string;
      is_current?: boolean;
    }
  ): Promise<Employer> {
    const db = getDatabase();

    // If marking as current, unmark others
    if (data.is_current) {
      await db('employers').where({ user_id: userId }).update({ is_current: false });
    }

    const [employer] = await db<Employer>('employers')
      .insert({
        user_id: userId,
        name: data.name,
        pin_number: data.pin_number || null,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        is_current: data.is_current !== undefined ? data.is_current : true,
      })
      .returning('*');

    if (!employer) {
      throw new Error('Failed to create employer');
    }

    return employer;
  }

  /**
   * Get employers for user
   */
  async getEmployers(userId: string): Promise<Employer[]> {
    const db = getDatabase();
    return db<Employer>('employers').where({ user_id: userId }).orderBy('is_current', 'desc').orderBy('name');
  }

  /**
   * Create income entry with automatic PAYE calculation
   */
  async createIncomeEntry(userId: string, input: CreateIncomeEntryInput): Promise<IncomeEntry> {
    const db = getDatabase();

    // Calculate PAYE and deductions
    const payeResult = await this.payeService.calculatePaye({
      gross_salary: input.gross_amount,
      calculation_date: input.income_date,
      insurance_relief_amount: input.insurance_relief_amount,
      pension_contribution: input.pension_contribution,
      mortgage_interest: input.mortgage_interest,
      nhif_override: input.nhif_override,
      nssf_tier1_override: input.nssf_tier1_override,
      nssf_tier2_override: input.nssf_tier2_override,
      housing_levy_override: input.housing_levy_override,
    });

    // Calculate net amount
    const otherDeductions = input.other_deductions || 0;
    const totalDeductions = payeResult.total_deductions + otherDeductions;
    const netAmount = input.gross_amount - totalDeductions;

    // Prepare income entry data
    const incomeData = {
      user_id: userId,
      employer_id: input.employer_id || null,
      income_type: input.income_type,
      income_date: typeof input.income_date === 'string' ? new Date(input.income_date) : input.income_date,
      description: input.description,
      gross_amount: input.gross_amount.toString(),
      paye_before_relief: payeResult.paye_before_relief.toString(),
      personal_relief: payeResult.personal_relief.toString(),
      insurance_relief: payeResult.insurance_relief.toString(),
      pension_relief: payeResult.pension_relief.toString(),
      mortgage_relief: payeResult.mortgage_relief.toString(),
      paye: (input.paye_override !== undefined ? input.paye_override : payeResult.paye).toString(),
      nhif: payeResult.nhif.toString(),
      nssf_tier1: payeResult.nssf_tier1.toString(),
      nssf_tier2: payeResult.nssf_tier2.toString(),
      nssf_total: payeResult.nssf_total.toString(),
      housing_levy: payeResult.housing_levy.toString(),
      other_deductions: otherDeductions.toString(),
      other_deductions_notes: input.other_deductions_notes || null,
      net_amount: netAmount.toString(),
      is_manual_override: input.is_manual_override || false,
      override_notes: input.override_notes || null,
      calculation_breakdown: payeResult.breakdown,
    };

    // Start transaction
    const result = await db.transaction(async (trx) => {
      // Create income entry
      const [incomeEntry] = await trx<IncomeEntry>('income_entries').insert(incomeData).returning('*');

      if (!incomeEntry) {
        throw new Error('Failed to create income entry');
      }

      // Create ledger transaction if requested
      if (input.create_transaction && input.bank_account_id) {
        // Verify account exists and is active
        const account = await this.ledgerService.getAccountById(userId, input.bank_account_id);
        if (!account || !account.is_active) {
          throw new Error('Invalid or inactive bank account');
        }

        // Get or create salary income account
        let salaryAccount = await this.ledgerService.getAccounts(userId, {
          type: 'INCOME',
        });

        const salaryAccountMatch = salaryAccount.find((acc) => acc.subtype === 'SALARY');

        let salaryAccountId: string;
        if (salaryAccountMatch) {
          salaryAccountId = salaryAccountMatch.id;
        } else {
          // Create default salary income account
          const newSalaryAccount = await this.ledgerService.createAccount(userId, {
            name: 'Salary Income',
            type: 'INCOME',
            subtype: 'SALARY',
            description: 'Salary and employment income',
          });
          salaryAccountId = newSalaryAccount.id;
        }

        // Create transaction: DEBIT Bank, CREDIT Salary Income
        const transaction = await this.ledgerService.createTransaction(userId, {
          description: input.description,
          transaction_date: input.income_date,
          notes: `Net salary after deductions. Gross: KES ${input.gross_amount.toLocaleString()}`,
          entries: [
            {
              account_id: input.bank_account_id,
              entry_type: 'DEBIT',
              amount: netAmount,
              description: `Salary received (net)`,
            },
            {
              account_id: salaryAccountId,
              entry_type: 'CREDIT',
              amount: netAmount,
              description: `Salary earned`,
            },
          ],
        });

        // Update income entry with transaction reference
        await trx('income_entries').where({ id: incomeEntry.id }).update({
          transaction_id: transaction.id,
        });

        // Fetch updated entry
        const [updatedEntry] = await trx<IncomeEntry>('income_entries').where({ id: incomeEntry.id });

        return updatedEntry!;
      }

      return incomeEntry;
    });

    return result;
  }

  /**
   * Get income entries for user
   */
  async getIncomeEntries(
    userId: string,
    filters?: {
      income_type?: string;
      employer_id?: string;
      from_date?: Date;
      to_date?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<IncomeEntry[]> {
    const db = getDatabase();

    let query = db<IncomeEntry>('income_entries').where({ user_id: userId });

    if (filters?.income_type) {
      query = query.where({ income_type: filters.income_type });
    }

    if (filters?.employer_id) {
      query = query.where({ employer_id: filters.employer_id });
    }

    if (filters?.from_date) {
      query = query.where('income_date', '>=', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.where('income_date', '<=', filters.to_date);
    }

    query = query.orderBy('income_date', 'desc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return query;
  }

  /**
   * Get income entry by ID
   */
  async getIncomeEntryById(userId: string, incomeId: string): Promise<IncomeEntry | null> {
    const db = getDatabase();

    const entry = await db<IncomeEntry>('income_entries').where({ id: incomeId, user_id: userId }).first();

    return entry || null;
  }

  /**
   * Get income summary for a period
   */
  async getIncomeSummary(
    userId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    total_gross: number;
    total_net: number;
    total_paye: number;
    total_nhif: number;
    total_nssf: number;
    total_housing_levy: number;
    total_other_deductions: number;
    entry_count: number;
  }> {
    const db = getDatabase();

    const result = await db('income_entries')
      .where({ user_id: userId })
      .where('income_date', '>=', fromDate)
      .where('income_date', '<=', toDate)
      .select(
        db.raw('SUM(CAST(gross_amount AS DECIMAL)) as total_gross'),
        db.raw('SUM(CAST(net_amount AS DECIMAL)) as total_net'),
        db.raw('SUM(CAST(paye AS DECIMAL)) as total_paye'),
        db.raw('SUM(CAST(nhif AS DECIMAL)) as total_nhif'),
        db.raw('SUM(CAST(nssf_total AS DECIMAL)) as total_nssf'),
        db.raw('SUM(CAST(housing_levy AS DECIMAL)) as total_housing_levy'),
        db.raw('SUM(CAST(other_deductions AS DECIMAL)) as total_other_deductions'),
        db.raw('COUNT(*) as entry_count')
      )
      .first();

    return {
      total_gross: parseFloat(result?.total_gross || '0'),
      total_net: parseFloat(result?.total_net || '0'),
      total_paye: parseFloat(result?.total_paye || '0'),
      total_nhif: parseFloat(result?.total_nhif || '0'),
      total_nssf: parseFloat(result?.total_nssf || '0'),
      total_housing_levy: parseFloat(result?.total_housing_levy || '0'),
      total_other_deductions: parseFloat(result?.total_other_deductions || '0'),
      entry_count: parseInt(result?.entry_count || '0', 10),
    };
  }
}
