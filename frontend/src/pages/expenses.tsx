import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track and categorize your spending</p>
      </div>

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
