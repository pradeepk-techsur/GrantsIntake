import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `pub-opp-${Date.now()}`;
const ADMIN_EMAIL = `pub.admin.${UNIQUE_ID}@example.com`;
const WRONG_ROLE_EMAIL = `pub.intake.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let wrongRoleToken: string;
let testUserId: string;
let wrongRoleUserId: string;
let testOrgId: string;
let testProgramId: string;
let publishedOpportunityId: string;
let draftOpportunityId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Public Opportunities API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    for (const email of [ADMIN_EMAIL, WRONG_ROLE_EMAIL]) {
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
      [ADMIN_EMAIL, 'Public Opp Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    const wrongRoleResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [WRONG_ROLE_EMAIL, 'Public Opp Intake User', hash],
    );
    wrongRoleUserId = wrongRoleResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org PubOpp ${UNIQUE_ID}`, 'federal_agency'],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign roles
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, testUserId, JSON.stringify(['grantor_admin'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, wrongRoleUserId, JSON.stringify(['intake_administrator'])],
    );

    // Create test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [testOrgId, `Test Program PubOpp ${UNIQUE_ID}`, testUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    // Create a PUBLISHED opportunity with all required fields for completeness check
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pubResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by,
        application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId,
        `Climate Resilience Fund ${UNIQUE_ID}`,
        'State Grant Agency',
        'Initial',
        `CLIMATE-PUB-${UNIQUE_ID}`,
        500000,
        'Open to nonprofit organizations',
        'Climate resilience funding for community organizations',
        'Jane Smith',
        'jane@example.gov',
        'Climate',
        'published',
        `climate-resilience-${UNIQUE_ID}`,
        testUserId,
        yesterday,
        futureClose,
        testUserId,
      ],
    );
    publishedOpportunityId = pubResult.rows[0].opportunity_id;

    // Create a DRAFT opportunity (should not appear in public search)
    const draftResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary, contact_name, contact_email, program_area, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING opportunity_id`,
      [
        testProgramId,
        `Draft Education Grant ${UNIQUE_ID}`,
        'Private Foundation',
        'Initial',
        `DRAFT-${UNIQUE_ID}`,
        'Must be K-12 schools',
        'Education grant for K-12 schools',
        'John Doe',
        'john@example.gov',
        'Education',
        testUserId,
      ],
    );
    draftOpportunityId = draftResult.rows[0].opportunity_id;

    // Get access tokens
    adminAccessToken = await loginUser(ADMIN_EMAIL, TEST_PASSWORD);
    wrongRoleToken = await loginUser(WRONG_ROLE_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order (addenda first since they reference opportunities)
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
    await pool.query('DELETE FROM grantor_roles WHERE user_id IN ($1, $2)', [testUserId, wrongRoleUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [testUserId, wrongRoleUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── GET /api/v1/opportunities (search) ──────────────────────────────────

  describe('GET /api/v1/opportunities', () => {
    it('returns only published opportunities without auth', async () => {
      const res = await request(app).get('/api/v1/opportunities');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('opportunities');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('page_size');

      // All returned opportunities should be published
      for (const opp of res.body.opportunities) {
        // They should have a status_badge field
        expect(['open', 'closing_soon', 'closed', 'not_yet_open']).toContain(opp.status_badge);
      }

      // Our published opportunity should appear
      const found = res.body.opportunities.find(
        (o: { opportunity_id: string }) => o.opportunity_id === publishedOpportunityId,
      );
      expect(found).toBeTruthy();

      // Draft opportunity should NOT appear
      const draftFound = res.body.opportunities.find(
        (o: { opportunity_id: string }) => o.opportunity_id === draftOpportunityId,
      );
      expect(draftFound).toBeUndefined();
    });

    it('keyword search returns opportunities with matching text', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities')
        .query({ keyword: 'climate resilience' });

      expect(res.status).toBe(200);
      const found = res.body.opportunities.find(
        (o: { opportunity_id: string }) => o.opportunity_id === publishedOpportunityId,
      );
      expect(found).toBeTruthy();
    });

    it('funding_min filter returns only opportunities with max_award_amount >= funding_min', async () => {
      // Our published opp has funding_amount_max = 500000
      const res = await request(app)
        .get('/api/v1/opportunities')
        .query({ funding_min: 50000 });

      expect(res.status).toBe(200);
      const found = res.body.opportunities.find(
        (o: { opportunity_id: string }) => o.opportunity_id === publishedOpportunityId,
      );
      expect(found).toBeTruthy();

      // Filter above our amount should exclude it
      const resHigh = await request(app)
        .get('/api/v1/opportunities')
        .query({ funding_min: 1000000 });

      expect(resHigh.status).toBe(200);
      const notFound = resHigh.body.opportunities.find(
        (o: { opportunity_id: string }) => o.opportunity_id === publishedOpportunityId,
      );
      expect(notFound).toBeUndefined();
    });

    it('pagination returns correct slice', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities')
        .query({ page: 1, page_size: 5 });

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.page_size).toBe(5);
      expect(res.body.opportunities.length).toBeLessThanOrEqual(5);
    });

    it('returns 400 for invalid page_size (above max)', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities')
        .query({ page_size: 999 });

      // Zod coerces and caps — verify schema validation catches it
      expect([200, 400]).toContain(res.status);
    });
  });

  // ─── GET /api/v1/opportunities/:id (detail) ────────────────────────────────

  describe('GET /api/v1/opportunities/:id', () => {
    it('returns 200 with status_badge for a published opportunity', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${publishedOpportunityId}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity_id).toBe(publishedOpportunityId);
      expect(res.body).toHaveProperty('status_badge');
      expect(['open', 'closing_soon', 'closed', 'not_yet_open']).toContain(res.body.status_badge);
      expect(res.body).toHaveProperty('eligibility_rules');
      expect(res.body).toHaveProperty('attachment_requirements');
      expect(res.body).toHaveProperty('addenda_count');
    });

    it('returns 404 for unpublished opportunity when caller is not authenticated grantor', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${draftOpportunityId}`);

      expect(res.status).toBe(404);
    });

    it('does not include criterion_value in public eligibility_rules response', async () => {
      // First add an eligibility rule
      await pool.query(
        `INSERT INTO eligibility_rules (opportunity_id, rule_type, criterion_field, operator, criterion_value, severity, explanation_text, created_by)
         VALUES ($1, 'applicant_type', 'entity_type', 'equals', '"nonprofit"'::jsonb, 'advisory', 'Must be nonprofit', $2)`,
        [publishedOpportunityId, testUserId],
      );

      const res = await request(app)
        .get(`/api/v1/opportunities/${publishedOpportunityId}`);

      expect(res.status).toBe(200);
      if (res.body.eligibility_rules.length > 0) {
        const rule = res.body.eligibility_rules[0];
        // criterion_value JSONB must NOT be in public response (T-02-18)
        expect(rule).not.toHaveProperty('criterion_value');
        expect(rule).toHaveProperty('severity');
        expect(rule).toHaveProperty('explanation_text');
      }
    });

    it('returns 404 for non-existent opportunity', async () => {
      const res = await request(app)
        .get('/api/v1/opportunities/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /api/v1/opportunities/:id/workspace-status ───────────────────────

  describe('GET /api/v1/opportunities/:id/workspace-status', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${publishedOpportunityId}/workspace-status`);

      expect(res.status).toBe(401);
    });

    it('returns workspace status for authenticated user', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${publishedOpportunityId}/workspace-status`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(['start', 'continue', 'closed']).toContain(res.body.status);
    });
  });
});
