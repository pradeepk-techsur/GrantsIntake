import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { env } from '../config/env';

async function seed() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    console.log('Starting idempotent seed...');

    // Seed admin user (ON CONFLICT DO NOTHING for idempotency)
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);

    const userResult = await pool.query(`
      INSERT INTO users (email, full_name, password_hash, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_active = EXCLUDED.is_active
      RETURNING user_id
    `, ['admin@example.gov', 'System Administrator', passwordHash]);

    const adminUserId = userResult.rows[0].user_id;
    console.log(`Admin user upserted: admin@example.gov (id: ${adminUserId})`);

    // Seed a test grantor organization
    const orgResult = await pool.query(`
      INSERT INTO grantor_organizations (org_name, org_type)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING org_id
    `, ['Example Federal Agency', 'federal_agency']);

    let orgId: string;
    if (orgResult.rows.length > 0) {
      orgId = orgResult.rows[0].org_id;
    } else {
      // Org already exists, fetch it
      const existing = await pool.query(
        `SELECT org_id FROM grantor_organizations WHERE org_name = $1`,
        ['Example Federal Agency'],
      );
      orgId = existing.rows[0].org_id;
    }
    console.log(`Grantor organization upserted: Example Federal Agency (id: ${orgId})`);

    // Assign grantor_admin role to admin user for the org
    await pool.query(`
      INSERT INTO grantor_roles (grantor_org_id, user_id, roles)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET
        roles = EXCLUDED.roles,
        revoked_at = NULL
    `, [orgId, adminUserId, JSON.stringify(['grantor_admin'])]);

    console.log(`Grantor role assigned: admin@example.gov → grantor_admin`);
    console.log('Seed complete — admin@example.gov / TestPassword123!');
  } catch (err) {
    console.error('Seed failed:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
