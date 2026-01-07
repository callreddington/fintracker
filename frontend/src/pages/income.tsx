import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function IncomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Income</h1>
        <p className="text-muted-foreground">Track your salary and other income sources</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
          <CardDescription>Manage your income streams</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No income records yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
