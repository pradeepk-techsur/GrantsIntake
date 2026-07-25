import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `scr-${Date.now()}`;
const TEST_EMAIL = `scr.admin.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let manualCriterionId: string;
let autoCriterionId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Screening Criteria API', () => {
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
      [TEST_EMAIL, 'Screening Criteria Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org SCR ${UNIQUE_ID}`, 'federal_agency'],
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
      [testOrgId, `Test Program SCR ${UNIQUE_ID}`, testUserId],
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
        'Test Screening Criteria Opportunity',
        'Federal Grant Agency',
        'Initial',
        `SCR-${UNIQUE_ID}`,
        'Nonprofits only',
        'Testing screening criteria',
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
    await pool.query('DELETE FROM screening_criteria WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── POST creates manual criterion ────────────────────────────────────────

  describe('POST /api/v1/opportunities/:id/screening-criteria', () => {
    it('creates manual criterion with display_order, criterion_text, is_required=true', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/screening-criteria`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          criterion_text: 'Verify authorized representative signature on application',
          criterion_type: 'manual',
          is_required: true,
          display_order: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.criterion_id).toBeTruthy();
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.criterion_text).toBe('Verify authorized representative signature on application');
      expect(res.body.criterion_type).toBe('manual');
      expect(res.body.is_required).toBe(true);
      expect(res.body.display_order).toBe(10);

      manualCriterionId = res.body.criterion_id;
    });

    it('creates auto criterion with auto_criterion_key=completeness_check', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/screening-criteria`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          criterion_text: 'Verify application completeness',
          criterion_type: 'auto',
          auto_criterion_key: 'completeness_check',
          is_required: true,
          display_order: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.criterion_type).toBe('auto');
      expect(res.body.auto_criterion_key).toBe('completeness_check');

      autoCriterionId = res.body.criterion_id;
    });

    it('returns 401 without authentication token', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/screening-criteria`)
        .send({
          criterion_text: 'Test criterion',
          criterion_type: 'manual',
          is_required: true,
          display_order: 0,
        });

      expect(res.status).toBe(401);
    });
  });

  // ─── DELETE auto criterion returns 403 ────────────────────────────────────

  describe('DELETE /api/v1/screening-criteria/:criterion_id (auto protection)', () => {
    it('returns 403 when trying to delete an auto criterion (T-02-07)', async () => {
      const res = await request(app)
        .delete(`/api/v1/screening-criteria/${autoCriterionId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('AUTO_CRITERION_PROTECTED');
    });

    it('successfully deletes manual criterion; GET confirms removal', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/screening-criteria/${manualCriterionId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify removal
      const listRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/screening-criteria`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(listRes.status).toBe(200);
      const found = listRes.body.find(
        (c: { criterion_id: string }) => c.criterion_id === manualCriterionId,
      );
      expect(found).toBeUndefined();

      // Verify auto criterion still exists (not deleted)
      const autoStillExists = listRes.body.find(
        (c: { criterion_id: string }) => c.criterion_id === autoCriterionId,
      );
      expect(autoStillExists).toBeTruthy();
    });
  });
});
