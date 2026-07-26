import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `opp-${Date.now()}`;
const TEST_EMAIL = `opp.user.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

// intake_admin user to test RBAC rejection
const INTAKE_EMAIL = `intake.opp.${UNIQUE_ID}@example.com`;

let adminAccessToken: string;
let intakeAccessToken: string;
let testUserId: string;
let intakeUserId: string;
let testOrgId: string;
let testProgramId: string;
let testTemplateId: string;
let createdOpportunityId: string;

// Base opportunity payload (satisfies all required fields)
const baseOpportunity = {
  title: 'Community Health Innovation Grant',
  funding_source: 'State Department of Health',
  announcement_type: 'Initial',
  opportunity_number: `CHI-${UNIQUE_ID}-001`,
  funding_amount_max: 200000,
  eligibility_summary: 'Eligible applicants are 501(c)(3) non-profits serving underserved communities.',
  executive_summary: 'Funding for innovative community health programs targeting underserved populations.',
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

describe('Opportunities API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data from previous runs
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existingUser.rows.length > 0) {
      const uid = existingUser.rows[0].user_id;
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
      [TEST_EMAIL, 'Opportunities Test User', hash],
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
      [`Test Org Opp ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign grantor_admin to test user, intake_administrator to intake user
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, intakeUserId, JSON.stringify(['intake_administrator'])],
    );

    // Create a test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Test Program ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    // Get a system template ID (from seeded data)
    const templateResult = await pool.query<{ template_id: string }>(
      `SELECT template_id FROM opportunity_templates WHERE template_type = 'federal_nofo' AND is_system_template = TRUE LIMIT 1`,
    );
    if (templateResult.rows.length > 0) {
      testTemplateId = templateResult.rows[0].template_id;
    }

    // Get access tokens
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    intakeAccessToken = await loginUser(INTAKE_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order
    if (testProgramId) {
      await pool.query('DELETE FROM opportunities WHERE program_id = $1', [testProgramId]);
      await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    }
    await pool.query('DELETE FROM grantor_roles WHERE user_id IN ($1, $2)', [testUserId, intakeUserId]);
    if (testOrgId) {
      await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    }
    // Deactivate users (cannot delete due to audit_events FK immutability)
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [testUserId, intakeUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── POST /api/v1/programs/:programId/opportunities ──────────────────────

  describe('POST /api/v1/programs/:programId/opportunities', () => {
    it('returns 201 and creates opportunity with status=draft', async () => {
      const res = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(baseOpportunity);

      expect(res.status).toBe(201);
      expect(res.body.opportunity_id).toBeTruthy();
      expect(res.body.status).toBe('draft');
      expect(res.body.program_id).toBe(testProgramId);
      expect(res.body.title).toBe(baseOpportunity.title);
      expect(res.body.funding_source).toBe(baseOpportunity.funding_source);
      expect(res.body.contact_email).toBe(baseOpportunity.contact_email);
      expect(res.body.created_by).toBe(testUserId);

      createdOpportunityId = res.body.opportunity_id;
    });

    it('writes OPPORTUNITY_CREATED to audit_events on create', async () => {
      // createdOpportunityId set in previous test
      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'OPPORTUNITY_CREATED' AND entity_id = $1`,
        [createdOpportunityId],
      );
      expect(auditResult.rows.length).toBe(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
      expect(auditResult.rows[0].entity_type).toBe('opportunity');
      const payload = auditResult.rows[0].payload;
      expect(payload.program_id).toBe(testProgramId);
    });

    it('returns 400 for validation errors (missing required field)', async () => {
      const res = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ title: 'Missing required fields' }); // missing funding_source etc.

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .send(baseOpportunity);

      expect(res.status).toBe(401);
    });

    it('returns 403 for intake_administrator (wrong role)', async () => {
      const res = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${intakeAccessToken}`)
        .send({ ...baseOpportunity, opportunity_number: `CHI-${UNIQUE_ID}-intake` });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('PERMISSION_DENIED');
    });

    it('creates opportunity with template_id when provided', async () => {
      if (!testTemplateId) {
        console.log('Skipping template test — no system template found');
        return;
      }

      const res = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...baseOpportunity,
          template_id: testTemplateId,
          opportunity_number: `CHI-${UNIQUE_ID}-tpl`,
        });

      expect(res.status).toBe(201);
      expect(res.body.template_id).toBe(testTemplateId);
    });
  });

  // ─── GET /api/v1/opportunities/:id ───────────────────────────────────────

  describe('GET /api/v1/opportunities/:id', () => {
    it('returns 200 with full opportunity data', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity_id).toBe(createdOpportunityId);
      expect(res.body.title).toBe(baseOpportunity.title);
      expect(res.body.status).toBe('draft');
    });

    it('returns 404 for unknown opportunity ID', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('returns 404 without authentication for unpublished opportunity (plan 02-03: public route intercepts, T-02-13 prevents existence leak)', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${createdOpportunityId}`);

      expect(res.status).toBe(404);
    });
  });

  // ─── PATCH /api/v1/opportunities/:id ─────────────────────────────────────

  describe('PATCH /api/v1/opportunities/:id', () => {
    it('returns 200 and updates fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ title: 'Updated Title', program_area: 'Mental Health' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.program_area).toBe('Mental Health');
    });

    it('writes OPPORTUNITY_METADATA_UPDATED with field diff to audit_events', async () => {
      // Update again to trigger new audit event
      await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ contact_name: 'Dr. Smith' });

      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'OPPORTUNITY_METADATA_UPDATED' AND entity_id = $1
         ORDER BY created_at DESC LIMIT 1`,
        [createdOpportunityId],
      );
      expect(auditResult.rows.length).toBe(1);
      const payload = auditResult.rows[0].payload;
      expect(payload.diff).toBeDefined();
      expect(payload.diff.contact_name).toBeDefined();
      expect(payload.diff.contact_name.new).toBe('Dr. Smith');
    });

    it('returns 409 for duplicate opportunity_number within same program', async () => {
      // Create another opportunity to steal the number from
      const secondOpp = await request(app)
        .post(`/api/v1/programs/${testProgramId}/opportunities`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ...baseOpportunity, opportunity_number: `CHI-${UNIQUE_ID}-DUP` });
      expect(secondOpp.status).toBe(201);

      // Try to update createdOpportunityId to have the same number as secondOpp
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ opportunity_number: `CHI-${UNIQUE_ID}-DUP` });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATE_OPPORTUNITY_NUMBER');
    });

    it('returns 400 for funding_amount_min > funding_amount_max', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ funding_amount_min: 999999, funding_amount_max: 1000 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('FUNDING_RANGE_INVALID');
    });

    it('returns 400 for invalid contact_email', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ contact_email: 'not-a-valid-email' });

      expect(res.status).toBe(400);
    });

    it('returns 400 for federal funding source with invalid assistance_listing_number', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          funding_source: 'Federal Department of Health',
          assistance_listing_number: 'INVALID',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ASSISTANCE_LISTING_FORMAT_INVALID');
    });

    it('accepts valid federal funding source with correct assistance_listing_number format', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          funding_source: 'Federal Department of Health',
          assistance_listing_number: '93.045',
        });

      expect(res.status).toBe(200);
      expect(res.body.assistance_listing_number).toBe('93.045');
    });

    it('returns 403 for intake_administrator (wrong role)', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${intakeAccessToken}`)
        .send({ title: 'Should Fail' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('PERMISSION_DENIED');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .patch(`/api/v1/opportunities/${createdOpportunityId}`)
        .send({ title: 'Unauthorized Update' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/v1/opportunities/:id/versions (stub) ───────────────────────

  describe('GET /api/v1/opportunities/:id/versions', () => {
    it('returns 200 with empty array (stub for 01-04)', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${createdOpportunityId}/versions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  });
});
