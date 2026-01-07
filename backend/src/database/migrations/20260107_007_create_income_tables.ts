import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create employers table
  await knex.schema.createTable('employers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Employer details
    table.string('name', 255).notNullable();
    table.string('pin_number', 50).nullable(); // KRA PIN
    table.string('address', 500).nullable();
    table.string('phone', 50).nullable();
    table.string('email', 255).nullable();

    // Status
    table.boolean('is_current').notNullable().defaultTo(true);

    // Metadata
    table.jsonb('metadata').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'is_current']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_employers_updated_at
    BEFORE UPDATE ON employers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create income entries table
  await knex.schema.createTable('income_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('employer_id').nullable().references('id').inTable('employers').onDelete('SET NULL');
    table.uuid('transaction_id').nullable().references('id').inTable('transactions').onDelete('SET NULL');

    // Income details
    table.string('income_type', 50).notNullable(); // 'SALARY', 'BUSINESS', 'INVESTMENT', 'OTHER'
    table.date('income_date').notNullable(); // When income was earned
    table.string('description', 255).notNullable();

    // Gross income
    table.decimal('gross_amount', 18, 4).notNullable();

    // Deductions (PAYE breakdown)
    table.decimal('paye_before_relief', 18, 4).notNullable().defaultTo(0);
    table.decimal('personal_relief', 18, 4).notNullable().defaultTo(0);
    table.decimal('insurance_relief', 18, 4).notNullable().defaultTo(0);
    table.decimal('pension_relief', 18, 4).notNullable().defaultTo(0);
    table.decimal('mortgage_relief', 18, 4).notNullable().defaultTo(0);
    table.decimal('paye', 18, 4).notNullable().defaultTo(0); // Final PAYE after reliefs

    // Statutory deductions
    table.decimal('nhif', 18, 4).notNullable().defaultTo(0);
    table.decimal('nssf_tier1', 18, 4).notNullable().defaultTo(0);
    table.decimal('nssf_tier2', 18, 4).notNullable().defaultTo(0);
    table.decimal('nssf_total', 18, 4).notNullable().defaultTo(0);
    table.decimal('housing_levy', 18, 4).notNullable().defaultTo(0);

    // Other deductions
    table.decimal('other_deductions', 18, 4).notNullable().defaultTo(0);
    table.text('other_deductions_notes').nullable();

    // Net income
    table.decimal('net_amount', 18, 4).notNullable();

    // Manual override flag
    table.boolean('is_manual_override').notNullable().defaultTo(false);
    table.text('override_notes').nullable();

    // Calculation metadata (for audit trail)
    table.jsonb('calculation_breakdown').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'income_date']);
    table.index(['user_id', 'income_type']);
    table.index(['employer_id']);
  });

  // Add updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_income_entries_updated_at
    BEFORE UPDATE ON income_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_income_entries_updated_at ON income_entries');
  await knex.schema.dropTableIfExists('income_entries');

  await knex.raw('DROP TRIGGER IF EXISTS update_employers_updated_at ON employers');
  await knex.schema.dropTableIfExists('employers');
}
