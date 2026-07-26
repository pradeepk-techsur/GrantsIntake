import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `comp-${Date.now()}`;
const TEST_EMAIL = `completeness.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;

// Complete opportunity payload for successful publication
const fullOpportunity = {
  title: 'Complete Health Innovation Grant',
  funding_source: 'State Department of Health',
  announcement_type: 'Initial',
  opportunity_number: `COMP-${UNIQUE_ID}-001`,
  funding_amount_max: 250000,
  eligibility_summary: 'Eligible applicants include 501(c)(3) non-profits with 5+ years of experience.',
  executive_summary: 'Funding for innovative community health programs targeting underserved populations in rural areas.',
  contact_name: 'Dr. Maria Johnson',
  contact_email: 'grants@example.gov',
  program_area: 'Public Health',
};

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

async function createOpportunity(overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await request(app)
    .post(`/api/v1/programs/${testProgramId}/opportunities`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({
      ...fullOpportunity,
      opportunity_number: `COMP-${UNIQUE_ID}-${Date.now()}`,
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body.opportunity_id;
}

describe('Completeness & Publication API (F5 - Publication Validation)', () => {
  beforeAll(async () => {
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
      [TEST_EMAIL, 'Completeness Test User', hash],
    );
    testUserId = userResult.rows[0].user_id;

    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org COMP ${UNIQUE_ID}`, 'state_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );

    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Completeness Test Program ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
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

  describe('POST /api/v1/opportunities/:id/publish', () => {
    it('returns 422 with blockers when required metadata field (title) is missing', async () => {
      const oppId = await createOpportunity();
      // Use direct DB update to force missing field (API create requires title)
      await pool.query(`UPDATE opportunities SET title = '' WHERE opportunity_id = $1`, [oppId]);

      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('PUBLICATION_BLOCKED');
      expect(Array.isArray(res.body.blockers)).toBe(true);
      const titleBlocker = res.body.blockers.find((b: { field: string }) => b.field === 'title');
      expect(titleBlocker).toBeDefined();
      expect(titleBlocker.section).toBe('Metadata');
    });

    it('returns 422 with blockers when application_close_date is missing', async () => {
      const oppId = await createOpportunity();
      // Opportunity has no dates set → should block on Deadlines

      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('PUBLICATION_BLOCKED');
      const closeDateBlocker = res.body.blockers.find(
        (b: { field: string }) => b.field === 'application_close_date',
      );
      expect(closeDateBlocker).toBeDefined();
      expect(closeDateBlocker.section).toBe('Deadlines');
    });

    it('returns 200 with status=published on fully complete opportunity', async () => {
      const oppId = await createOpportunity();

      // Set required dates
      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
        });

      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('published');
      expect(res.body.published_at).toBeTruthy();
      expect(res.body.published_by).toBe(testUserId);
    });

    it('returns 409 when trying to publish an already-published opportunity', async () => {
      const oppId = await createOpportunity();

      // Set dates and publish
      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
        });
      await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // Try to publish again
      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_PUBLISHED');
    });

    it('writes OPPORTUNITY_PUBLISHED audit event on successful publication', async () => {
      const oppId = await createOpportunity();

      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
        });

      await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const auditResult = await pool.query(
        `SELECT * FROM audit_events WHERE event_type = 'OPPORTUNITY_PUBLISHED' AND entity_id = $1`,
        [oppId],
      );
      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
    });

    it('creates version 1 in opportunity_versions after successful publication', async () => {
      const oppId = await createOpportunity();

      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          application_open_date: '2025-06-01T00:00:00Z',
          application_close_date: '2025-09-01T00:00:00Z',
        });

      await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const versionResult = await pool.query(
        `SELECT * FROM opportunity_versions WHERE opportunity_id = $1 ORDER BY version_number`,
        [oppId],
      );
      expect(versionResult.rows.length).toBe(1);
      expect(versionResult.rows[0].version_number).toBe(1);
      expect(versionResult.rows[0].modification_reason).toBe('OPPORTUNITY_PUBLISHED'); // Updated: plan 02-04 delegates to publicationService which uses 'OPPORTUNITY_PUBLISHED' as the snapshot reason
    });

    it('dry_run=true returns blockers without publishing', async () => {
      const oppId = await createOpportunity();
      // No dates set — should return blockers

      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish?dry_run=true`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.is_ready).toBe(false);
      expect(Array.isArray(res.body.blockers)).toBe(true);

      // Verify opportunity was NOT published
      const opp = await pool.query('SELECT status FROM opportunities WHERE opportunity_id = $1', [oppId]);
      expect(opp.rows[0].status).toBe('draft');
    });

    it('returns 401 without authentication', async () => {
      const oppId = await createOpportunity();

      const res = await request(app)
        .post(`/api/v1/opportunities/${oppId}/publish`);

      expect(res.status).toBe(401);
    });
  });
});
