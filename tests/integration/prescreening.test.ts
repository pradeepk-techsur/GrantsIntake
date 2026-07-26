import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ps-${Date.now()}`;
const TEST_EMAIL = `ps.admin.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let testRuleId: string;
let questionOneId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Prescreening API', () => {
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
      [TEST_EMAIL, 'Prescreening Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org PS ${UNIQUE_ID}`, 'federal_agency'],
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
      [testOrgId, `Test Program PS ${UNIQUE_ID}`, testUserId],
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
        'Test Prescreening Opportunity',
        'Federal Health Agency',
        'Initial',
        `PS-${UNIQUE_ID}`,
        'Open to nonprofits',
        'Testing prescreening questionnaire builder',
        'Test Contact',
        'contact@example.gov',
        'Health',
        testUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Create a test eligibility rule for option mapping
    const ruleResult = await pool.query<{ rule_id: string }>(
      `INSERT INTO eligibility_rules (
        opportunity_id, rule_type, criterion_field, operator, criterion_value,
        severity, enforcement_point, explanation_text, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10) RETURNING rule_id`,
      [
        testOpportunityId,
        'nonprofit_status',
        'is_501c3',
        'is_true',
        'true',
        'hard_blocker',
        'pre_workspace',
        'Must be a 501(c)(3) nonprofit.',
        0,
        testUserId,
      ],
    );
    testRuleId = ruleResult.rows[0].rule_id;

    // Get access token
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Clean up in dependency order
    await pool.query(
      `DELETE FROM prescreening_options WHERE question_id IN (
        SELECT question_id FROM prescreening_questions WHERE questionnaire_id IN (
          SELECT questionnaire_id FROM prescreening_questionnaires WHERE opportunity_id = $1
        )
      )`,
      [testOpportunityId],
    );
    await pool.query(
      `DELETE FROM prescreening_questions WHERE questionnaire_id IN (
        SELECT questionnaire_id FROM prescreening_questionnaires WHERE opportunity_id = $1
      )`,
      [testOpportunityId],
    );
    await pool.query('DELETE FROM prescreening_questionnaires WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM eligibility_rules WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── GET (empty) ──────────────────────────────────────────────────────────

  describe('GET /api/v1/opportunities/:id/prescreening (empty)', () => {
    it('returns null when no questionnaire exists yet', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  // ─── PUT upsert with full nested structure ────────────────────────────────

  describe('PUT /api/v1/opportunities/:id/prescreening', () => {
    it('upserts questionnaire with yes_no and multiple_choice questions', async () => {
      const payload = {
        placement: 'pre_workspace',
        questions: [
          {
            question_text: 'Is your organization a 501(c)(3) nonprofit?',
            question_type: 'yes_no',
            is_required: true,
            display_order: 0,
          },
          {
            question_text: 'What is your organization type?',
            question_type: 'multiple_choice',
            is_required: true,
            display_order: 1,
            options: [
              {
                option_text: 'Nonprofit (501c3)',
                mapped_rule_id: testRuleId,
                rule_outcome: 'met',
              },
              {
                option_text: 'For-profit organization',
                mapped_rule_id: testRuleId,
                rule_outcome: 'violated',
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.questionnaire_id).toBeTruthy();
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.placement).toBe('pre_workspace');
      expect(res.body.questions).toHaveLength(2);

      const yesNoQ = res.body.questions.find((q: { question_type: string }) => q.question_type === 'yes_no');
      expect(yesNoQ).toBeTruthy();
      expect(yesNoQ.question_text).toBe('Is your organization a 501(c)(3) nonprofit?');
      expect(yesNoQ.is_required).toBe(true);

      const mcQ = res.body.questions.find((q: { question_type: string }) => q.question_type === 'multiple_choice');
      expect(mcQ).toBeTruthy();
      expect(mcQ.options).toHaveLength(2);
      expect(mcQ.options[0].mapped_rule_id).toBe(testRuleId);
      expect(mcQ.options[0].rule_outcome).toBe('met');

      questionOneId = yesNoQ.question_id;
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .send({ placement: 'pre_workspace', questions: [] });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET with full nested structure ──────────────────────────────────────

  describe('GET /api/v1/opportunities/:id/prescreening (populated)', () => {
    it('returns full nested questionnaire with questions and options', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).not.toBeNull();
      expect(res.body.placement).toBe('pre_workspace');
      expect(res.body.questions).toHaveLength(2);

      const mcQ = res.body.questions.find((q: { question_type: string }) => q.question_type === 'multiple_choice');
      expect(mcQ.options).toHaveLength(2);
      expect(mcQ.options[0].mapped_rule_id).toBe(testRuleId);
    });
  });

  // ─── Conditional display ──────────────────────────────────────────────────

  describe('Conditional display', () => {
    it('stores and returns conditional_display on question 2', async () => {
      const payload = {
        placement: 'pre_workspace',
        questions: [
          {
            question_text: 'Is your organization a 501(c)(3) nonprofit?',
            question_type: 'yes_no',
            is_required: true,
            display_order: 0,
          },
          {
            question_text: 'Please describe your nonprofit programs.',
            question_type: 'text',
            is_required: false,
            display_order: 1,
            conditional_display: {
              depends_on_question_id: questionOneId,
              trigger_response_value: 'yes',
            },
          },
        ],
      };

      const res = await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(payload);

      expect(res.status).toBe(200);

      const q2 = res.body.questions.find(
        (q: { question_type: string }) => q.question_type === 'text',
      );
      expect(q2.conditional_display).toBeTruthy();
      expect(q2.conditional_display.depends_on_question_id).toBe(questionOneId);
      expect(q2.conditional_display.trigger_response_value).toBe('yes');

      // Confirm via GET
      const getRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const q2Get = getRes.body.questions.find(
        (q: { question_type: string }) => q.question_type === 'text',
      );
      expect(q2Get.conditional_display.depends_on_question_id).toBe(questionOneId);
    });
  });

  // ─── POST preview ─────────────────────────────────────────────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/preview', () => {
    it('returns applicant-facing flattened view without rule_outcome', async () => {
      // First upsert a questionnaire with options
      await request(app)
        .put(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          placement: 'pre_submission',
          questions: [
            {
              question_text: 'Is your organization a 501(c)(3)?',
              question_type: 'yes_no',
              is_required: true,
              display_order: 0,
              options: [],
            },
          ],
        });

      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/preview`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.placement).toBe('pre_submission');
      expect(res.body.questions).toHaveLength(1);
      expect(res.body.questions[0].question_text).toBe('Is your organization a 501(c)(3)?');

      // mapped_rule_id and rule_outcome should NOT be in applicant preview
      const q = res.body.questions[0];
      expect(q).not.toHaveProperty('rule_outcome');
    });
  });
});
