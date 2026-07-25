import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `tpl-${Date.now()}`;
const TEST_EMAIL = `tpl.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let accessToken: string;
let testUserId: string;
let testOrgId: string;

describe('Opportunity Templates API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    // Create test user
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);
    const userResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, 'Template Test User', hash],
    );
    testUserId = userResult.rows[0].user_id;

    // Create test org and assign grantor role
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Template Test Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['program_officer'])],
    );

    // Get access token via login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    // Clean up in dependency order
    // Note: We cannot delete users that have audit_events (immutable FK constraint by design).
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    // Cannot delete users with audit_events — deactivate instead
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── GET /api/v1/opportunity-templates ──────────────────────────────────

  describe('GET /api/v1/opportunity-templates', () => {
    it('returns 200 and all 5 system templates for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/opportunity-templates')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // Should return at least 5 system templates
      const systemTemplates = res.body.filter((t: { is_system_template: boolean }) => t.is_system_template);
      expect(systemTemplates.length).toBeGreaterThanOrEqual(5);

      // Verify all 5 expected types are present
      const types = systemTemplates.map((t: { template_type: string }) => t.template_type);
      expect(types).toContain('federal_nofo');
      expect(types).toContain('state_grant');
      expect(types).toContain('philanthropic_rfp');
      expect(types).toContain('corporate_grant');
      expect(types).toContain('pass_through_subaward');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/opportunity-templates');
      expect(res.status).toBe(401);
    });

    it('filters by type=federal_nofo and returns only that type', async () => {
      const res = await request(app)
        .get('/api/v1/opportunity-templates?type=federal_nofo')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      for (const t of res.body) {
        expect(t.template_type).toBe('federal_nofo');
      }
    });

    it('filters by type=state_grant and returns only state_grant templates', async () => {
      const res = await request(app)
        .get('/api/v1/opportunity-templates?type=state_grant')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body) {
        expect(t.template_type).toBe('state_grant');
      }
    });

    it('returns 200 and empty array for unknown type', async () => {
      const res = await request(app)
        .get('/api/v1/opportunity-templates?type=nonexistent_type')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('template objects have required fields', async () => {
      const res = await request(app)
        .get('/api/v1/opportunity-templates')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      for (const t of res.body) {
        expect(t.template_id).toBeTruthy();
        expect(t.template_name).toBeTruthy();
        expect(t.template_type).toBeTruthy();
        expect(typeof t.is_system_template).toBe('boolean');
      }
    });
  });
});
