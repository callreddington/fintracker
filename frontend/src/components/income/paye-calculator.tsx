import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator } from 'lucide-react';

const payeCalculatorSchema = z.object({
  gross_salary: z.string().min(1, 'Gross salary is required'),
  personal_relief_amount: z.string().optional(),
  insurance_relief_amount: z.string().optional(),
  pension_contribution: z.string().optional(),
  mortgage_interest: z.string().optional(),
});

type PayeCalculatorForm = z.infer<typeof payeCalculatorSchema>;

interface PayeResult {
  gross_salary: string;
  paye: string;
  paye_before_relief: string;
  personal_relief: string;
  insurance_relief: string;
  pension_relief: string;
  mortgage_relief: string;
  nhif: string;
  nssf_tier_1: string;
  nssf_tier_2: string;
  nssf_total: string;
  housing_levy: string;
  total_deductions: string;
  net_salary: string;
  breakdown: {
    tax_bands: Array<{
      band_description: string;
      taxable_amount: number;
      rate: number;
      tax: number;
    }>;
  };
}

export default function PayeCalculator() {
  const [result, setResult] = useState<PayeResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayeCalculatorForm>({
    resolver: zodResolver(payeCalculatorSchema),
  });

  const onSubmit = async (data: PayeCalculatorForm) => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/income/paye/calculate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gross_salary: parseFloat(data.gross_salary),
            personal_relief_amount: data.personal_relief_amount
              ? parseFloat(data.personal_relief_amount)
              : undefined,
            insurance_relief_amount: data.insurance_relief_amount
              ? parseFloat(data.insurance_relief_amount)
              : undefined,
            pension_contribution: data.pension_contribution
              ? parseFloat(data.pension_contribution)
              : undefined,
            mortgage_interest: data.mortgage_interest
              ? parseFloat(data.mortgage_interest)
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate PAYE');
      }

      const responseData = await response.json();
      setResult(responseData.calculation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calculator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            PAYE Calculator
          </CardTitle>
          <CardDescription>
            Calculate your PAYE, NHIF, NSSF, and Housing Levy based on 2024 KRA rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Gross Salary */}
            <div className="space-y-2">
              <Label htmlFor="gross_salary">
                Gross Salary (KES) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gross_salary"
                type="number"
                step="0.01"
                placeholder="e.g., 150000"
                {...register('gross_salary')}
              />
              {errors.gross_salary && (
                <p className="text-sm text-destructive">{errors.gross_salary.message}</p>
              )}
            </div>

            {/* Advanced Options Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_advanced"
                checked={showAdvanced}
                onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
              />
              <Label htmlFor="show_advanced" className="cursor-pointer text-sm font-normal">
                Show advanced tax relief options
              </Label>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="space-y-4 rounded-md border p-4">
                <p className="text-sm font-medium">Tax Reliefs (Optional)</p>

                <div className="space-y-2">
                  <Label htmlFor="personal_relief_amount" className="text-sm">
                    Personal Relief (default: KES 2,400)
                  </Label>
                  <Input
                    id="personal_relief_amount"
                    type="number"
                    step="0.01"
                    placeholder="2400"
                    {...register('personal_relief_amount')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurance_relief_amount" className="text-sm">
                    Insurance Relief Amount
                  </Label>
                  <Input
                    id="insurance_relief_amount"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register('insurance_relief_amount')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pension_contribution" className="text-sm">
                    Pension Contribution (30% of gross, max KES 20,000)
                  </Label>
                  <Input
                    id="pension_contribution"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register('pension_contribution')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mortgage_interest" className="text-sm">
                    Mortgage Interest (max KES 25,000/month)
                  </Label>
                  <Input
                    id="mortgage_interest"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register('mortgage_interest')}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isCalculating}>
              {isCalculating ? 'Calculating...' : 'Calculate PAYE'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>Breakdown of your salary and deductions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="space-y-2 rounded-md bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Gross Salary:</span>
                <span className="font-bold">{formatCurrency(result.gross_salary)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Deductions:</span>
                <span className="font-bold text-destructive">
                  -{formatCurrency(result.total_deductions)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-bold">Net Salary:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(result.net_salary)}
                </span>
              </div>
            </div>

            {/* PAYE Breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">PAYE (Income Tax)</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PAYE before relief:</span>
                  <span>{formatCurrency(result.paye_before_relief)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Personal relief:</span>
                  <span className="text-green-600">-{formatCurrency(result.personal_relief)}</span>
                </div>
                {parseFloat(result.insurance_relief) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance relief:</span>
                    <span className="text-green-600">
                      -{formatCurrency(result.insurance_relief)}
                    </span>
                  </div>
                )}
                {parseFloat(result.pension_relief) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pension relief:</span>
                    <span className="text-green-600">-{formatCurrency(result.pension_relief)}</span>
                  </div>
                )}
                {parseFloat(result.mortgage_relief) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mortgage relief:</span>
                    <span className="text-green-600">
                      -{formatCurrency(result.mortgage_relief)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Total PAYE:</span>
                  <span>{formatCurrency(result.paye)}</span>
                </div>
              </div>
            </div>

            {/* Statutory Deductions */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Statutory Deductions</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NHIF:</span>
                  <span>{formatCurrency(result.nhif)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NSSF Tier I:</span>
                  <span>{formatCurrency(result.nssf_tier_1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NSSF Tier II:</span>
                  <span>{formatCurrency(result.nssf_tier_2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Housing Levy:</span>
                  <span>{formatCurrency(result.housing_levy)}</span>
                </div>
              </div>
            </div>

            {/* Tax Bands */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">PAYE Tax Bands Applied</h4>
              <div className="space-y-1 text-xs">
                {result.breakdown.tax_bands.map((band, index) => (
                  <div key={index} className="flex justify-between text-muted-foreground">
                    <span>
                      {band.band_description} ({(band.rate * 100).toFixed(1)}%):
                    </span>
                    <span>{formatCurrency(band.tax)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
