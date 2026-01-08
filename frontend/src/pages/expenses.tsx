import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CreditCard, TrendingDown, ShoppingCart, Plus, Calendar, Filter } from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category_name: string;
  category_color: string;
  merchant: string | null;
  payment_method: string | null;
}

interface ExpenseSummary {
  total_expenses: number;
  transaction_count: number;
  average_expense: number;
  top_category: string | null;
  top_merchant: string | null;
}

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_color: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export default function ExpensesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const { getAccessToken } = useAuthStore();

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ['expenses', categoryFilter, paymentFilter],
    queryFn: async () => {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category_id', categoryFilter);
      if (paymentFilter !== 'all') params.append('payment_method', paymentFilter);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/expenses?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.expenses;
    },
  });

  const { data: summary } = useQuery<ExpenseSummary>({
    queryKey: ['expense-summary'],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/expenses/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.summary;
    },
  });

  const { data: categoryBreakdown } = useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown'],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/expenses/category-breakdown`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.breakdown;
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

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return null;
    const colors: Record<string, string> = {
      CASH: 'bg-green-500',
      CARD: 'bg-blue-500',
      MPESA: 'bg-purple-500',
      BANK_TRANSFER: 'bg-orange-500',
    };
    return <Badge className={`${colors[method] || 'bg-gray-500'} text-white`}>{method}</Badge>;
  };

  // Get unique categories for filter
  const uniqueCategories = Array.from(
    new Set(expenses?.map((e) => ({ id: e.id, name: e.category_name })))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and categorize your spending</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.total_expenses || 0)}</div>
            <p className="text-xs opacity-90">{summary?.transaction_count || 0} transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.average_expense || 0)}
            </div>
            <p className="text-xs opacity-90">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.top_category || 'N/A'}</div>
            <p className="text-xs opacity-90">
              {summary?.top_merchant ? `at ${summary.top_merchant}` : 'Most spending'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {categoryBreakdown && categoryBreakdown.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Expense breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total_amount"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(item) => `${item.category_name} (${item.percentage}%)`}
                  >
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.category_id} fill={entry.category_color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
              <CardDescription>Categories with highest expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBreakdown.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="total_amount">
                    {categoryBreakdown.slice(0, 5).map((entry) => (
                      <Cell key={entry.category_id} fill={entry.category_color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>All your expense records</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat, idx) => (
                    <SelectItem key={idx} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="MPESA">M-Pesa</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!expenses || expenses.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                No expenses found. Click "Add Expense" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: expense.category_color }}
                      />
                      <span className="font-medium">{expense.category_name}</span>
                      {expense.payment_method && getPaymentMethodBadge(expense.payment_method)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{expense.description}</p>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(expense.expense_date), 'MMM d, yyyy')}</span>
                      </div>
                      {expense.merchant && <span>at {expense.merchant}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
