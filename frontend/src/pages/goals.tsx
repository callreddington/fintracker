import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="text-muted-foreground">Set and track your financial goals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
          <CardDescription>Monitor progress towards your savings targets</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No goals set yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
