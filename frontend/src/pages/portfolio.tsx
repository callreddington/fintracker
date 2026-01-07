import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';

export default function PortfolioPage() {
  const handleAddInvestment = () => {
    // TODO: Open add investment dialog/form
    console.log('Add investment clicked');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Track your investment portfolio"
        action={{
          label: 'Add Investment',
          onClick: handleAddInvestment,
        }}
      />

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
