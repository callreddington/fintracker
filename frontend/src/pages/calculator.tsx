import PageHeader from '@/components/layout/page-header';
import PayeCalculator from '@/components/income/paye-calculator';

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="PAYE Calculator"
        description="Calculate your Kenya PAYE, NHIF, NSSF, and Housing Levy based on 2024 KRA rates"
      />

      <PayeCalculator />
    </div>
  );
}
