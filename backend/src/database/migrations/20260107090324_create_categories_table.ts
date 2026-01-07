import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    // Primary key
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Foreign key to users (nullable for system categories)
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE');

    // Category details
    table.string('name', 100).notNullable();
    table.text('description').nullable();

    // Category type: INCOME or EXPENSE
    table.enum('type', ['INCOME', 'EXPENSE']).notNullable();

    // Parent category for subcategories (optional)
    table.uuid('parent_id').nullable().references('id').inTable('categories').onDelete('SET NULL');

    // Icon/color for UI
    table.string('icon', 50).nullable();
    table.string('color', 7).nullable(); // Hex color code #RRGGBB

    // System category flag (pre-defined, cannot be deleted)
    table.boolean('is_system').notNullable().defaultTo(false);

    // Active status
    table.boolean('is_active').notNullable().defaultTo(true);

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id', 'idx_categories_user_id');
    table.index(['user_id', 'type'], 'idx_categories_user_type');
    table.index('parent_id', 'idx_categories_parent_id');

    // Unique constraint: name per user per type (system categories have no user_id)
    table.unique(['user_id', 'name', 'type'], {
      indexName: 'uq_categories_user_name_type',
    });
  });

  // Reuse the update_updated_at trigger
  await knex.raw(`
    CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);

  // Insert default system categories for expenses
  await knex('categories').insert([
    // Expense categories
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Groceries',
      type: 'EXPENSE',
      icon: 'shopping-cart',
      color: '#10B981',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Transport',
      type: 'EXPENSE',
      icon: 'car',
      color: '#3B82F6',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Utilities',
      type: 'EXPENSE',
      icon: 'zap',
      color: '#F59E0B',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Entertainment',
      type: 'EXPENSE',
      icon: 'film',
      color: '#8B5CF6',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Healthcare',
      type: 'EXPENSE',
      icon: 'heart',
      color: '#EF4444',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Education',
      type: 'EXPENSE',
      icon: 'book',
      color: '#06B6D4',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Dining',
      type: 'EXPENSE',
      icon: 'utensils',
      color: '#EC4899',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Shopping',
      type: 'EXPENSE',
      icon: 'shopping-bag',
      color: '#14B8A6',
      is_system: true,
    },
    // Income categories
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Salary',
      type: 'INCOME',
      icon: 'briefcase',
      color: '#10B981',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Business',
      type: 'INCOME',
      icon: 'trending-up',
      color: '#3B82F6',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Investments',
      type: 'INCOME',
      icon: 'dollar-sign',
      color: '#F59E0B',
      is_system: true,
    },
    {
      id: knex.raw('gen_random_uuid()'),
      user_id: null,
      name: 'Other Income',
      type: 'INCOME',
      icon: 'plus-circle',
      color: '#8B5CF6',
      is_system: true,
    },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_categories_updated_at ON categories');
  await knex.schema.dropTableIfExists('categories');
}
