import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `dl-${Date.now()}`;
const TEST_EMAIL = `deadline.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;

const baseOpportunity = {
  title: 'Deadline Test Grant',
  funding_source: 'State Health Department',
  announcement_type: 'Initial',
  opportunity_number: `DL-${UNIQUE_ID}-001`,
  funding_amount_max: 100000,
  eligibility_summary: 'Test eligibility summary for deadline testing.',
  executive_summary: 'Test executive summary for deadline testing.',
  contact_name: 'Jane Tester',
  contact_email: 'jane@example.gov',
  program_area: 'Health',
};

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Deadlines API (F4 - Deadline Configuration)', () => {
  beforeAll(async () => {
    // Clean up any previous test data
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const userResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, 'Deadline Test User', hash],
    );
    testUserId = userResult.rows[0].user_id;

    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org DL ${UNIQUE_ID}`, 'state_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );

    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Deadline Test Program ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);

    // Create the base test opportunity
    const oppRes = await request(app)
      .post(`/api/v1/programs/${testProgramId}/opportunities`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send(baseOpportunity);
    expect(oppRes.status).toBe(201);
    testOpportunityId = oppRes.body.opportunity_id;
  });

  afterAll(async () => {
    if (testProgramId) {
      // opportunity_versions rows are immutable (trigger blocks DELETE), so temporarily disable
      // the trigger for test cleanup only
      await pool.query('ALTER TABLE opportunity_versions DISABLE TRIGGER opportunity_versions_immutable');
      await pool.query('DELETE FROM opportunity_versions WHERE opportunity_id IN (SELECT opportunity_id FROM opportunities WHERE program_id = $1)', [testProgramId]);
      await pool.query('ALTER TABLE opportunity_versions ENABLE TRIGGER opportunity_versions_immutable');
      await pool.query('DELETE FROM opportunities WHERE program_id = $1', [testProgramId]);
      await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    }
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    if (testOrgId) {
      await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    }
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  describe('Deadline validation rules', () => {
    it('returns 400 when application_close_date is before application_open_date', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-15T00:00:00Z',
          application_close_date: '2025-06-01T00:00:00Z', // before open
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('application_close_date');
    });

    it('returns 400 when application_open_date equals application_close_date', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-15T00:00:00Z',
          application_close_date: '2025-06-15T00:00:00Z', // same as open
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('application_close_date');
    });

    it('returns 400 when loi_required=true but no loi_deadline provided', async () => {
      // First set valid dates
      await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
        });

      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          loi_required: true,
          loi_deadline: null, // explicitly null — should fail
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('loi_deadline');
    });

    it('returns 400 when rolling_review_enabled=true with cadence=0', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rolling_review_enabled: true,
          rolling_review_cadence_days: 0,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('rolling_review_cadence_days');
    });

    it('returns 400 when rolling_review_enabled=true with negative cadence', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          rolling_review_enabled: true,
          rolling_review_cadence_days: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('rolling_review_cadence_days');
    });

    it('returns 400 when pre_application_deadline is after open date', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
          pre_application_deadline: '2025-07-01T00:00:00Z', // after open date — invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('DEADLINE_VALIDATION_ERROR');
      expect(res.body.field).toBe('pre_application_deadline');
    });

    it('returns 200 with valid date configuration', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${testOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
          pre_application_deadline: '2025-05-15T00:00:00Z', // before open — valid
          loi_required: true,
          loi_deadline: '2025-07-01T00:00:00Z', // before close — valid
          rolling_review_enabled: true,
          rolling_review_cadence_days: 14, // positive — valid
        });

      expect(res.status).toBe(200);
      expect(res.body.loi_required).toBe(true);
      expect(res.body.rolling_review_enabled).toBe(true);
      expect(res.body.rolling_review_cadence_days).toBe(14);
    });
  });
});
