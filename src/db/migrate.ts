import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { env } from '../config/env';

async function migrate() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Get list of migration files in order
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const version = file.replace('.sql', '');

      // Check if already applied
      const { rows } = await pool.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version],
      );

      if (rows.length > 0) {
        console.log(`Migration ${version} already applied, skipping`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying migration: ${version}`);
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        [version],
      );
      console.log(`Migration ${version} applied successfully`);
    }

    console.log('All migrations complete');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
