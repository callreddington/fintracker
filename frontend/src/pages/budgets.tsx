import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budgets</h1>
        <p className="text-muted-foreground">Plan and track your monthly budgets</p>
      </div>

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
