import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ver-${Date.now()}`;
const TEST_EMAIL = `versioning.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;

const baseOpportunity = {
  title: 'Versioning Test Grant',
  funding_source: 'State Health Department',
  announcement_type: 'Initial',
  funding_amount_max: 150000,
  eligibility_summary: 'Eligible applicants include all registered 501(c)(3) organizations.',
  executive_summary: 'Grant to support community health programs in underserved areas.',
  contact_name: 'Dr. Smith',
  contact_email: 'smith@example.gov',
  program_area: 'Health',
};

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

async function createAndPublishOpportunity(suffix: string): Promise<string> {
  const createRes = await request(app)
    .post(`/api/v1/programs/${testProgramId}/opportunities`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({
      ...baseOpportunity,
      opportunity_number: `VER-${UNIQUE_ID}-${suffix}`,
    });
  expect(createRes.status).toBe(201);
  const oppId = createRes.body.opportunity_id;

  // Add required dates
  await request(app)
    .patch(`/api/v1/opportunities/${oppId}`)
    .set('Authorization', `Bearer ${adminAccessToken}`)
    .send({
      application_open_date: '2025-06-01T00:00:00Z',
      application_close_date: '2025-09-01T00:00:00Z',
    });

  // Publish
  const publishRes = await request(app)
    .post(`/api/v1/opportunities/${oppId}/publish`)
    .set('Authorization', `Bearer ${adminAccessToken}`);
  expect(publishRes.status).toBe(200);

  return oppId;
}

describe('Versioning API (F6 - Version History)', () => {
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
      [TEST_EMAIL, 'Versioning Test User', hash],
    );
    testUserId = userResult.rows[0].user_id;

    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org VER ${UNIQUE_ID}`, 'state_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );

    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Versioning Test Program ${UNIQUE_ID}`, testUserId],
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

  describe('Post-publication PATCH requirements', () => {
    it('returns 400 when patching published opportunity without modification_reason', async () => {
      const oppId = await createAndPublishOpportunity('no-reason');

      const res = await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ title: 'Updated Title — No Reason' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MODIFICATION_REASON_REQUIRED');
    });

    it('returns 400 when modification_reason is empty string', async () => {
      const oppId = await createAndPublishOpportunity('empty-reason');

      const res = await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ title: 'Updated Title', modification_reason: '  ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MODIFICATION_REASON_REQUIRED');
    });

    it('returns 200 and creates version snapshot when patching with modification_reason', async () => {
      const oppId = await createAndPublishOpportunity('with-reason');

      const res = await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          title: 'Updated Title With Reason',
          modification_reason: 'Correcting typo in opportunity title',
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title With Reason');

      // Version 2 should be created (1 from publication, 2 from this patch)
      const versions = await pool.query(
        `SELECT * FROM opportunity_versions WHERE opportunity_id = $1 ORDER BY version_number`,
        [oppId],
      );
      expect(versions.rows.length).toBe(2);
      expect(versions.rows[1].version_number).toBe(2);
      expect(versions.rows[1].modification_reason).toBe('Correcting typo in opportunity title');

      // Delta should include title change
      const delta = versions.rows[1].delta;
      expect(delta).toBeDefined();
      expect(delta.title).toBeDefined();
      expect(delta.title.new).toBe('Updated Title With Reason');
    });
  });

  describe('GET /api/v1/opportunities/:id/versions', () => {
    it('returns version history ordered DESC', async () => {
      const oppId = await createAndPublishOpportunity('list-versions');

      // Create two more versions
      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          title: 'V2 Title',
          modification_reason: 'First post-publication update',
        });

      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          title: 'V3 Title',
          modification_reason: 'Second post-publication update',
        });

      const res = await request(app)
        .get(`/api/v1/opportunities/${oppId}/versions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // 1 from publish + 2 from patches

      // Should be ordered DESC
      expect(res.body[0].version_number).toBe(3);
      expect(res.body[1].version_number).toBe(2);
      expect(res.body[2].version_number).toBe(1);
      expect(res.body[2].modification_reason).toBe('OPPORTUNITY_PUBLISHED'); // Updated: plan 02-04 delegates to publicationService which uses 'OPPORTUNITY_PUBLISHED' as the snapshot reason
    });

    it('returns empty array for draft opportunity (no versions)', async () => {
      const createRes = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...baseOpportunity,
          opportunity_number: `VER-${UNIQUE_ID}-draft-no-versions`,
        });
      const draftId = createRes.body.opportunity_id;

      const res = await request(app)
        .get(`/api/v1/opportunities/${draftId}/versions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('returns 401 without authentication', async () => {
      const oppId = await createAndPublishOpportunity('auth-test');

      const res = await request(app)
        .get(`/api/v1/opportunities/${oppId}/versions`);

      expect(res.status).toBe(401);
    });
  });

  describe('DB immutability trigger', () => {
    it('rejects direct UPDATE on opportunity_versions (trigger fires)', async () => {
      const oppId = await createAndPublishOpportunity('immutable-test');

      // Get version row
      const versionResult = await pool.query(
        `SELECT version_id FROM opportunity_versions WHERE opportunity_id = $1`,
        [oppId],
      );
      expect(versionResult.rows.length).toBeGreaterThan(0);
      const versionId = versionResult.rows[0].version_id;

      // Attempt to UPDATE — should throw due to trigger
      await expect(
        pool.query(
          `UPDATE opportunity_versions SET modification_reason = 'hacked' WHERE version_id = $1`,
          [versionId],
        ),
      ).rejects.toThrow('opportunity_versions rows are immutable');
    });

    it('rejects direct DELETE on opportunity_versions (trigger fires)', async () => {
      const oppId = await createAndPublishOpportunity('delete-immutable-test');

      const versionResult = await pool.query(
        `SELECT version_id FROM opportunity_versions WHERE opportunity_id = $1`,
        [oppId],
      );
      const versionId = versionResult.rows[0].version_id;

      // Attempt to DELETE — should throw due to trigger
      await expect(
        pool.query(
          `DELETE FROM opportunity_versions WHERE version_id = $1`,
          [versionId],
        ),
      ).rejects.toThrow('opportunity_versions rows are immutable');
    });

    it('version 1 remains immutable after version 2 is created', async () => {
      const oppId = await createAndPublishOpportunity('v1-immutable');

      // Create version 2
      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          title: 'V2 Title After Publication',
          modification_reason: 'Second version created',
        });

      // Get version 1
      const v1 = await pool.query(
        `SELECT version_id FROM opportunity_versions WHERE opportunity_id = $1 AND version_number = 1`,
        [oppId],
      );
      expect(v1.rows.length).toBe(1);

      // Attempt to update version 1 — trigger should fire
      await expect(
        pool.query(
          `UPDATE opportunity_versions SET modification_reason = 'tampered' WHERE version_id = $1`,
          [v1.rows[0].version_id],
        ),
      ).rejects.toThrow('opportunity_versions rows are immutable');
    });
  });

  describe('OPPORTUNITY_UPDATED_PUBLISHED audit events', () => {
    it('logs OPPORTUNITY_UPDATED_PUBLISHED when patching published opportunity', async () => {
      const oppId = await createAndPublishOpportunity('audit-test');

      await request(app)
        .patch(`/api/v1/opportunities/${oppId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          contact_name: 'Updated Contact Name',
          modification_reason: 'Updated contact information',
        });

      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'OPPORTUNITY_UPDATED_PUBLISHED' AND entity_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [oppId],
      );
      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
      const payload = auditResult.rows[0].payload;
      expect(payload.version_number).toBe(2);
      expect(payload.modification_reason).toBe('Updated contact information');
    });
  });
});
