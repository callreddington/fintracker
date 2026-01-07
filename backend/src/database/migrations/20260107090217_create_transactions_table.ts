import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('transactions', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign key to users
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Transaction details
    table.string('description', 500).notNullable();
    table.text('notes').nullable();

    // Transaction date (user-specified, can be different from created_at)
    table.date('transaction_date').notNullable();

    // Transaction status: DRAFT, POSTED, VOID
    // DRAFT: Not yet finalized, can be edited
    // POSTED: Finalized and immutable, affects account balances
    // VOID: Cancelled transaction (creates reversing entries)
    table.enum('status', ['DRAFT', 'POSTED', 'VOID']).notNullable().defaultTo('DRAFT');

    // Status timestamps
    table.timestamp('posted_at').nullable();
    table.timestamp('voided_at').nullable();

    // Idempotency support
    table.string('idempotency_key', 255).nullable().unique();

    // Metadata for additional information
    table.jsonb('metadata').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_transactions_user_id');
    table.index(['user_id', 'transaction_date'], 'idx_transactions_user_date');
    table.index(['user_id', 'status'], 'idx_transactions_user_status');
    table.index('idempotency_key', 'idx_transactions_idempotency');
  });

  // Reuse the update_updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions');
  await knex.schema.dropTableIfExists('transactions');
}
