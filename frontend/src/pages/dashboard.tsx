import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

interface DashboardStats {
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

type PeriodType = 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

const periodLabels: Record<PeriodType, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  this_year: 'This Year',
};

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodType>('this_month');
  const { getAccessToken } = useAuthStore();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', period],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/dashboard/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { period },
        }
      );
      return response.data.stats;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Your financial overview for {periodLabels[period].toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {periodLabels[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Wallet className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.current_period.total_income)}
            </div>
            <div className="mt-1 flex items-center text-xs">
              {stats.comparison.income_change >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4" />
              )}
              <span>{formatPercentage(stats.comparison.income_change)} from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.current_period.total_expenses)}
            </div>
            <div className="mt-1 flex items-center text-xs">
              {stats.comparison.expense_change >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4" />
              )}
              <span>{formatPercentage(stats.comparison.expense_change)} from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <PiggyBank className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.current_period.net_savings)}
            </div>
            <div className="mt-1 flex items-center text-xs">
              {stats.comparison.savings_change >= 0 ? (
                <TrendingUp className="mr-1 h-4 w-4" />
              ) : (
                <TrendingDown className="mr-1 h-4 w-4" />
              )}
              <span>{formatPercentage(stats.comparison.savings_change)} from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.current_period.savings_rate.toFixed(1)}%
            </div>
            <p className="mt-1 text-xs">{stats.current_period.transaction_count} transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Monthly Comparison & Spending Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>Income vs Expenses vs Savings</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Current',
                    Income: stats.current_period.total_income,
                    Expenses: stats.current_period.total_expenses,
                    Savings: stats.current_period.net_savings,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="Income" fill="#3b82f6" />
                <Bar dataKey="Expenses" fill="#ef4444" />
                <Bar dataKey="Savings" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Expense breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.spending_by_category.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.spending_by_category}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.category} (${entry.percentage}%)`}
                  >
                    {stats.spending_by_category.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">No expense data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Spending Categories</CardTitle>
          <CardDescription>Your highest expense categories this period</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.top_categories.length > 0 ? (
            <div className="space-y-4">
              {stats.top_categories.map((category) => (
                <div key={category.category}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.amount)} ({category.percentage_of_total}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${category.percentage_of_total}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No category data available</p>
          )}
        </CardContent>
      </Card>

      {/* 12-Month Trend */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Financial Trend</CardTitle>
          <CardDescription>Income, expenses, and savings over the past year</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthly_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stackId="3"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* YTD Progress & Financial Health Score */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Year-to-Date Progress</CardTitle>
            <CardDescription>Your financial goals for {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Income Goal</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(stats.ytd_progress.total_income)} /{' '}
                  {formatCurrency(stats.ytd_progress.income_goal)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(100, (stats.ytd_progress.total_income / stats.ytd_progress.income_goal) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Expense Budget</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(stats.ytd_progress.total_expenses)} /{' '}
                  {formatCurrency(stats.ytd_progress.expense_budget)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-red-500 transition-all"
                  style={{
                    width: `${Math.min(100, (stats.ytd_progress.total_expenses / stats.ytd_progress.expense_budget) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Savings Goal</span>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(stats.ytd_progress.total_savings)} /{' '}
                  {formatCurrency(stats.ytd_progress.savings_goal)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{
                    width: `${Math.min(100, (stats.ytd_progress.total_savings / stats.ytd_progress.savings_goal) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Overall assessment of your financial health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="stroke-current text-secondary"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                  />
                  <circle
                    className="stroke-current transition-all"
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={getHealthScoreColor(stats.financial_health_score.overall_score)}
                    strokeDasharray={`${(stats.financial_health_score.overall_score / 100) * 251.2} 251.2`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">
                    {stats.financial_health_score.overall_score}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className="text-lg font-semibold">
                  {stats.financial_health_score.savings_rate_score}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emergency Fund</p>
                <p className="text-lg font-semibold">
                  {stats.financial_health_score.emergency_fund_score}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Debt Management</p>
                <p className="text-lg font-semibold">
                  {stats.financial_health_score.debt_management_score}/100
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget Adherence</p>
                <p className="text-lg font-semibold">
                  {stats.financial_health_score.budget_adherence_score}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Insights</CardTitle>
          <CardDescription>
            Personalized recommendations based on your spending patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.insights.length > 0 ? (
            <div className="space-y-3">
              {stats.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg border p-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              No insights available yet. Keep tracking your finances!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
