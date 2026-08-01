import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Pool } from 'pg';
import { config as dotenvConfig } from 'dotenv';

// Load .env so DATABASE_URL is available in the test runner process
dotenvConfig();

export async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for tests');
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Run all pending migrations
    const migrationsDir = path.join(__dirname, '../src/db/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.replace('.sql', '');
      const { rows } = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version],
      );
      if (rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[globalSetup] Applying migration: ${version}`);
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    }

    // Check if seed data exists (users table is populated)
    const { rows: userRows } = await pool.query(
      `SELECT 1 FROM users WHERE email = 'admin@example.gov' LIMIT 1`,
    );

    if (userRows.length === 0) {
      // Run seed as a subprocess to avoid import-time side effects from env.ts
      console.log('[globalSetup] Running seed...');
      execSync('npx tsx src/db/seed.ts', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        env: { ...process.env },
      });
    }
  } finally {
    await pool.end();
  }
}

export async function teardown() {
  // nothing to tear down globally
}
