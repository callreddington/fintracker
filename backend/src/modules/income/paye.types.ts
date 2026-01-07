// PAYE Tax Band
export interface PayeTaxBand {
  id: string;
  tax_year: number;
  effective_from: Date;
  effective_to: Date | null;
  min_amount: string;
  max_amount: string | null;
  rate: string;
  description: string;
  band_order: number;
  created_at: Date;
  updated_at: Date;
}

// NHIF Rate
export interface NhifRate {
  id: string;
  effective_from: Date;
  effective_to: Date | null;
  min_gross: string;
  max_gross: string | null;
  contribution: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// NSSF Configuration
export interface NssfConfiguration {
  id: string;
  effective_from: Date;
  effective_to: Date | null;
  tier1_limit: string;
  tier1_rate: string;
  tier2_limit: string;
  tier2_rate: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// Housing Levy Configuration
export interface HousingLevyConfiguration {
  id: string;
  effective_from: Date;
  effective_to: Date | null;
  rate: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// PAYE Calculation Input
export interface PayeCalculationInput {
  gross_salary: number;
  calculation_date?: Date | string;
  // Optional relief inputs
  insurance_relief_amount?: number; // Max KES 5,000/month
  pension_contribution?: number; // Max 30% of salary or KES 20,000/month
  mortgage_interest?: number; // Max KES 25,000/month
  // Optional manual overrides
  nhif_override?: number;
  nssf_tier1_override?: number;
  nssf_tier2_override?: number;
  housing_levy_override?: number;
}

// PAYE Calculation Result
export interface PayeCalculationResult {
  // Input
  gross_salary: number;
  calculation_date: string;

  // PAYE Breakdown
  paye_before_relief: number;
  personal_relief: number; // Fixed at KES 2,400/month
  insurance_relief: number;
  pension_relief: number;
  mortgage_relief: number;
  total_relief: number;
  paye: number; // Final PAYE after reliefs

  // Statutory Deductions
  nhif: number;
  nssf_tier1: number;
  nssf_tier2: number;
  nssf_total: number;
  housing_levy: number;

  // Totals
  total_deductions: number;
  net_salary: number;

  // Calculation breakdown (for transparency)
  breakdown: {
    tax_bands: {
      band_description: string;
      taxable_amount: number;
      rate: number;
      tax: number;
    }[];
    reliefs: {
      relief_type: string;
      amount: number;
    }[];
  };
}

// Employer
export interface Employer {
  id: string;
  user_id: string;
  name: string;
  pin_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_current: boolean;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

// Income Entry
export interface IncomeEntry {
  id: string;
  user_id: string;
  employer_id: string | null;
  transaction_id: string | null;
  income_type: string;
  income_date: Date;
  description: string;
  gross_amount: string;
  paye_before_relief: string;
  personal_relief: string;
  insurance_relief: string;
  pension_relief: string;
  mortgage_relief: string;
  paye: string;
  nhif: string;
  nssf_tier1: string;
  nssf_tier2: string;
  nssf_total: string;
  housing_levy: string;
  other_deductions: string;
  other_deductions_notes: string | null;
  net_amount: string;
  is_manual_override: boolean;
  override_notes: string | null;
  calculation_breakdown: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

// Create Income Entry Input
export interface CreateIncomeEntryInput {
  employer_id?: string;
  income_type: 'SALARY' | 'BUSINESS' | 'INVESTMENT' | 'OTHER';
  income_date: Date | string;
  description: string;
  gross_amount: number;

  // Optional relief inputs
  insurance_relief_amount?: number;
  pension_contribution?: number;
  mortgage_interest?: number;

  // Optional manual overrides
  is_manual_override?: boolean;
  override_notes?: string;
  nhif_override?: number;
  nssf_tier1_override?: number;
  nssf_tier2_override?: number;
  housing_levy_override?: number;
  paye_override?: number;

  // Other deductions
  other_deductions?: number;
  other_deductions_notes?: string;

  // Ledger integration
  create_transaction?: boolean; // Auto-create ledger transaction
  bank_account_id?: string; // Which account to credit
}
