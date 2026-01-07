import { getDatabase } from '@config/database';
import type {
  PayeTaxBand,
  NhifRate,
  NssfConfiguration,
  HousingLevyConfiguration,
  PayeCalculationInput,
  PayeCalculationResult,
} from './paye.types';

export class PayeService {
  /**
   * Get active tax bands for a given date
   */
  private async getTaxBands(date: Date): Promise<PayeTaxBand[]> {
    const db = getDatabase();

    const bands = await db<PayeTaxBand>('paye_tax_bands')
      .where('effective_from', '<=', date)
      .where((builder) => {
        builder.whereNull('effective_to').orWhere('effective_to', '>=', date);
      })
      .orderBy('band_order', 'asc');

    if (bands.length === 0) {
      throw new Error(`No tax bands found for date: ${date.toISOString().split('T')[0]}`);
    }

    return bands;
  }

  /**
   * Get NHIF rate for a given gross salary
   */
  private async getNhifContribution(grossSalary: number, date: Date): Promise<number> {
    const db = getDatabase();

    const rate = await db<NhifRate>('nhif_rates')
      .where('effective_from', '<=', date)
      .where((builder) => {
        builder.whereNull('effective_to').orWhere('effective_to', '>=', date);
      })
      .where('min_gross', '<=', grossSalary)
      .where((builder) => {
        builder.whereNull('max_gross').orWhere('max_gross', '>=', grossSalary);
      })
      .first();

    if (!rate) {
      throw new Error(`No NHIF rate found for gross salary: KES ${grossSalary}`);
    }

    return parseFloat(rate.contribution);
  }

  /**
   * Get NSSF configuration
   */
  private async getNssfConfiguration(date: Date): Promise<NssfConfiguration> {
    const db = getDatabase();

    const config = await db<NssfConfiguration>('nssf_configuration')
      .where('effective_from', '<=', date)
      .where((builder) => {
        builder.whereNull('effective_to').orWhere('effective_to', '>=', date);
      })
      .first();

    if (!config) {
      throw new Error(`No NSSF configuration found for date: ${date.toISOString().split('T')[0]}`);
    }

    return config;
  }

  /**
   * Get Housing Levy configuration
   */
  private async getHousingLevyConfiguration(date: Date): Promise<HousingLevyConfiguration> {
    const db = getDatabase();

    const config = await db<HousingLevyConfiguration>('housing_levy_configuration')
      .where('effective_from', '<=', date)
      .where((builder) => {
        builder.whereNull('effective_to').orWhere('effective_to', '>=', date);
      })
      .first();

    if (!config) {
      throw new Error(`No Housing Levy configuration found for date: ${date.toISOString().split('T')[0]}`);
    }

    return config;
  }

  /**
   * Calculate NSSF contributions
   */
  private calculateNssf(
    grossSalary: number,
    config: NssfConfiguration
  ): { tier1: number; tier2: number; total: number } {
    const tier1Limit = parseFloat(config.tier1_limit);
    const tier1Rate = parseFloat(config.tier1_rate);
    const tier2Limit = parseFloat(config.tier2_limit);
    const tier2Rate = parseFloat(config.tier2_rate);

    // Tier I: Up to tier1_limit (e.g., KES 7,000)
    const tier1Base = Math.min(grossSalary, tier1Limit);
    const tier1 = tier1Base * tier1Rate;

    // Tier II: From tier1_limit to tier2_limit (e.g., KES 7,001 - 36,000)
    let tier2 = 0;
    if (grossSalary > tier1Limit) {
      const tier2Base = Math.min(grossSalary, tier2Limit) - tier1Limit;
      tier2 = tier2Base * tier2Rate;
    }

    const total = tier1 + tier2;

    return {
      tier1: Math.round(tier1 * 100) / 100,
      tier2: Math.round(tier2 * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Calculate PAYE step-by-step through tax bands
   */
  private calculatePayeBeforeRelief(
    grossSalary: number,
    taxBands: PayeTaxBand[]
  ): {
    total: number;
    breakdown: { band_description: string; taxable_amount: number; rate: number; tax: number }[];
  } {
    let remainingIncome = grossSalary;
    let totalTax = 0;
    const breakdown: { band_description: string; taxable_amount: number; rate: number; tax: number }[] = [];

    for (const band of taxBands) {
      if (remainingIncome <= 0) break;

      const minAmount = parseFloat(band.min_amount);
      const maxAmount = band.max_amount ? parseFloat(band.max_amount) : Infinity;
      const rate = parseFloat(band.rate);

      // Calculate taxable amount in this band
      const bandWidth = maxAmount - minAmount;
      const taxableInBand = Math.min(remainingIncome, bandWidth);

      if (taxableInBand > 0) {
        const taxInBand = taxableInBand * rate;
        totalTax += taxInBand;

        breakdown.push({
          band_description: band.description,
          taxable_amount: Math.round(taxableInBand * 100) / 100,
          rate: rate,
          tax: Math.round(taxInBand * 100) / 100,
        });

        remainingIncome -= taxableInBand;
      }
    }

    return {
      total: Math.round(totalTax * 100) / 100,
      breakdown,
    };
  }

  /**
   * Calculate tax reliefs
   */
  private calculateReliefs(input: PayeCalculationInput): {
    personal_relief: number;
    insurance_relief: number;
    pension_relief: number;
    mortgage_relief: number;
    total: number;
    breakdown: { relief_type: string; amount: number }[];
  } {
    const breakdown: { relief_type: string; amount: number }[] = [];

    // Personal Relief (Fixed at KES 2,400/month in 2024)
    const personalRelief = 2400;
    breakdown.push({ relief_type: 'Personal Relief', amount: personalRelief });

    // Insurance Relief (15% of premiums, max KES 5,000/month)
    let insuranceRelief = 0;
    if (input.insurance_relief_amount && input.insurance_relief_amount > 0) {
      insuranceRelief = Math.min(input.insurance_relief_amount * 0.15, 5000);
      insuranceRelief = Math.round(insuranceRelief * 100) / 100;
      breakdown.push({ relief_type: 'Insurance Relief', amount: insuranceRelief });
    }

    // Pension Relief (30% of pension contribution, max 30% of salary or KES 20,000/month)
    let pensionRelief = 0;
    if (input.pension_contribution && input.pension_contribution > 0) {
      const maxPensionRelief = Math.min(input.gross_salary * 0.3, 20000);
      pensionRelief = Math.min(input.pension_contribution * 0.3, maxPensionRelief);
      pensionRelief = Math.round(pensionRelief * 100) / 100;
      breakdown.push({ relief_type: 'Pension Relief', amount: pensionRelief });
    }

    // Mortgage Interest Relief (max KES 25,000/month)
    let mortgageRelief = 0;
    if (input.mortgage_interest && input.mortgage_interest > 0) {
      mortgageRelief = Math.min(input.mortgage_interest, 25000);
      mortgageRelief = Math.round(mortgageRelief * 100) / 100;
      breakdown.push({ relief_type: 'Mortgage Interest Relief', amount: mortgageRelief });
    }

    const total = personalRelief + insuranceRelief + pensionRelief + mortgageRelief;

    return {
      personal_relief: personalRelief,
      insurance_relief: insuranceRelief,
      pension_relief: pensionRelief,
      mortgage_relief: mortgageRelief,
      total: Math.round(total * 100) / 100,
      breakdown,
    };
  }

  /**
   * Calculate PAYE for a given gross salary
   */
  async calculatePaye(input: PayeCalculationInput): Promise<PayeCalculationResult> {
    // Parse calculation date
    const calculationDate = input.calculation_date
      ? typeof input.calculation_date === 'string'
        ? new Date(input.calculation_date)
        : input.calculation_date
      : new Date();

    // Get tax configuration for the date
    const [taxBands, nssfConfig, housingLevyConfig] = await Promise.all([
      this.getTaxBands(calculationDate),
      this.getNssfConfiguration(calculationDate),
      this.getHousingLevyConfiguration(calculationDate),
    ]);

    // Calculate NHIF
    const nhif = input.nhif_override ?? (await this.getNhifContribution(input.gross_salary, calculationDate));

    // Calculate NSSF
    const nssfCalc = this.calculateNssf(input.gross_salary, nssfConfig);
    const nssf_tier1 = input.nssf_tier1_override ?? nssfCalc.tier1;
    const nssf_tier2 = input.nssf_tier2_override ?? nssfCalc.tier2;
    const nssf_total = nssf_tier1 + nssf_tier2;

    // Calculate Housing Levy (1.5% of gross)
    const housingLevyRate = parseFloat(housingLevyConfig.rate);
    const housing_levy = input.housing_levy_override ?? Math.round(input.gross_salary * housingLevyRate * 100) / 100;

    // Calculate PAYE before relief
    const payeCalc = this.calculatePayeBeforeRelief(input.gross_salary, taxBands);

    // Calculate reliefs
    const reliefs = this.calculateReliefs(input);

    // Calculate final PAYE (cannot be negative)
    const paye = Math.max(0, payeCalc.total - reliefs.total);

    // Calculate total deductions
    const total_deductions = paye + nhif + nssf_total + housing_levy;

    // Calculate net salary
    const net_salary = input.gross_salary - total_deductions;

    return {
      // Input
      gross_salary: input.gross_salary,
      calculation_date: calculationDate.toISOString().split('T')[0] || '',

      // PAYE Breakdown
      paye_before_relief: payeCalc.total,
      personal_relief: reliefs.personal_relief,
      insurance_relief: reliefs.insurance_relief,
      pension_relief: reliefs.pension_relief,
      mortgage_relief: reliefs.mortgage_relief,
      total_relief: reliefs.total,
      paye: Math.round(paye * 100) / 100,

      // Statutory Deductions
      nhif: Math.round(nhif * 100) / 100,
      nssf_tier1: Math.round(nssf_tier1 * 100) / 100,
      nssf_tier2: Math.round(nssf_tier2 * 100) / 100,
      nssf_total: Math.round(nssf_total * 100) / 100,
      housing_levy: Math.round(housing_levy * 100) / 100,

      // Totals
      total_deductions: Math.round(total_deductions * 100) / 100,
      net_salary: Math.round(net_salary * 100) / 100,

      // Calculation breakdown
      breakdown: {
        tax_bands: payeCalc.breakdown,
        reliefs: reliefs.breakdown,
      },
    };
  }

  /**
   * Get tax tables for a specific year
   */
  async getTaxTables(year: number): Promise<{
    paye_bands: PayeTaxBand[];
    nhif_rates: NhifRate[];
    nssf_config: NssfConfiguration | null;
    housing_levy_config: HousingLevyConfiguration | null;
  }> {
    const db = getDatabase();
    const date = new Date(`${year}-01-01`);

    const [paye_bands, nhif_rates, nssf_config, housing_levy_config] = await Promise.all([
      this.getTaxBands(date),
      db<NhifRate>('nhif_rates')
        .where('effective_from', '<=', date)
        .where((builder) => {
          builder.whereNull('effective_to').orWhere('effective_to', '>=', date);
        })
        .orderBy('min_gross', 'asc'),
      this.getNssfConfiguration(date),
      this.getHousingLevyConfiguration(date),
    ]);

    return {
      paye_bands,
      nhif_rates,
      nssf_config: nssf_config || null,
      housing_levy_config: housing_levy_config || null,
    };
  }
}
