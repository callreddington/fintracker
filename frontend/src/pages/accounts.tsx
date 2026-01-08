import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/lib/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet,
  Building2,
  TrendingUp,
  CreditCard,
  Plus,
  ArrowLeftRight,
  DollarSign,
  Smartphone,
  Landmark,
  PiggyBank,
} from 'lucide-react';

interface Account {
  id: string;
  name: string;
  account_number: string | null;
  type: string;
  subtype: string;
  balance: number;
  currency: string;
  institution?: string;
  interest_rate?: number;
  is_active: boolean;
}

interface AccountSummary {
  total_net_worth: number;
  liquid_cash: number;
  investments: number;
  virtual: number;
  total_assets: number;
  total_liabilities: number;
}

type FilterType = 'ALL' | 'CASH' | 'INVESTMENT' | 'VIRTUAL';

export default function AccountsPage() {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const { getAccessToken } = useAuthStore();

  const { data: summary, isLoading: summaryLoading } = useQuery<AccountSummary>({
    queryKey: ['account-summary'],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/accounts/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.summary;
    },
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const token = await getAccessToken();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/accounts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.accounts;
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

  const getAccountIcon = (subtype: string) => {
    switch (subtype.toUpperCase()) {
      case 'BANK':
        return <Landmark className="h-6 w-6" />;
      case 'MPESA':
        return <Smartphone className="h-6 w-6" />;
      case 'CASH':
        return <Wallet className="h-6 w-6" />;
      case 'INVESTMENT':
        return <TrendingUp className="h-6 w-6" />;
      case 'VIRTUAL':
        return <CreditCard className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

  const getAccountColor = (subtype: string) => {
    switch (subtype.toUpperCase()) {
      case 'BANK':
        return 'bg-blue-500';
      case 'MPESA':
        return 'bg-green-500';
      case 'CASH':
        return 'bg-yellow-500';
      case 'INVESTMENT':
        return 'bg-purple-500';
      case 'VIRTUAL':
        return 'bg-gray-500';
      default:
        return 'bg-indigo-500';
    }
  };

  const filterAccounts = (accounts: Account[] | undefined) => {
    if (!accounts) return [];

    if (filter === 'ALL') return accounts;

    if (filter === 'CASH') {
      return accounts.filter((acc) =>
        ['BANK', 'MPESA', 'CASH'].includes(acc.subtype.toUpperCase())
      );
    }

    if (filter === 'INVESTMENT') {
      return accounts.filter((acc) => acc.subtype.toUpperCase() === 'INVESTMENT');
    }

    if (filter === 'VIRTUAL') {
      return accounts.filter((acc) => acc.subtype.toUpperCase() === 'VIRTUAL');
    }

    return accounts;
  };

  if (summaryLoading || accountsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredAccounts = filterAccounts(accounts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, investments, and wallets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Transfer Money
          </Button>
          <Button variant="outline" size="sm">
            <DollarSign className="mr-2 h-4 w-4" />
            Record Investment Return
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.total_net_worth || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Assets: {formatCurrency(summary?.total_assets || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquid Cash</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.liquid_cash || 0)}</div>
            <p className="text-xs text-muted-foreground">Cash, Bank, M-Pesa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.investments || 0)}</div>
            <p className="text-xs text-muted-foreground">Stocks, Bonds, Real Estate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virtual</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.virtual || 0)}</div>
            <p className="text-xs text-muted-foreground">Digital wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value: string) => setFilter(value as FilterType)}>
        <TabsList>
          <TabsTrigger value="ALL">All ({accounts?.length || 0})</TabsTrigger>
          <TabsTrigger value="CASH">
            Cash (
            {accounts?.filter((a) => ['BANK', 'MPESA', 'CASH'].includes(a.subtype.toUpperCase()))
              .length || 0}
            )
          </TabsTrigger>
          <TabsTrigger value="INVESTMENT">
            Investments (
            {accounts?.filter((a) => a.subtype.toUpperCase() === 'INVESTMENT').length || 0})
          </TabsTrigger>
          <TabsTrigger value="VIRTUAL">
            Virtual ({accounts?.filter((a) => a.subtype.toUpperCase() === 'VIRTUAL').length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredAccounts && filteredAccounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((account) => (
                <Card key={account.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 text-white ${getAccountColor(account.subtype)}`}
                        >
                          {getAccountIcon(account.subtype)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          <CardDescription>
                            {account.subtype.charAt(0) + account.subtype.slice(1).toLowerCase()}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                    </div>

                    {account.institution && (
                      <div>
                        <p className="text-xs text-muted-foreground">Institution</p>
                        <p className="text-sm font-medium">{account.institution}</p>
                      </div>
                    )}

                    {account.account_number && (
                      <div>
                        <p className="text-xs text-muted-foreground">Account Number</p>
                        <p className="font-mono text-sm">****{account.account_number.slice(-4)}</p>
                      </div>
                    )}

                    {account.interest_rate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Interest Rate</p>
                        <p className="text-sm font-medium">{account.interest_rate}% p.a.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">
                  No accounts found. Click "Add Account" to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
