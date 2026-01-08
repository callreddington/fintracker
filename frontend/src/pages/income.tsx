import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuthStore } from '@/lib/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddIncomeDialog from '@/components/income/add-income-dialog';
import {
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DollarSign, TrendingUp, Calendar, Plus, Wallet } from 'lucide-react';

interface IncomeEntry {
  id: string;
  income_date: string;
  income_type: string;
  gross_amount: string;
  paye: string;
  nhif: string;
  nssf_total: string;
  housing_levy: string;
  net_amount: string;
  employer_name?: string;
  description?: string;
}

export default function IncomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getAccessToken } = useAuthStore();

  const { data: incomeEntries, refetch } = useQuery({
    queryKey: ['income-entries'],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/income/entries`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.entries as IncomeEntry[];
    },
  });

  const handleAddIncome = () => {
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getIncomeTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SALARY':
        return 'bg-blue-500';
      case 'BUSINESS':
        return 'bg-green-500';
      case 'INVESTMENT':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate statistics
  const totalIncome =
    incomeEntries?.reduce((sum, entry) => sum + parseFloat(entry.net_amount), 0) || 0;
  const totalGross =
    incomeEntries?.reduce((sum, entry) => sum + parseFloat(entry.gross_amount), 0) || 0;
  const totalDeductions = totalGross - totalIncome;

  // Income by type for pie chart
  const incomeByType =
    incomeEntries?.reduce(
      (acc, entry) => {
        const type = entry.income_type || 'OTHER';
        const amount = parseFloat(entry.net_amount);
        const existing = acc.find((item) => item.name === type);
        if (existing) {
          existing.value += amount;
        } else {
          acc.push({
            name: type,
            value: amount,
          });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    ) || [];

  // Income trend by month
  const incomeTrend =
    incomeEntries?.reduce(
      (acc, entry) => {
        const month = format(new Date(entry.income_date), 'MMM yyyy');
        const amount = parseFloat(entry.net_amount);
        const existing = acc.find((item) => item.month === month);
        if (existing) {
          existing.amount += amount;
        } else {
          acc.push({
            month,
            amount,
          });
        }
        return acc;
      },
      [] as Array<{ month: string; amount: number }>
    ) || [];

  const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Income</h1>
          <p className="text-muted-foreground">Track your salary and other income sources</p>
        </div>
        <Button onClick={handleAddIncome}>
          <Plus className="mr-2 h-4 w-4" />
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            <p className="text-xs text-muted-foreground">Net amount received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGross)}</div>
            <p className="text-xs text-muted-foreground">Before deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeductions)}</div>
            <p className="text-xs text-muted-foreground">PAYE, NHIF, NSSF, Housing</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {incomeEntries && incomeEntries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Income by Type</CardTitle>
              <CardDescription>Breakdown of income sources</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(item) => `${item.name} (${formatCurrency(item.value)})`}
                    >
                      {incomeByType.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income Trend</CardTitle>
              <CardDescription>Monthly income over time</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={incomeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Income Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Income History</CardTitle>
          <CardDescription>All your income records</CardDescription>
        </CardHeader>
        <CardContent>
          {!incomeEntries || incomeEntries.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">
                No income records yet. Click "Add Income" to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getIncomeTypeColor(entry.income_type)} text-white`}>
                        {entry.income_type}
                      </Badge>
                      <p className="font-medium">{entry.employer_name || 'Income Entry'}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(entry.income_date), 'MMM d, yyyy')}</span>
                    </div>
                    {entry.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                      <div>
                        <span className="text-muted-foreground">Gross:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(parseFloat(entry.gross_amount))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAYE:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(parseFloat(entry.paye))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NHIF:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(parseFloat(entry.nhif))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NSSF:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(parseFloat(entry.nssf_total))}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Housing:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(parseFloat(entry.housing_levy))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net Income</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(parseFloat(entry.net_amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddIncomeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
