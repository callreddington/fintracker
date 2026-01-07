import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth.store';
import axios from 'axios';

const incomeEntrySchema = z.object({
  entry_date: z.string().min(1, 'Date is required'),
  gross_amount: z.string().min(1, 'Gross salary is required'),
  employer_name: z.string().optional(),
  employer_pin: z.string().optional(),
  bank_account_id: z.string().optional(),
  description: z.string().optional(),
  create_transaction: z.boolean().default(true),
  // Tax reliefs
  personal_relief_amount: z.string().optional(),
  insurance_relief_amount: z.string().optional(),
  pension_contribution: z.string().optional(),
  mortgage_interest: z.string().optional(),
});

type IncomeEntryForm = z.infer<typeof incomeEntrySchema>;

interface AddIncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Account {
  id: string;
  name: string;
  account_type: string;
}

export default function AddIncomeDialog({ open, onOpenChange, onSuccess }: AddIncomeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [createTransaction, setCreateTransaction] = useState(true);
  const { getAccessToken } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<IncomeEntryForm>({
    resolver: zodResolver(incomeEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().split('T')[0],
      create_transaction: true,
    },
  });

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const token = await getAccessToken();
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/ledger/accounts`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { account_type: 'BANK' },
          }
        );
        setBankAccounts(response.data.accounts || []);
      } catch (err) {
        console.error('Failed to fetch bank accounts:', err);
      }
    };

    if (open) {
      fetchAccounts();
    }
  }, [open, getAccessToken]);

  const onSubmit = async (data: IncomeEntryForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getAccessToken();

      const payload = {
        entry_date: data.entry_date,
        gross_amount: parseFloat(data.gross_amount),
        employer_name: data.employer_name || undefined,
        employer_pin: data.employer_pin || undefined,
        bank_account_id: data.bank_account_id || undefined,
        description: data.description || undefined,
        create_transaction: createTransaction,
        personal_relief_amount: data.personal_relief_amount
          ? parseFloat(data.personal_relief_amount)
          : undefined,
        insurance_relief_amount: data.insurance_relief_amount
          ? parseFloat(data.insurance_relief_amount)
          : undefined,
        pension_contribution: data.pension_contribution
          ? parseFloat(data.pension_contribution)
          : undefined,
        mortgage_interest: data.mortgage_interest ? parseFloat(data.mortgage_interest) : undefined,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/income/entries`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Failed to create income entry');
      } else {
        setError('An error occurred while creating income entry');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Income Entry</DialogTitle>
          <DialogDescription>
            Record your salary or other income with automatic tax calculations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Date and Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry_date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input id="entry_date" type="date" {...register('entry_date')} />
              {errors.entry_date && (
                <p className="text-sm text-destructive">{errors.entry_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gross_amount">
                Gross Salary (KES) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gross_amount"
                type="number"
                step="0.01"
                placeholder="e.g., 150000"
                {...register('gross_amount')}
              />
              {errors.gross_amount && (
                <p className="text-sm text-destructive">{errors.gross_amount.message}</p>
              )}
            </div>
          </div>

          {/* Employer Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employer_name">Employer Name</Label>
              <Input
                id="employer_name"
                placeholder="e.g., ABC Company Ltd"
                {...register('employer_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer_pin">Employer KRA PIN</Label>
              <Input
                id="employer_pin"
                placeholder="e.g., P000000000A"
                {...register('employer_pin')}
              />
            </div>
          </div>

          {/* Bank Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank_account_id">Bank Account (Optional)</Label>
            <Select onValueChange={(value) => setValue('bank_account_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
                {bankAccounts.length === 0 && (
                  <SelectItem value="none" disabled>
                    No bank accounts found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select a bank account to automatically create a ledger transaction
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="e.g., January 2024 Salary"
              {...register('description')}
            />
          </div>

          {/* Create Transaction Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="create_transaction"
              checked={createTransaction}
              onCheckedChange={(checked) => setCreateTransaction(checked as boolean)}
            />
            <Label htmlFor="create_transaction" className="cursor-pointer text-sm font-normal">
              Create ledger transaction (recommended)
            </Label>
          </div>

          {/* Advanced Tax Reliefs */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_advanced"
              checked={showAdvanced}
              onCheckedChange={(checked) => setShowAdvanced(checked as boolean)}
            />
            <Label htmlFor="show_advanced" className="cursor-pointer text-sm font-normal">
              Configure tax reliefs
            </Label>
          </div>

          {showAdvanced && (
            <div className="space-y-4 rounded-md border p-4">
              <p className="text-sm font-medium">Tax Reliefs (Optional)</p>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    Insurance Relief
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
                    Pension Contribution
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
                    Mortgage Interest
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
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Income Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
