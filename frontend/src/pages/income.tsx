import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';
import AddIncomeDialog from '@/components/income/add-income-dialog';
import { useAuthStore } from '@/lib/auth.store';
import axios from 'axios';
import { format } from 'date-fns';

interface IncomeEntry {
  id: string;
  entry_date: string;
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

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        description="Track your salary and other income sources"
        action={{
          label: 'Add Income',
          onClick: handleAddIncome,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Income Entries</CardTitle>
          <CardDescription>Your salary and other income records</CardDescription>
        </CardHeader>
        <CardContent>
          {!incomeEntries || incomeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No income records yet. Click "Add Income" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {incomeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.employer_name || 'Income Entry'}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(entry.entry_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-sm text-muted-foreground">{entry.description}</p>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Gross:</span>{' '}
                        <span className="font-medium">{formatCurrency(entry.gross_amount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAYE:</span>{' '}
                        <span className="font-medium">{formatCurrency(entry.paye)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NHIF:</span>{' '}
                        <span className="font-medium">{formatCurrency(entry.nhif)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NSSF:</span>{' '}
                        <span className="font-medium">{formatCurrency(entry.nssf_total)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Net Salary</p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(entry.net_amount)}
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
