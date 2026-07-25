import { Pool } from 'pg';
import knex, { Knex } from 'knex';
import { env } from '../config/env';

export const pool: Pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db: Knex = knex({
  client: 'pg',
  connection: {
    connectionString: env.DATABASE_URL,
  },
  pool: {
    min: 2,
    max: 10,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});
