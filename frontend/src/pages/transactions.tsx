import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';

export default function TransactionsPage() {
  const handleAddTransaction = () => {
    // TODO: Open add transaction dialog/form
    console.log('Add transaction clicked');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and manage all your transactions"
        action={{
          label: 'Add Transaction',
          onClick: handleAddTransaction,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Your complete transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
