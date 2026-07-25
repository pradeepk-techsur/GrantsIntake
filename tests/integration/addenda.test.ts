import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `addenda-${Date.now()}`;
const ADMIN_EMAIL = `addenda.admin.${UNIQUE_ID}@example.com`;
const OFFICER_EMAIL = `addenda.officer.${UNIQUE_ID}@example.com`;
const INTAKE_EMAIL = `addenda.intake.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let officerAccessToken: string;
let intakeToken: string;
let testUserId: string;
let officerUserId: string;
let intakeUserId: string;
let testOrgId: string;
let testProgramId: string;
let publishedOpportunityId: string;
let draftOpportunityId: string;
let createdAddendumId1: string;
let createdAddendumId2: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Addenda API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    for (const email of [ADMIN_EMAIL, OFFICER_EMAIL, INTAKE_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const adminResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [ADMIN_EMAIL, 'Addenda Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    const officerResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [OFFICER_EMAIL, 'Addenda Program Officer', hash],
    );
    officerUserId = officerResult.rows[0].user_id;

    const intakeResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [INTAKE_EMAIL, 'Addenda Intake User', hash],
    );
    intakeUserId = intakeResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org Addenda ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign roles
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, officerUserId, JSON.stringify(['program_officer'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, intakeUserId, JSON.stringify(['intake_administrator'])],
    );

    // Create test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Test Program Addenda ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Create a PUBLISHED opportunity
    const pubResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId,
        `Health Innovation Grant ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `HEALTH-PUB-${UNIQUE_ID}`,
        250000,
        'Open to healthcare nonprofits',
        'Health innovation funding',
        'Dr. Smith',
        'drsmith@example.gov',
        'Health',
        'published',
        `health-innovation-${UNIQUE_ID}`,
        testUserId,
        yesterday,
        futureClose,
        testUserId,
      ],
    );
    publishedOpportunityId = pubResult.rows[0].opportunity_id;

    // Create a DRAFT opportunity for the "unpublished" tests
    const draftResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary, contact_name, contact_email, program_area, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING opportunity_id`,
      [
        testProgramId,
        `Draft Health Grant ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `HEALTH-DRAFT-${UNIQUE_ID}`,
        'Open to healthcare nonprofits',
        'Health innovation funding — draft',
        'Dr. Jones',
        'drjones@example.gov',
        'Health',
        testUserId,
      ],
    );
    draftOpportunityId = draftResult.rows[0].opportunity_id;

    // Get access tokens
    adminAccessToken = await loginUser(ADMIN_EMAIL, TEST_PASSWORD);
    officerAccessToken = await loginUser(OFFICER_EMAIL, TEST_PASSWORD);
    intakeToken = await loginUser(INTAKE_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order
    await pool.query('DELETE FROM addenda WHERE opportunity_id IN ($1, $2)', [
      publishedOpportunityId,
      draftOpportunityId,
    ]);
    await pool.query('DELETE FROM audit_events WHERE entity_id IN ($1, $2)', [
      publishedOpportunityId,
      draftOpportunityId,
    ]);
    await pool.query('DELETE FROM opportunity_versions WHERE opportunity_id IN ($1, $2)', [
      publishedOpportunityId,
      draftOpportunityId,
    ]);
    await pool.query('DELETE FROM eligibility_rules WHERE opportunity_id IN ($1, $2)', [
      publishedOpportunityId,
      draftOpportunityId,
    ]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id IN ($1, $2)', [
      publishedOpportunityId,
      draftOpportunityId,
    ]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id IN ($1, $2, $3)', [
      testUserId,
      officerUserId,
      intakeUserId,
    ]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2, $3)', [
      testUserId,
      officerUserId,
      intakeUserId,
    ]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── POST /api/v1/opportunities/:id/addenda ───────────────────────────────

  describe('POST /api/v1/opportunities/:id/addenda', () => {
    it('grantor_admin creates first addendum with version_number=1', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${publishedOpportunityId}/addenda`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          addendum_type: 'clarification',
          title: 'Clarification on Eligibility',
          body: 'All applicants must register with SAM.gov before submitting.',
          is_required_change: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.addendum_id).toBeTruthy();
      expect(res.body.version_number).toBe(1);
      expect(res.body.addendum_type).toBe('clarification');
      expect(res.body.title).toBe('Clarification on Eligibility');
      expect(res.body.is_required_change).toBe(false);
      expect(res.body.published_by).toBe(testUserId);

      createdAddendumId1 = res.body.addendum_id;
    });

    it('program_officer creates second addendum with version_number=2', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${publishedOpportunityId}/addenda`)
        .set('Authorization', `Bearer ${officerAccessToken}`)
        .send({
          addendum_type: 'date_change',
          title: 'Deadline Extension',
          body: 'Application deadline extended to December 31, 2026.',
          is_required_change: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.version_number).toBe(2);
      expect(res.body.is_required_change).toBe(true);
      expect(res.body.addendum_type).toBe('date_change');

      createdAddendumId2 = res.body.addendum_id;
    });

    it('returns 400 for invalid addendum_type', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${publishedOpportunityId}/addenda`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          addendum_type: 'invalid_type',
          title: 'Test',
          body: 'Test body',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when adding addendum to unpublished opportunity', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${draftOpportunityId}/addenda`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          addendum_type: 'clarification',
          title: 'Test',
          body: 'Test body',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('NOT_PUBLISHED');
    });

    it('returns 403 for user without grantor_admin or program_officer role', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${publishedOpportunityId}/addenda`)
        .set('Authorization', `Bearer ${intakeToken}`)
        .send({
          addendum_type: 'clarification',
          title: 'Test',
          body: 'Test body',
        });

      expect(res.status).toBe(403);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${publishedOpportunityId}/addenda`)
        .send({
          addendum_type: 'clarification',
          title: 'Test',
          body: 'Test body',
        });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET /api/v1/opportunities/:id/addenda ────────────────────────────────

  describe('GET /api/v1/opportunities/:id/addenda', () => {
    it('returns both addenda in published_at DESC order (no auth required)', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${publishedOpportunityId}/addenda`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);

      // Should be in published_at DESC order — most recent first (version 2)
      const addendaIds = res.body.map((a: { addendum_id: string }) => a.addendum_id);
      expect(addendaIds).toContain(createdAddendumId1);
      expect(addendaIds).toContain(createdAddendumId2);

      // version_number 2 should appear before version_number 1 (published later)
      const idx1 = res.body.findIndex((a: { addendum_id: string }) => a.addendum_id === createdAddendumId1);
      const idx2 = res.body.findIndex((a: { addendum_id: string }) => a.addendum_id === createdAddendumId2);
      expect(idx2).toBeLessThan(idx1);
    });
  });

  // ─── DELETE (immutability) ────────────────────────────────────────────────

  describe('DELETE /api/v1/opportunities/:id/addenda/:addendum_id (immutability)', () => {
    it('returns 405 Method Not Allowed (addenda are immutable)', async () => {
      const res = await request(app)
        .delete(`/api/v1/opportunities/${publishedOpportunityId}/addenda/${createdAddendumId1}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(405);
      expect(res.body.error).toBe('METHOD_NOT_ALLOWED');
    });
  });
});
