import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('paye_tax_bands').del();
  await knex('nhif_rates').del();
  await knex('nssf_configuration').del();
  await knex('housing_levy_configuration').del();

  // PAYE Tax Bands for 2024 (Kenya)
  // Source: KRA Tax Rates 2024
  await knex('paye_tax_bands').insert([
    {
      tax_year: 2024,
      effective_from: '2024-01-01',
      effective_to: null, // Current
      min_amount: 0,
      max_amount: 24000,
      rate: 0.1, // 10%
      description: 'First KES 24,000 per month',
      band_order: 1,
    },
    {
      tax_year: 2024,
      effective_from: '2024-01-01',
      effective_to: null,
      min_amount: 24001,
      max_amount: 32333,
      rate: 0.25, // 25%
      description: 'Next KES 8,333 per month (24,001 - 32,333)',
      band_order: 2,
    },
    {
      tax_year: 2024,
      effective_from: '2024-01-01',
      effective_to: null,
      min_amount: 32334,
      max_amount: 500000,
      rate: 0.3, // 30%
      description: 'Next KES 467,667 per month (32,334 - 500,000)',
      band_order: 3,
    },
    {
      tax_year: 2024,
      effective_from: '2024-01-01',
      effective_to: null,
      min_amount: 500001,
      max_amount: 800000,
      rate: 0.325, // 32.5%
      description: 'Next KES 300,000 per month (500,001 - 800,000)',
      band_order: 4,
    },
    {
      tax_year: 2024,
      effective_from: '2024-01-01',
      effective_to: null,
      min_amount: 800001,
      max_amount: null, // Infinity
      rate: 0.35, // 35%
      description: 'Above KES 800,000 per month',
      band_order: 5,
    },
  ]);

  // NHIF Rates (2024)
  await knex('nhif_rates').insert([
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 0,
      max_gross: 5999,
      contribution: 150,
      description: 'Up to KES 5,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 6000,
      max_gross: 7999,
      contribution: 300,
      description: 'KES 6,000 - 7,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 8000,
      max_gross: 11999,
      contribution: 400,
      description: 'KES 8,000 - 11,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 12000,
      max_gross: 14999,
      contribution: 500,
      description: 'KES 12,000 - 14,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 15000,
      max_gross: 19999,
      contribution: 600,
      description: 'KES 15,000 - 19,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 20000,
      max_gross: 24999,
      contribution: 750,
      description: 'KES 20,000 - 24,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 25000,
      max_gross: 29999,
      contribution: 850,
      description: 'KES 25,000 - 29,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 30000,
      max_gross: 34999,
      contribution: 900,
      description: 'KES 30,000 - 34,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 35000,
      max_gross: 39999,
      contribution: 950,
      description: 'KES 35,000 - 39,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 40000,
      max_gross: 44999,
      contribution: 1000,
      description: 'KES 40,000 - 44,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 45000,
      max_gross: 49999,
      contribution: 1100,
      description: 'KES 45,000 - 49,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 50000,
      max_gross: 59999,
      contribution: 1200,
      description: 'KES 50,000 - 59,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 60000,
      max_gross: 69999,
      contribution: 1300,
      description: 'KES 60,000 - 69,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 70000,
      max_gross: 79999,
      contribution: 1400,
      description: 'KES 70,000 - 79,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 80000,
      max_gross: 89999,
      contribution: 1500,
      description: 'KES 80,000 - 89,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 90000,
      max_gross: 99999,
      contribution: 1600,
      description: 'KES 90,000 - 99,999',
    },
    {
      effective_from: '2024-01-01',
      effective_to: null,
      min_gross: 100000,
      max_gross: null,
      contribution: 1700,
      description: 'KES 100,000 and above',
    },
  ]);

  // NSSF Configuration (2024)
  await knex('nssf_configuration').insert({
    effective_from: '2024-01-01',
    effective_to: null,
    tier1_limit: 7000, // Lower Earnings Limit
    tier1_rate: 0.06, // 6%
    tier2_limit: 36000, // Upper Earnings Limit
    tier2_rate: 0.06, // 6%
    description: '2024 NSSF Rates (Tier I: KES 7,000, Tier II: KES 36,000)',
  });

  // Housing Levy Configuration (2024)
  await knex('housing_levy_configuration').insert({
    effective_from: '2024-01-01',
    effective_to: null,
    rate: 0.015, // 1.5%
    description: '2024 Affordable Housing Levy - 1.5% of gross salary',
  });
}
