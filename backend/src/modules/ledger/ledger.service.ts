import { getDatabase } from '@config/database';
import type {
  Account,
  CreateAccountInput,
  Transaction,
  LedgerEntry,
  CreateTransactionInput,
  TransactionWithEntries,
  AccountBalance,
  ValidationResult,
  AccountType,
} from './ledger.types';

export class LedgerService {
  /**
   * Create a new account for a user
   */
  async createAccount(userId: string, input: CreateAccountInput): Promise<Account> {
    const db = getDatabase();

    const [account] = await db<Account>('accounts')
      .insert({
        user_id: userId,
        name: input.name,
        type: input.type,
        subtype: input.subtype,
        account_number: input.account_number || null,
        currency: input.currency || 'KES',
        description: input.description || null,
        metadata: input.metadata || null,
      })
      .returning('*');

    if (!account) {
      throw new Error('Failed to create account');
    }

    return account;
  }

  /**
   * Get all accounts for a user
   */
  async getAccounts(userId: string, filters?: { type?: AccountType; is_active?: boolean }): Promise<Account[]> {
    const db = getDatabase();

    let query = db<Account>('accounts').where({ user_id: userId });

    if (filters?.type) {
      query = query.where({ type: filters.type });
    }

    if (filters?.is_active !== undefined) {
      query = query.where({ is_active: filters.is_active });
    }

    const accounts = await query.orderBy('type').orderBy('name');

    return accounts;
  }

  /**
   * Get account by ID
   */
  async getAccountById(userId: string, accountId: string): Promise<Account | null> {
    const db = getDatabase();

    const account = await db<Account>('accounts').where({ id: accountId, user_id: userId }).first();

    return account || null;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(userId: string, accountId: string): Promise<AccountBalance | null> {
    const db = getDatabase();

    const balance = await db('account_balances').where({ account_id: accountId, user_id: userId }).first();

    return balance || null;
  }

  /**
   * Validate transaction entries (double-entry check)
   */
  validateTransactionEntries(input: CreateTransactionInput): ValidationResult {
    const errors: string[] = [];

    // Must have at least 2 entries
    if (!input.entries || input.entries.length < 2) {
      errors.push('Transaction must have at least 2 entries (debit and credit)');
    }

    // Calculate total debits and credits
    let debitSum = 0;
    let creditSum = 0;

    for (const entry of input.entries) {
      const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount;

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Invalid amount: ${entry.amount}`);
        continue;
      }

      if (entry.entry_type === 'DEBIT') {
        debitSum += amount;
      } else if (entry.entry_type === 'CREDIT') {
        creditSum += amount;
      } else {
        errors.push(`Invalid entry type: ${entry.entry_type}`);
      }
    }

    // Check if balanced (allow small floating point differences)
    const difference = Math.abs(debitSum - creditSum);
    if (difference > 0.0001) {
      errors.push(`Transaction not balanced: Debits (${debitSum.toFixed(4)}) != Credits (${creditSum.toFixed(4)})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a transaction with ledger entries (double-entry)
   */
  async createTransaction(userId: string, input: CreateTransactionInput): Promise<TransactionWithEntries> {
    const db = getDatabase();

    // Validate entries
    const validation = this.validateTransactionEntries(input);
    if (!validation.valid) {
      throw new Error(`Transaction validation failed: ${validation.errors.join(', ')}`);
    }

    // Verify all accounts exist and belong to user
    const accountIds = input.entries.map((e) => e.account_id);
    const accounts = await db<Account>('accounts')
      .whereIn('id', accountIds)
      .where({ user_id: userId, is_active: true });

    if (accounts.length !== accountIds.length) {
      throw new Error('One or more accounts not found or inactive');
    }

    // Start transaction
    const result = await db.transaction(async (trx) => {
      // Create transaction header
      const [transaction] = await trx<Transaction>('transactions')
        .insert({
          user_id: userId,
          description: input.description,
          notes: input.notes || null,
          transaction_date:
            typeof input.transaction_date === 'string' ? new Date(input.transaction_date) : input.transaction_date,
          status: 'DRAFT', // Start as DRAFT
          idempotency_key: input.idempotency_key || null,
          metadata: input.metadata || null,
        })
        .returning('*');

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      // Create ledger entries
      const entries = await Promise.all(
        input.entries.map(async (entryInput) => {
          const account = accounts.find((a) => a.id === entryInput.account_id);
          if (!account) throw new Error(`Account ${entryInput.account_id} not found`);

          const [entry] = await trx<LedgerEntry>('ledger_entries')
            .insert({
              transaction_id: transaction.id,
              account_id: entryInput.account_id,
              entry_type: entryInput.entry_type,
              amount: entryInput.amount.toString(),
              currency: account.currency,
              description: entryInput.description || null,
            })
            .returning('*');

          if (!entry) {
            throw new Error('Failed to create ledger entry');
          }

          return {
            ...entry,
            account_name: account.name,
            account_type: account.type,
          };
        })
      );

      // Post the transaction (makes it immutable)
      const [postedTransaction] = await trx<Transaction>('transactions')
        .where({ id: transaction.id })
        .update({
          status: 'POSTED',
          posted_at: db.fn.now(),
        })
        .returning('*');

      if (!postedTransaction) {
        throw new Error('Failed to post transaction');
      }

      return {
        ...postedTransaction,
        entries,
      };
    });

    return result;
  }

  /**
   * Get transaction by ID with entries
   */
  async getTransactionById(userId: string, transactionId: string): Promise<TransactionWithEntries | null> {
    const db = getDatabase();

    const transaction = await db<Transaction>('transactions').where({ id: transactionId, user_id: userId }).first();

    if (!transaction) {
      return null;
    }

    const entries = await db<LedgerEntry>('ledger_entries as le')
      .select('le.*', 'a.name as account_name', 'a.type as account_type')
      .join('accounts as a', 'le.account_id', 'a.id')
      .where({ 'le.transaction_id': transactionId });

    return {
      ...transaction,
      entries: entries as any,
    };
  }

  /**
   * Get transactions for a user
   */
  async getTransactions(
    userId: string,
    filters?: {
      status?: string;
      from_date?: Date;
      to_date?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<Transaction[]> {
    const db = getDatabase();

    let query = db<Transaction>('transactions').where({ user_id: userId });

    if (filters?.status) {
      query = query.where('status', filters.status);
    }

    if (filters?.from_date) {
      query = query.where('transaction_date', '>=', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.where('transaction_date', '<=', filters.to_date);
    }

    query = query.orderBy('transaction_date', 'desc').orderBy('created_at', 'desc');

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const transactions = await query;

    return transactions;
  }

  /**
   * Void a transaction (creates reversing entries)
   */
  async voidTransaction(userId: string, transactionId: string, reason: string): Promise<Transaction> {
    const db = getDatabase();

    // Get transaction
    const transaction = await this.getTransactionById(userId, transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'POSTED') {
      throw new Error('Can only void POSTED transactions');
    }

    // Update transaction status
    const [voidedTransaction] = await db<Transaction>('transactions')
      .where({ id: transactionId })
      .update({
        status: 'VOID',
        voided_at: db.fn.now(),
        metadata: db.raw(`COALESCE(metadata, '{}'::jsonb) || ?::jsonb`, [JSON.stringify({ void_reason: reason })]),
      })
      .returning('*');

    if (!voidedTransaction) {
      throw new Error('Failed to void transaction');
    }

    return voidedTransaction;
  }
}
