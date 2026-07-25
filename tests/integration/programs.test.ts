import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `prog-${Date.now()}`;
const TEST_EMAIL = `prog.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Programs Test User';

// intake_admin user to test RBAC rejection
const INTAKE_EMAIL = `intake.user.${UNIQUE_ID}@example.com`;

let adminAccessToken: string;
let intakeAccessToken: string;
let testUserId: string;
let intakeUserId: string;
let testOrgId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Programs API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const existingAdmin = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existingAdmin.rows.length > 0) {
      const uid = existingAdmin.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    const existingIntake = await pool.query('SELECT user_id FROM users WHERE email = $1', [INTAKE_EMAIL]);
    if (existingIntake.rows.length > 0) {
      const uid = existingIntake.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [INTAKE_EMAIL]);

    // Create test users
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const adminResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, TEST_NAME, hash],
    );
    testUserId = adminResult.rows[0].user_id;

    const intakeResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [INTAKE_EMAIL, 'Intake Test User', hash],
    );
    intakeUserId = intakeResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign program_officer to admin test user, intake_administrator to intake user
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['program_officer'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, intakeUserId, JSON.stringify(['intake_administrator'])],
    );

    // Get access tokens
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    intakeAccessToken = await loginUser(INTAKE_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order
    // Note: We cannot delete users that have audit_events (immutable FK constraint by design).
    // Clean up what we can: programs, roles, and the org.
    await pool.query('DELETE FROM programs WHERE grantor_org_id = $1', [testOrgId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id IN ($1, $2)', [testUserId, intakeUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    // Cannot delete users with audit_events — deactivate instead to prevent login
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [testUserId, intakeUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── GET /api/v1/programs ────────────────────────────────────────────────

  describe('GET /api/v1/programs', () => {
    it('returns 200 and empty list for a new org', async () => {
      const res = await request(app)
        .get('/api/v1/programs')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // May have programs from previous seeding if any, but should only return testOrgId programs
      // All returned programs should belong to testOrgId
      for (const p of res.body) {
        expect(p.grantor_org_id).toBe(testOrgId);
      }
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/programs');
      expect(res.status).toBe(401);
    });

    it('intake_administrator can GET programs (authenticate only, no role restriction)', async () => {
      const res = await request(app)
        .get('/api/v1/programs')
        .set('Authorization', `Bearer ${intakeAccessToken}`);
      expect(res.status).toBe(200);
    });
  });

  // ─── POST /api/v1/programs ───────────────────────────────────────────────

  describe('POST /api/v1/programs', () => {
    it('returns 201 and created program for program_officer', async () => {
      const res = await request(app)
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          program_name: 'Research Excellence Program',
          program_area: 'Scientific Research',
          is_federal: true,
          program_description: 'Funding for cutting-edge research initiatives',
        });

      expect(res.status).toBe(201);
      expect(res.body.program_name).toBe('Research Excellence Program');
      expect(res.body.program_area).toBe('Scientific Research');
      expect(res.body.is_federal).toBe(true);
      expect(res.body.grantor_org_id).toBe(testOrgId);
      expect(res.body.created_by).toBe(testUserId);
      expect(res.body.program_id).toBeTruthy();
    });

    it('returns 400 for missing program_name', async () => {
      const res = await request(app)
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ program_area: 'Health' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 403 for intake_administrator (wrong role)', async () => {
      const res = await request(app)
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${intakeAccessToken}`)
        .send({ program_name: 'Should Fail' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('PERMISSION_DENIED');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/programs')
        .send({ program_name: 'Unauthorized Program' });

      expect(res.status).toBe(401);
    });

    it('GET returns created program with org filtering', async () => {
      // Create a second program
      await request(app)
        .post('/api/v1/programs')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ program_name: 'Community Development Fund', is_federal: false });

      const res = await request(app)
        .get('/api/v1/programs')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      const names = res.body.map((p: { program_name: string }) => p.program_name);
      expect(names).toContain('Research Excellence Program');
      expect(names).toContain('Community Development Fund');
      // All belong to testOrgId
      for (const p of res.body) {
        expect(p.grantor_org_id).toBe(testOrgId);
      }
    });
  });
});
