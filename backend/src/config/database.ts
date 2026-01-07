import { logger } from '@utils/logger';
import knex, { Knex } from 'knex';

let db: Knex | null = null;

const databaseConfig: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  migrations: {
    directory: './src/database/migrations',
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
    extension: 'ts',
  },
  acquireConnectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10),
};

export async function initializeDatabase(): Promise<Knex> {
  if (db) {
    return db;
  }

  try {
    db = knex(databaseConfig);

    // Test the connection
    await db.raw('SELECT 1+1 AS result');

    logger.info('Database connection established');

    return db;
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
    logger.info('Database connection closed');
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export { db };
