import * as path from 'path';

import * as dotenv from 'dotenv';
import type { Knex } from 'knex';

// Load .env from backend root directory (two levels up from this file)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }
      : 'postgresql://fintracker_user:fintracker_password@localhost:5432/fintracker_dev',
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },

  test: {
    client: 'pg',
    connection:
      process.env.TEST_DATABASE_URL ||
      'postgresql://fintracker_user:fintracker_password@localhost:5432/fintracker_test',
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
      extension: 'ts',
    },
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    acquireConnectionTimeout: 10000,
  },
};

export default config;
