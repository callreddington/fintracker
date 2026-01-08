import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('expenses', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');
    table.uuid('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');

    // Expense details
    table.string('description', 500).notNullable();
    table.decimal('amount', 18, 4).notNullable();
    table.string('currency', 3).notNullable().defaultTo('KES');
    table.date('expense_date').notNullable();

    // Payment details
    table.string('merchant', 255).nullable();
    table.string('payment_method', 50).nullable(); // CASH, CARD, MPESA, BANK_TRANSFER
    table.string('reference_number', 100).nullable();

    // Receipt/proof
    table.string('receipt_url', 500).nullable();

    // Status and flags
    table.boolean('is_recurring').notNullable().defaultTo(false);
    table.string('recurring_frequency', 20).nullable(); // DAILY, WEEKLY, MONTHLY, YEARLY
    table.uuid('recurring_parent_id').nullable().references('id').inTable('expenses').onDelete('CASCADE');

    // Additional metadata
    table.text('notes').nullable();
    table.jsonb('metadata').nullable();
    table.specificType('tags', 'text[]').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_expenses_user_id');
    table.index('category_id', 'idx_expenses_category_id');
    table.index('account_id', 'idx_expenses_account_id');
    table.index(['user_id', 'expense_date'], 'idx_expenses_user_date');
    table.index(['user_id', 'category_id'], 'idx_expenses_user_category');
    table.index('merchant', 'idx_expenses_merchant');

    // Constraints
    table.check('amount > 0', undefined, 'chk_expenses_amount_positive');
  });

  // Reuse the update_updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses');
  await knex.schema.dropTableIfExists('expenses');
}
