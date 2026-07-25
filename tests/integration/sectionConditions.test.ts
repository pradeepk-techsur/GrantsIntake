import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `sc-${Date.now()}`;
const TEST_EMAIL = `sc.admin.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Section Conditions API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const adminResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, 'Section Conditions Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org SC ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign grantor_admin role
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );

    // Create test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Test Program SC ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    // Create test opportunity
    const oppResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary, contact_name, contact_email, program_area, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING opportunity_id`,
      [
        testProgramId,
        'Test Section Conditions Opportunity',
        'Federal Grant Agency',
        'Initial',
        `SC-${UNIQUE_ID}`,
        'Nonprofits only',
        'Testing section conditions',
        'Test Contact',
        'test@example.gov',
        'Health',
        testUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Get access token
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM section_condition_configs WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── PUT creates section condition config ─────────────────────────────────

  describe('PUT /api/v1/opportunities/:id/sections/:section_id/conditions', () => {
    it('creates section condition config for section_key="narrative"', async () => {
      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/sections/narrative/conditions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          conditions: [
            {
              condition_type: 'applicant_type',
              field: 'entity_type',
              operator: 'equals',
              value: 'nonprofit',
            },
          ],
          condition_group_operator: 'AND',
        });

      expect(res.status).toBe(200);
      expect(res.body.config_id).toBeTruthy();
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.section_key).toBe('narrative');
      expect(res.body.conditions).toHaveLength(1);
      expect(res.body.conditions[0].condition_type).toBe('applicant_type');
      expect(res.body.condition_group_operator).toBe('AND');
    });

    it('GET returns the created section condition config', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/sections/conditions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find((c: { section_key: string }) => c.section_key === 'narrative');
      expect(found).toBeTruthy();
      expect(found.conditions).toHaveLength(1);
    });

    it('second PUT with same section_key updates (no duplicate created)', async () => {
      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/sections/narrative/conditions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          conditions: [
            {
              condition_type: 'geography',
              field: 'state',
              operator: 'includes',
              value: 'CA',
            },
            {
              condition_type: 'applicant_type',
              field: 'entity_type',
              operator: 'equals',
              value: 'nonprofit',
            },
          ],
          condition_group_operator: 'OR',
        });

      expect(res.status).toBe(200);
      expect(res.body.section_key).toBe('narrative');
      expect(res.body.conditions).toHaveLength(2);
      expect(res.body.condition_group_operator).toBe('OR');

      // Verify no duplicate was created
      const listRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/sections/conditions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
      const narrativeConfigs = listRes.body.filter(
        (c: { section_key: string }) => c.section_key === 'narrative',
      );
      expect(narrativeConfigs).toHaveLength(1);
    });

    it('returns 401 without authentication token', async () => {
      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/sections/test-section/conditions`)
        .send({
          conditions: [],
          condition_group_operator: 'AND',
        });

      expect(res.status).toBe(401);
    });

    it('returns 422 when conditions exceed 20 items', async () => {
      const conditions = Array.from({ length: 21 }, (_, i) => ({
        condition_type: 'applicant_type',
        field: `field_${i}`,
        operator: 'equals',
        value: 'nonprofit',
      }));

      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/sections/test-section/conditions`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ conditions, condition_group_operator: 'AND' });

      expect(res.status).toBe(422);
    });
  });
});
