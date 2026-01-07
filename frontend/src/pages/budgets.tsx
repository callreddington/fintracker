import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';

export default function BudgetsPage() {
  const handleCreateBudget = () => {
    // TODO: Open create budget dialog/form
    console.log('Create budget clicked');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Plan and track your monthly budgets"
        action={{
          label: 'Create Budget',
          onClick: handleCreateBudget,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Monthly Budgets</CardTitle>
          <CardDescription>Monitor your spending against planned budgets</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No budgets created yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
