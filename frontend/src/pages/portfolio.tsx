import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track your investment portfolio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Investment Holdings</CardTitle>
          <CardDescription>Monitor your stocks, bonds, and other investments</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No investments tracked yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
