import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/layout/page-header';

export default function GoalsPage() {
  const handleCreateGoal = () => {
    // TODO: Open create goal dialog/form
    console.log('Create goal clicked');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Set and track your financial goals"
        action={{
          label: 'Create Goal',
          onClick: handleCreateGoal,
        }}
      />

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
