import { getDatabase } from '@/config/database';
import { Knex } from 'knex';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_number: string | null;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
  subtype: string;
  currency: string;
  is_active: boolean;
  description: string | null;
  metadata: any;
  balance: number;
  institution?: string;
  interest_rate?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AccountSummary {
  total_net_worth: number;
  liquid_cash: number;
  investments: number;
  virtual: number;
  total_assets: number;
  total_liabilities: number;
}

export interface CreateAccountDto {
  name: string;
  account_number?: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
  subtype: string;
  currency?: string;
  description?: string;
  metadata?: any;
}

export interface TransferMoneyDto {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_date: Date;
}

export class AccountsService {
  /**
   * Get all accounts for a user with their calculated balances
   */
  async getAccounts(userId: string, type?: 'ASSET' | 'LIABILITY' | 'ALL'): Promise<Account[]> {
    const db = getDatabase();

    let query = db('accounts')
      .select('accounts.*')
      .where('accounts.user_id', userId)
      .where('accounts.is_active', true)
      .orderBy('accounts.created_at', 'desc');

    if (type && type !== 'ALL') {
      query = query.where('accounts.type', type);
    }

    const accounts = await query;

    // Calculate balance for each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const balance = await this.calculateAccountBalance(db, account.id, account.type);
        return {
          ...account,
          balance,
          institution: account.metadata?.institution,
          interest_rate: account.metadata?.interest_rate,
        };
      })
    );

    return accountsWithBalance;
  }

  /**
   * Get account summary statistics
   */
  async getAccountSummary(userId: string): Promise<AccountSummary> {
    const db = getDatabase();

    // Get all active asset accounts
    const assets = await db('accounts')
      .select('accounts.id', 'accounts.subtype', 'accounts.type')
      .where('accounts.user_id', userId)
      .where('accounts.type', 'ASSET')
      .where('accounts.is_active', true);

    // Get all active liability accounts
    const liabilities = await db('accounts')
      .select('accounts.id', 'accounts.type')
      .where('accounts.user_id', userId)
      .where('accounts.type', 'LIABILITY')
      .where('accounts.is_active', true);

    // Calculate balances
    let total_assets = 0;
    let liquid_cash = 0;
    let investments = 0;
    let virtual = 0;

    for (const asset of assets) {
      const balance = await this.calculateAccountBalance(db, asset.id, asset.type);

      total_assets += balance;

      // Categorize based on subtype
      if (['BANK', 'CASH', 'MPESA'].includes(asset.subtype)) {
        liquid_cash += balance;
      } else if (asset.subtype === 'INVESTMENT') {
        investments += balance;
      } else if (asset.subtype === 'VIRTUAL') {
        virtual += balance;
      }
    }

    let total_liabilities = 0;
    for (const liability of liabilities) {
      const balance = await this.calculateAccountBalance(db, liability.id, liability.type);
      total_liabilities += balance;
    }

    const total_net_worth = total_assets - total_liabilities;

    return {
      total_net_worth,
      liquid_cash,
      investments,
      virtual,
      total_assets,
      total_liabilities,
    };
  }

  /**
   * Create a new account
   */
  async createAccount(userId: string, data: CreateAccountDto): Promise<Account> {
    const db = getDatabase();

    const [account] = await db('accounts')
      .insert({
        user_id: userId,
        name: data.name,
        account_number: data.account_number || null,
        type: data.type,
        subtype: data.subtype,
        currency: data.currency || 'KES',
        description: data.description || null,
        metadata: data.metadata || {},
      })
      .returning('*');

    return {
      ...account,
      balance: 0,
    };
  }

  /**
   * Transfer money between accounts
   */
  async transferMoney(userId: string, data: TransferMoneyDto): Promise<void> {
    const db = getDatabase();

    // Verify both accounts belong to the user
    const [fromAccount, toAccount] = await Promise.all([
      db('accounts').where({ id: data.from_account_id, user_id: userId }).first(),
      db('accounts').where({ id: data.to_account_id, user_id: userId }).first(),
    ]);

    if (!fromAccount || !toAccount) {
      throw new Error('Invalid account');
    }

    // Create transaction
    const [transaction] = await db('transactions')
      .insert({
        user_id: userId,
        description: data.description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
        transaction_date: data.transfer_date,
        status: 'POSTED',
      })
      .returning('*');

    // Create ledger entries
    await db('ledger_entries').insert([
      {
        transaction_id: transaction.id,
        account_id: data.from_account_id,
        entry_type: 'CREDIT',
        amount: data.amount,
        currency: fromAccount.currency,
        description: `Transfer to ${toAccount.name}`,
      },
      {
        transaction_id: transaction.id,
        account_id: data.to_account_id,
        entry_type: 'DEBIT',
        amount: data.amount,
        currency: toAccount.currency,
        description: `Transfer from ${fromAccount.name}`,
      },
    ]);
  }

  /**
   * Calculate account balance from ledger entries
   * For ASSET accounts: Debits increase, Credits decrease
   * For LIABILITY accounts: Credits increase, Debits decrease
   * For INCOME accounts: Credits increase
   * For EXPENSE accounts: Debits increase
   */
  private async calculateAccountBalance(db: Knex, accountId: string, accountType: string): Promise<number> {
    const entries = await db('ledger_entries')
      .select('entry_type', db.raw('SUM(amount) as total'))
      .join('transactions', 'ledger_entries.transaction_id', 'transactions.id')
      .where('ledger_entries.account_id', accountId)
      .where('transactions.status', 'POSTED')
      .groupBy('entry_type');

    let debits = 0;
    let credits = 0;

    entries.forEach((entry) => {
      const total = parseFloat(entry.total || '0');
      if (entry.entry_type === 'DEBIT') {
        debits = total;
      } else {
        credits = total;
      }
    });

    // Calculate balance based on account type
    if (accountType === 'ASSET' || accountType === 'EXPENSE') {
      // Normal debit balance accounts
      return debits - credits;
    } else {
      // Normal credit balance accounts (LIABILITY, INCOME, EQUITY)
      return credits - debits;
    }
  }
}

export const accountsService = new AccountsService();
