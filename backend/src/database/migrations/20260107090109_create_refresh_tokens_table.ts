import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('refresh_tokens', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign key to users
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Token (hashed)
    table.string('token_hash', 255).notNullable().unique();

    // Expiration
    table.timestamp('expires_at').notNullable();

    // Revocation
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.timestamp('revoked_at').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_refresh_tokens_user_id');
    table.index('token_hash', 'idx_refresh_tokens_token_hash');
    table.index('expires_at', 'idx_refresh_tokens_expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('refresh_tokens');
}
