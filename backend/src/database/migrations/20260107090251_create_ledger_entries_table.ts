import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('ledger_entries', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign keys
    table.uuid('transaction_id').notNullable().references('id').inTable('transactions').onDelete('CASCADE');
    table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('RESTRICT');

    // Entry type: DEBIT or CREDIT
    table.enum('entry_type', ['DEBIT', 'CREDIT']).notNullable();

    // Amount (stored as DECIMAL for precision)
    // Using DECIMAL(18,4) - 18 digits total, 4 after decimal point
    // Max value: 99,999,999,999,999.9999 (enough for financial calculations)
    table.decimal('amount', 18, 4).notNullable();

    // Currency (inherited from account, but stored for audit trail)
    table.string('currency', 3).notNullable();

    // Entry description (can override transaction description)
    table.string('description', 500).nullable();

    // Timestamp (inherited from transaction)
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('transaction_id', 'idx_ledger_entries_transaction');
    table.index('account_id', 'idx_ledger_entries_account');
    table.index(['account_id', 'created_at'], 'idx_ledger_entries_account_date');

    // Constraints
    // Ensure amount is positive
    table.check('amount > 0', undefined, 'chk_ledger_entries_amount_positive');
  });

  // Add a CHECK constraint to ensure debits = credits for each transaction
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_transaction_balance()
    RETURNS TRIGGER AS $$
    DECLARE
      debit_sum DECIMAL(18,4);
      credit_sum DECIMAL(18,4);
      txn_status TEXT;
    BEGIN
      -- Only check balance when transaction status is POSTED
      SELECT status INTO txn_status FROM transactions WHERE id = NEW.transaction_id;

      IF txn_status = 'POSTED' THEN
        -- Calculate sum of debits
        SELECT COALESCE(SUM(amount), 0) INTO debit_sum
        FROM ledger_entries
        WHERE transaction_id = NEW.transaction_id AND entry_type = 'DEBIT';

        -- Calculate sum of credits
        SELECT COALESCE(SUM(amount), 0) INTO credit_sum
        FROM ledger_entries
        WHERE transaction_id = NEW.transaction_id AND entry_type = 'CREDIT';

        -- Check if balanced
        IF debit_sum != credit_sum THEN
          RAISE EXCEPTION 'Transaction % is not balanced: debits = %, credits = %',
            NEW.transaction_id, debit_sum, credit_sum;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER enforce_transaction_balance
    AFTER INSERT OR UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION check_transaction_balance();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS enforce_transaction_balance ON ledger_entries');
  await knex.raw('DROP FUNCTION IF EXISTS check_transaction_balance');
  await knex.schema.dropTableIfExists('ledger_entries');
}
