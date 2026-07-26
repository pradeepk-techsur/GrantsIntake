import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `elig-${Date.now()}`;
const TEST_EMAIL = `elig.admin.${UNIQUE_ID}@example.com`;
const WRONG_ROLE_EMAIL = `elig.intake.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let wrongRoleToken: string;
let testUserId: string;
let wrongRoleUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let createdRuleId: string;

const baseRule = {
  rule_type: 'applicant_type',
  criterion_field: 'entity_type',
  operator: 'equals',
  criterion_value: 'nonprofit',
  severity: 'advisory',
  explanation_text: 'Applicant must be a nonprofit organization.',
  display_order: 1,
};

const hardBlockerRule = {
  rule_type: 'geography',
  criterion_field: 'state',
  operator: 'includes',
  criterion_value: ['CA', 'OR', 'WA'],
  severity: 'hard_blocker',
  enforcement_point: 'pre_workspace',
  explanation_text: 'Applicant must be located in CA, OR, or WA.',
  display_order: 0,
};

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Eligibility Rules API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [TEST_EMAIL]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);

    const existingWrong = await pool.query('SELECT user_id FROM users WHERE email = $1', [WRONG_ROLE_EMAIL]);
    if (existingWrong.rows.length > 0) {
      const uid = existingWrong.rows[0].user_id;
      await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
    }
    await pool.query('DELETE FROM users WHERE email = $1', [WRONG_ROLE_EMAIL]);

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const adminResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [TEST_EMAIL, 'Eligibility Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    const wrongRoleResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [WRONG_ROLE_EMAIL, 'Eligibility Intake User', hash],
    );
    wrongRoleUserId = wrongRoleResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org Elig ${UNIQUE_ID}`, 'federal_agency'],
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
      [testOrgId, `Test Program Elig ${UNIQUE_ID}`, testUserId],
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
        'Test Eligibility Opportunity',
        'Federal Grant Agency',
        'Initial',
        `ELIG-${UNIQUE_ID}`,
        'Nonprofits only',
        'Testing eligibility rule engine',
        'Test Contact',
        'test@example.gov',
        'Health',
        testUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Get access tokens
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    wrongRoleToken = await loginUser(WRONG_ROLE_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order
    await pool.query('DELETE FROM eligibility_rules WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id IN ($1, $2)', [testUserId, wrongRoleUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [testUserId, wrongRoleUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── POST /api/v1/opportunities/:id/eligibility-rules ────────────────────

  describe('POST /api/v1/opportunities/:id/eligibility-rules', () => {
    it('creates an advisory rule and returns 201 with all fields', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(baseRule);

      expect(res.status).toBe(201);
      expect(res.body.rule_id).toBeTruthy();
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.rule_type).toBe(baseRule.rule_type);
      expect(res.body.criterion_field).toBe(baseRule.criterion_field);
      expect(res.body.operator).toBe(baseRule.operator);
      expect(res.body.severity).toBe('advisory');
      expect(res.body.explanation_text).toBe(baseRule.explanation_text);
      expect(res.body.display_order).toBe(1);
      expect(res.body.created_by).toBe(testUserId);

      createdRuleId = res.body.rule_id;
    });

    it('creates a hard blocker rule with enforcement_point', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(hardBlockerRule);

      expect(res.status).toBe(201);
      expect(res.body.severity).toBe('hard_blocker');
      expect(res.body.enforcement_point).toBe('pre_workspace');
    });

    it('returns 400 when hard_blocker lacks enforcement_point', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          ...baseRule,
          severity: 'hard_blocker',
          // enforcement_point intentionally omitted
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('MISSING_ENFORCEMENT_POINT');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .send(baseRule);

      expect(res.status).toBe(401);
    });

    it('returns 403 for wrong role (intake_administrator)', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${wrongRoleToken}`)
        .send(baseRule);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('PERMISSION_DENIED');
    });
  });

  // ─── GET /api/v1/opportunities/:id/eligibility-rules ─────────────────────

  describe('GET /api/v1/opportunities/:id/eligibility-rules', () => {
    it('returns all rules for the opportunity with all fields', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const rule = res.body.find((r: { rule_id: string }) => r.rule_id === createdRuleId);
      expect(rule).toBeTruthy();
      expect(rule.display_order).toBe(1);
      expect(rule.criterion_field).toBe(baseRule.criterion_field);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`);

      expect(res.status).toBe(401);
    });
  });

  // ─── PUT /api/v1/eligibility-rules/:rule_id ───────────────────────────────

  describe('PUT /api/v1/eligibility-rules/:rule_id', () => {
    it('updates explanation_text and confirms change via GET', async () => {
      const newText = 'Updated: Must be a registered nonprofit with 501(c)(3) status.';

      const putRes = await request(app)
        .put(`/api/v1/eligibility-rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ explanation_text: newText });

      expect(putRes.status).toBe(200);
      expect(putRes.body.explanation_text).toBe(newText);

      // Confirm via GET
      const getRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const updated = getRes.body.find((r: { rule_id: string }) => r.rule_id === createdRuleId);
      expect(updated.explanation_text).toBe(newText);
    });

    it('writes ELIGIBILITY_RULE_UPDATED audit event', async () => {
      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'ELIGIBILITY_RULE_UPDATED' AND entity_id = $1`,
        [createdRuleId],
      );
      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
    });
  });

  // ─── Audit events ─────────────────────────────────────────────────────────

  describe('Audit events', () => {
    it('writes ELIGIBILITY_RULE_CREATED audit event', async () => {
      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'ELIGIBILITY_RULE_CREATED' AND entity_id = $1`,
        [createdRuleId],
      );
      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
      expect(auditResult.rows[0].entity_type).toBe('eligibility_rule');
    });
  });

  // ─── DELETE /api/v1/eligibility-rules/:rule_id ───────────────────────────

  describe('DELETE /api/v1/eligibility-rules/:rule_id', () => {
    it('deletes the rule and GET returns empty (or rule no longer present)', async () => {
      const deleteRes = await request(app)
        .delete(`/api/v1/eligibility-rules/${createdRuleId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteRes.status).toBe(204);

      // Confirm rule is gone
      const getRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/eligibility-rules`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const deleted = getRes.body.find((r: { rule_id: string }) => r.rule_id === createdRuleId);
      expect(deleted).toBeUndefined();
    });

    it('writes ELIGIBILITY_RULE_DELETED audit event', async () => {
      const auditResult = await pool.query(
        `SELECT * FROM audit_events
         WHERE event_type = 'ELIGIBILITY_RULE_DELETED' AND entity_id = $1`,
        [createdRuleId],
      );
      expect(auditResult.rows.length).toBeGreaterThanOrEqual(1);
      expect(auditResult.rows[0].actor_user_id).toBe(testUserId);
    });
  });
});
