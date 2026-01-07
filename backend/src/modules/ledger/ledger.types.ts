// Account Types
export type AccountType = 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_number: string | null;
  type: AccountType;
  subtype: string;
  currency: string;
  is_active: boolean;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  subtype: string;
  account_number?: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Transaction Types
export type TransactionStatus = 'DRAFT' | 'POSTED' | 'VOID';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  notes: string | null;
  transaction_date: Date;
  status: TransactionStatus;
  posted_at: Date | null;
  voided_at: Date | null;
  idempotency_key: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

// Ledger Entry Types
export type EntryType = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  entry_type: EntryType;
  amount: string; // Decimal as string for precision
  currency: string;
  description: string | null;
  created_at: Date;
}

export interface LedgerEntryInput {
  account_id: string;
  entry_type: EntryType;
  amount: number | string;
  description?: string;
}

// Transaction Creation Input
export interface CreateTransactionInput {
  description: string;
  notes?: string;
  transaction_date: Date | string;
  entries: LedgerEntryInput[];
  idempotency_key?: string;
  metadata?: Record<string, any>;
}

// Transaction with Entries (for responses)
export interface TransactionWithEntries extends Transaction {
  entries: (LedgerEntry & {
    account_name: string;
    account_type: AccountType;
  })[];
}

// Account Balance
export interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: AccountType;
  currency: string;
  current_balance: string; // Decimal as string
  entry_count: number;
  last_transaction_date: Date | null;
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
