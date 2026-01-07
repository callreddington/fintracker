// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// Transaction types
export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  transaction_date: string;
  status: 'DRAFT' | 'POSTED' | 'VOID';
  created_at: string;
  updated_at: string;
}

// Account types
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
  subtype: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Budget types
export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}
