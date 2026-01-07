import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create PAYE tax bands table (versioned for different tax years)
  await knex.schema.createTable('paye_tax_bands', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Tax year and effective dates
    table.integer('tax_year').notNullable(); // e.g., 2024, 2025
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable(); // NULL = current/active

    // Tax band definition
    table.decimal('min_amount', 18, 4).notNullable(); // Lower bound (inclusive)
    table.decimal('max_amount', 18, 4).nullable(); // Upper bound (NULL = infinity)
    table.decimal('rate', 5, 4).notNullable(); // Tax rate as decimal (e.g., 0.10 = 10%)

    // Description
    table.string('description', 255).notNullable(); // e.g., "First KES 24,000"

    // Sort order
    table.integer('band_order').notNullable(); // For ordering bands (1, 2, 3...)

    // Metadata
    table.jsonb('metadata').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['tax_year', 'effective_from']);
    table.index(['effective_from', 'effective_to']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_paye_tax_bands_updated_at
    BEFORE UPDATE ON paye_tax_bands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create NHIF rates table
  await knex.schema.createTable('nhif_rates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Effective dates
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable(); // NULL = current/active

    // Income bracket
    table.decimal('min_gross', 18, 4).notNullable();
    table.decimal('max_gross', 18, 4).nullable(); // NULL = infinity

    // NHIF contribution (fixed amount per bracket)
    table.decimal('contribution', 18, 4).notNullable();

    // Description
    table.string('description', 255).notNullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['effective_from', 'effective_to']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_nhif_rates_updated_at
    BEFORE UPDATE ON nhif_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create NSSF configuration table
  await knex.schema.createTable('nssf_configuration', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Effective dates
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable(); // NULL = current/active

    // Tier I (Lower Earnings)
    table.decimal('tier1_limit', 18, 4).notNullable(); // e.g., 7,000
    table.decimal('tier1_rate', 5, 4).notNullable(); // e.g., 0.06 (6%)

    // Tier II (Upper Earnings)
    table.decimal('tier2_limit', 18, 4).notNullable(); // e.g., 36,000
    table.decimal('tier2_rate', 5, 4).notNullable(); // e.g., 0.06 (6%)

    // Description
    table.string('description', 255).notNullable();

    // Metadata
    table.jsonb('metadata').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['effective_from', 'effective_to']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_nssf_configuration_updated_at
    BEFORE UPDATE ON nssf_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create housing levy configuration table
  await knex.schema.createTable('housing_levy_configuration', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Effective dates
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable(); // NULL = current/active

    // Levy rate
    table.decimal('rate', 5, 4).notNullable(); // e.g., 0.015 (1.5%)

    // Description
    table.string('description', 255).notNullable();

    // Metadata
    table.jsonb('metadata').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['effective_from', 'effective_to']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_housing_levy_configuration_updated_at
    BEFORE UPDATE ON housing_levy_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_housing_levy_configuration_updated_at ON housing_levy_configuration');
  await knex.schema.dropTableIfExists('housing_levy_configuration');

  await knex.raw('DROP TRIGGER IF EXISTS update_nssf_configuration_updated_at ON nssf_configuration');
  await knex.schema.dropTableIfExists('nssf_configuration');

  await knex.raw('DROP TRIGGER IF EXISTS update_nhif_rates_updated_at ON nhif_rates');
  await knex.schema.dropTableIfExists('nhif_rates');

  await knex.raw('DROP TRIGGER IF EXISTS update_paye_tax_bands_updated_at ON paye_tax_bands');
  await knex.schema.dropTableIfExists('paye_tax_bands');
}
