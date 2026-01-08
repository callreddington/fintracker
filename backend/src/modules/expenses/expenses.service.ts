import { getDatabase } from '@/config/database';

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  account_id: string | null;
  description: string;
  amount: number;
  currency: string;
  expense_date: Date;
  merchant: string | null;
  payment_method: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_frequency: string | null;
  recurring_parent_id: string | null;
  notes: string | null;
  metadata: any;
  tags: string[] | null;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  category_color?: string;
}

export interface ExpenseSummary {
  total_expenses: number;
  transaction_count: number;
  average_expense: number;
  top_category: string | null;
  top_merchant: string | null;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_color: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface CreateExpenseDto {
  category_id: string;
  account_id?: string;
  description: string;
  amount: number;
  expense_date: Date;
  merchant?: string;
  payment_method?: string;
  reference_number?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  notes?: string;
  tags?: string[];
}

export class ExpensesService {
  /**
   * Get all expenses for a user with optional filtering
   */
  async getExpenses(
    userId: string,
    filters?: {
      category_id?: string;
      payment_method?: string;
      start_date?: Date;
      end_date?: Date;
    }
  ): Promise<Expense[]> {
    const db = getDatabase();

    let query = db('expenses')
      .select('expenses.*', 'categories.name as category_name', 'categories.color as category_color')
      .leftJoin('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .orderBy('expenses.expense_date', 'desc');

    if (filters?.category_id) {
      query = query.where('expenses.category_id', filters.category_id);
    }

    if (filters?.payment_method) {
      query = query.where('expenses.payment_method', filters.payment_method);
    }

    if (filters?.start_date) {
      query = query.where('expenses.expense_date', '>=', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.where('expenses.expense_date', '<=', filters.end_date);
    }

    const expenses = await query;

    return expenses.map((exp) => ({
      ...exp,
      amount: parseFloat(exp.amount),
    }));
  }

  /**
   * Get expense summary statistics
   */
  async getExpenseSummary(userId: string, start_date?: Date, end_date?: Date): Promise<ExpenseSummary> {
    const db = getDatabase();

    let query = db('expenses').where('user_id', userId);

    if (start_date) {
      query = query.where('expense_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('expense_date', '<=', end_date);
    }

    const [summary] = await query.sum('amount as total').count('* as count').avg('amount as average');

    // Get top category
    const [topCategory] = await db('expenses')
      .select('categories.name')
      .sum('expenses.amount as total')
      .join('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .modify((qb) => {
        if (start_date) qb.where('expense_date', '>=', start_date);
        if (end_date) qb.where('expense_date', '<=', end_date);
      })
      .groupBy('categories.id', 'categories.name')
      .orderBy('total', 'desc')
      .limit(1);

    // Get top merchant
    const [topMerchant] = await db('expenses')
      .select('merchant')
      .sum('amount as total')
      .where('user_id', userId)
      .whereNotNull('merchant')
      .modify((qb) => {
        if (start_date) qb.where('expense_date', '>=', start_date);
        if (end_date) qb.where('expense_date', '<=', end_date);
      })
      .groupBy('merchant')
      .orderBy('total', 'desc')
      .limit(1);

    return {
      total_expenses: parseFloat(summary?.total || '0'),
      transaction_count: parseInt(summary?.count || '0'),
      average_expense: parseFloat(summary?.average || '0'),
      top_category: topCategory?.name || null,
      top_merchant: topMerchant?.merchant || null,
    };
  }

  /**
   * Get expense breakdown by category
   */
  async getCategoryBreakdown(userId: string, start_date?: Date, end_date?: Date): Promise<CategoryBreakdown[]> {
    const db = getDatabase();

    let query = db('expenses')
      .select('categories.id as category_id', 'categories.name as category_name', 'categories.color as category_color')
      .sum('expenses.amount as total_amount')
      .count('expenses.id as transaction_count')
      .join('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .groupBy('categories.id', 'categories.name', 'categories.color')
      .orderBy('total_amount', 'desc');

    if (start_date) {
      query = query.where('expenses.expense_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('expenses.expense_date', '<=', end_date);
    }

    const breakdown = await query;

    const total = breakdown.reduce((sum, cat) => sum + parseFloat(cat.total_amount), 0);

    return breakdown.map((cat) => ({
      category_id: cat.category_id,
      category_name: cat.category_name,
      category_color: cat.category_color || '#6366f1',
      total_amount: parseFloat(cat.total_amount),
      transaction_count: parseInt(cat.transaction_count),
      percentage: total > 0 ? Math.round((parseFloat(cat.total_amount) / total) * 100 * 10) / 10 : 0,
    }));
  }

  /**
   * Create a new expense
   */
  async createExpense(userId: string, data: CreateExpenseDto): Promise<Expense> {
    const db = getDatabase();

    const [expense] = await db('expenses')
      .insert({
        user_id: userId,
        category_id: data.category_id,
        account_id: data.account_id || null,
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        merchant: data.merchant || null,
        payment_method: data.payment_method || null,
        reference_number: data.reference_number || null,
        receipt_url: data.receipt_url || null,
        is_recurring: data.is_recurring || false,
        recurring_frequency: data.recurring_frequency || null,
        notes: data.notes || null,
        tags: data.tags || null,
      })
      .returning('*');

    return {
      ...expense,
      amount: parseFloat(expense.amount),
    };
  }

  /**
   * Delete an expense
   */
  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    const db = getDatabase();

    await db('expenses').where({ id: expenseId, user_id: userId }).delete();
  }
}

export const expensesService = new ExpensesService();
