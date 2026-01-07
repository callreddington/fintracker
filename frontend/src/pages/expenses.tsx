import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';

export default function ExpensesPage() {
  const handleAddExpense = () => {
    // TODO: Open add expense dialog/form
    console.log('Add expense clicked');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and categorize your spending"
        action={{
          label: 'Add Expense',
          onClick: handleAddExpense,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>View your spending patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
