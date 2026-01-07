import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('accounts', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign key to users
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Account details
    table.string('name', 255).notNullable(); // e.g., "KCB Savings", "M-Pesa", "Salary Income"
    table.string('account_number', 100).nullable(); // Optional account number

    // Account type: ASSET, LIABILITY, INCOME, EXPENSE, EQUITY
    table.enum('type', ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY']).notNullable();

    // Account subtype for more granularity
    // ASSET: BANK, CASH, MPESA, INVESTMENT
    // LIABILITY: LOAN, CREDIT_CARD
    // INCOME: SALARY, BUSINESS, INVESTMENT_INCOME
    // EXPENSE: GROCERIES, TRANSPORT, UTILITIES, ENTERTAINMENT, etc.
    table.string('subtype', 100).notNullable();

    // Currency (default KES)
    table.string('currency', 3).notNullable().defaultTo('KES');

    // Status
    table.boolean('is_active').notNullable().defaultTo(true);

    // Additional metadata
    table.text('description').nullable();
    table.jsonb('metadata').nullable(); // For flexible data storage

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_accounts_user_id');
    table.index(['user_id', 'type'], 'idx_accounts_user_type');
    table.index(['user_id', 'is_active'], 'idx_accounts_user_active');
  });

  // Reuse the update_updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts');
  await knex.schema.dropTableIfExists('accounts');
}
