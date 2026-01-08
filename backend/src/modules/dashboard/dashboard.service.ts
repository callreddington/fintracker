import { getDatabase } from '@/config/database';
import { Knex } from 'knex';

export interface DashboardStats {
  current_period: {
    total_income: number;
    total_expenses: number;
    net_savings: number;
    savings_rate: number;
    transaction_count: number;
  };
  comparison: {
    income_change: number;
    expense_change: number;
    savings_change: number;
  };
  spending_by_category: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  top_categories: Array<{
    category: string;
    amount: number;
    budget: number | null;
    percentage_of_total: number;
  }>;
  monthly_trend: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
  ytd_progress: {
    total_income: number;
    total_expenses: number;
    total_savings: number;
    budget_vs_actual: number;
    income_goal: number;
    expense_budget: number;
    savings_goal: number;
  };
  insights: Array<{
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
  }>;
  financial_health_score: {
    overall_score: number;
    savings_rate_score: number;
    emergency_fund_score: number;
    debt_management_score: number;
    budget_adherence_score: number;
  };
}

export class DashboardService {
  /**
   * Get dashboard statistics for a user
   */
  async getDashboardStats(
    userId: string,
    period: 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom' = 'this_month',
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardStats> {
    const db = getDatabase();

    // Calculate date range based on period
    const dateRange = this.getDateRange(period, startDate, endDate);

    // Get current period stats
    const currentStats = await this.getCurrentPeriodStats(db, userId, dateRange.start, dateRange.end);

    // Get previous period for comparison
    const previousRange = this.getPreviousPeriod(dateRange.start, dateRange.end);
    const previousStats = await this.getCurrentPeriodStats(db, userId, previousRange.start, previousRange.end);

    // Calculate spending by category
    const spendingByCategory = await this.getSpendingByCategory(db, userId, dateRange.start, dateRange.end);

    // Get top spending categories
    const topCategories = await this.getTopCategories(db, userId, dateRange.start, dateRange.end);

    // Get 12-month trend
    const monthlyTrend = await this.getMonthlyTrend(db, userId);

    // Get YTD progress
    const ytdProgress = await this.getYTDProgress(db, userId);

    // Calculate financial health score
    const healthScore = await this.calculateFinancialHealthScore(db, userId);

    // Generate insights
    const insights = this.generateInsights(currentStats, previousStats, spendingByCategory);

    return {
      current_period: currentStats,
      comparison: {
        income_change: this.calculatePercentageChange(currentStats.total_income, previousStats.total_income),
        expense_change: this.calculatePercentageChange(currentStats.total_expenses, previousStats.total_expenses),
        savings_change: this.calculatePercentageChange(currentStats.net_savings, previousStats.net_savings),
      },
      spending_by_category: spendingByCategory,
      top_categories: topCategories,
      monthly_trend: monthlyTrend,
      ytd_progress: ytdProgress,
      insights,
      financial_health_score: healthScore,
    };
  }

  private getDateRange(period: string, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
    const now = new Date();

    if (period === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }

    switch (period) {
      case 'this_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        };
      case 'last_month':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      case 'this_quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          start: new Date(now.getFullYear(), quarter * 3, 1),
          end: new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59),
        };
      }
      case 'this_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
        };
      default:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        };
    }
  }

  private getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
    const duration = end.getTime() - start.getTime();
    return {
      start: new Date(start.getTime() - duration),
      end: new Date(start.getTime() - 1),
    };
  }

  private async getCurrentPeriodStats(
    db: Knex,
    userId: string,
    start: Date,
    end: Date
  ): Promise<DashboardStats['current_period']> {
    // Get income
    const income = await db('income_entries')
      .where('user_id', userId)
      .whereBetween('income_date', [start, end])
      .sum('net_amount as total')
      .count('* as count')
      .first();

    // Get expenses
    const expenses = await db('expenses')
      .where('user_id', userId)
      .whereBetween('expense_date', [start, end])
      .sum('amount as total')
      .count('* as count')
      .first();

    const totalIncome = parseFloat(income?.total || '0');
    const totalExpenses = parseFloat(expenses?.total || '0');
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    return {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_savings: netSavings,
      savings_rate: Math.round(savingsRate * 10) / 10,
      transaction_count: parseInt(income?.count || '0') + parseInt(expenses?.count || '0'),
    };
  }

  private async getSpendingByCategory(
    db: Knex,
    userId: string,
    start: Date,
    end: Date
  ): Promise<DashboardStats['spending_by_category']> {
    const categories = await db('expenses')
      .select('categories.name as category', 'categories.color')
      .sum('expenses.amount as amount')
      .join('categories', 'expenses.category_id', 'categories.id')
      .where('expenses.user_id', userId)
      .whereBetween('expenses.expense_date', [start, end])
      .groupBy('expenses.category_id', 'categories.name', 'categories.color')
      .orderBy('amount', 'desc');

    const total = categories.reduce((sum, cat) => sum + parseFloat(cat.amount), 0);

    return categories.map((cat) => ({
      category: cat.category,
      amount: parseFloat(cat.amount),
      percentage: total > 0 ? Math.round((parseFloat(cat.amount) / total) * 100 * 10) / 10 : 0,
      color: cat.color || '#6366f1',
    }));
  }

  private async getTopCategories(
    db: Knex,
    userId: string,
    start: Date,
    end: Date
  ): Promise<DashboardStats['top_categories']> {
    const categories = await db('expenses')
      .select('categories.name as category')
      .sum('expenses.amount as amount')
      .join('categories', 'expenses.category_id', 'categories.id')
      .leftJoin('budgets', function () {
        this.on('budgets.category_id', '=', 'expenses.category_id').andOn('budgets.user_id', '=', 'expenses.user_id');
      })
      .where('expenses.user_id', userId)
      .whereBetween('expenses.expense_date', [start, end])
      .groupBy('expenses.category_id', 'categories.name')
      .orderBy('amount', 'desc')
      .limit(5);

    const total = categories.reduce((sum, cat) => sum + parseFloat(cat.amount), 0);

    return categories.map((cat) => ({
      category: cat.category,
      amount: parseFloat(cat.amount),
      budget: null, // Will be enhanced later
      percentage_of_total: total > 0 ? Math.round((parseFloat(cat.amount) / total) * 100 * 10) / 10 : 0,
    }));
  }

  private async getMonthlyTrend(db: Knex, userId: string): Promise<DashboardStats['monthly_trend']> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Get income by month
    const incomeData = await db('income_entries')
      .select(db.raw("TO_CHAR(income_date, 'YYYY-MM') as month"))
      .sum('net_amount as total')
      .where('user_id', userId)
      .where('income_date', '>=', twelveMonthsAgo)
      .groupBy(db.raw("TO_CHAR(income_date, 'YYYY-MM')"))
      .orderBy('month');

    // Get expenses by month
    const expenseData = await db('expenses')
      .select(db.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"))
      .sum('amount as total')
      .where('user_id', userId)
      .where('expense_date', '>=', twelveMonthsAgo)
      .groupBy(db.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .orderBy('month');

    // Merge data
    const months = this.getLast12Months();
    return months.map((month) => {
      const income = incomeData.find((d: any) => d.month === month);
      const expense = expenseData.find((d: any) => d.month === month);
      const incomeAmount = parseFloat(income?.total || '0');
      const expenseAmount = parseFloat(expense?.total || '0');

      return {
        month,
        income: incomeAmount,
        expenses: expenseAmount,
        savings: incomeAmount - expenseAmount,
      };
    });
  }

  private getLast12Months(): string[] {
    const months: string[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }

    return months;
  }

  private async getYTDProgress(db: Knex, userId: string): Promise<DashboardStats['ytd_progress']> {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const now = new Date();

    const ytdStats = await this.getCurrentPeriodStats(db, userId, yearStart, now);

    return {
      total_income: ytdStats.total_income,
      total_expenses: ytdStats.total_expenses,
      total_savings: ytdStats.net_savings,
      budget_vs_actual: 0, // Will calculate from budgets
      income_goal: ytdStats.total_income * 1.1, // Placeholder: 10% growth
      expense_budget: ytdStats.total_expenses * 0.9, // Placeholder: reduce by 10%
      savings_goal: ytdStats.total_income * 0.2, // Placeholder: 20% savings rate
    };
  }

  private async calculateFinancialHealthScore(
    db: Knex,
    userId: string
  ): Promise<DashboardStats['financial_health_score']> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = await this.getCurrentPeriodStats(db, userId, monthStart, now);

    // Savings rate score (0-100)
    const savingsRateScore = Math.min(100, Math.max(0, stats.savings_rate * 5));

    // Budget adherence (placeholder - will enhance)
    const budgetAdherenceScore = 70;

    // Emergency fund (placeholder - will enhance)
    const emergencyFundScore = 60;

    // Debt management (placeholder - will enhance)
    const debtManagementScore = 80;

    // Overall score (weighted average)
    const overallScore = Math.round(
      savingsRateScore * 0.3 + budgetAdherenceScore * 0.25 + emergencyFundScore * 0.25 + debtManagementScore * 0.2
    );

    return {
      overall_score: overallScore,
      savings_rate_score: Math.round(savingsRateScore),
      emergency_fund_score: emergencyFundScore,
      debt_management_score: debtManagementScore,
      budget_adherence_score: budgetAdherenceScore,
    };
  }

  private generateInsights(
    current: DashboardStats['current_period'],
    previous: DashboardStats['current_period'],
    categories: DashboardStats['spending_by_category']
  ): DashboardStats['insights'] {
    const insights: DashboardStats['insights'] = [];

    // Savings rate insight
    if (current.savings_rate >= 20) {
      insights.push({
        type: 'success',
        title: 'Excellent savings rate',
        message: `Your savings rate of ${current.savings_rate}% is above the recommended 20%. Keep up the great work!`,
      });
    } else if (current.savings_rate < 10) {
      insights.push({
        type: 'warning',
        title: 'Low savings rate',
        message: `Your savings rate of ${current.savings_rate}% is below the recommended 20%. Consider reducing expenses.`,
      });
    }

    // Highest spending category
    if (categories.length > 0) {
      const highest = categories[0];
      if (highest) {
        insights.push({
          type: 'info',
          title: `Highest expense: ${highest.category}`,
          message: `${highest.category} accounts for KES ${highest.amount.toLocaleString()} (${highest.percentage}%). Consider if this can be optimized.`,
        });
      }
    }

    // Income change
    const incomeChange = this.calculatePercentageChange(current.total_income, previous.total_income);
    if (Math.abs(incomeChange) > 10) {
      insights.push({
        type: incomeChange > 0 ? 'success' : 'warning',
        title: `Income ${incomeChange > 0 ? 'increased' : 'decreased'}`,
        message: `Your income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChange).toFixed(1)}% compared to last period.`,
      });
    }

    return insights;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }
}

export const dashboardService = new DashboardService();
