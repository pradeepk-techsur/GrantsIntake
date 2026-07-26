import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ap-${Date.now()}`;
const APPLICANT_EMAIL = `ap.applicant.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const GRANTOR_EMAIL = `ap.grantor.${UNIQUE_ID}@example.com`;

let applicantAccessToken: string;
let applicantUserId: string;
let applicantOrgId: string;

let grantorAccessToken: string;
let grantorUserId: string;
let grantorOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let testRuleId: string; // hard_blocker rule
let testAdvisoryRuleId: string;
let questionId: string;  // yes_no question (for hard_blocker)
let optionYesId: string; // option that triggers hard_blocker
let optionNoId: string;  // option that doesn't trigger

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

async function createUser(email: string, name: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  const result = await pool.query<{ user_id: string }>(
    `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
    [email, name, hash],
  );
  return result.rows[0].user_id;
}

describe('Applicant Prescreening', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    for (const email of [APPLICANT_EMAIL, GRANTOR_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
      }
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Create applicant user
    applicantUserId = await createUser(APPLICANT_EMAIL, 'Applicant Test User');

    // Create grantor user
    grantorUserId = await createUser(GRANTOR_EMAIL, 'Grantor Test User');

    // Create grantor organization
    const grantorOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Grantor Org AP ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgResult.rows[0].org_id;

    // Assign grantor_admin role BEFORE login (so JWT contains the role)
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [grantorOrgId, grantorUserId, JSON.stringify(['grantor_admin'])],
    );

    // Login AFTER role assignment so JWT includes the role
    applicantAccessToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
    grantorAccessToken = await loginUser(GRANTOR_EMAIL, TEST_PASSWORD);

    // Create applicant org directly (bypassing API for speed)
    const applicantOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (
        legal_name, address_line1, city, state, zip, entity_type,
        primary_contact_name, primary_contact_email, banking_readiness,
        sam_registered, profile_completeness_pct
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING org_id`,
      [
        `Test Applicant Org AP ${UNIQUE_ID}`, '123 Main St', 'Testville', 'VA', '22301',
        'nonprofit_501c3', 'Test Contact', 'contact@testorg.example.com', 'ready',
        false, 50.00,
      ],
    );
    applicantOrgId = applicantOrgResult.rows[0].org_id;

    // Link applicant user to org
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [applicantOrgId, applicantUserId, JSON.stringify(['org_admin'])],
    );

    // Create test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `Test Program AP ${UNIQUE_ID}`, grantorUserId],
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
        'Test Applicant Prescreening Opportunity',
        'Federal Health Agency',
        'Initial',
        `AP-${UNIQUE_ID}`,
        'Open to nonprofits only',
        'Testing applicant prescreening flow',
        'Test Grantor Contact',
        'grantor@example.gov',
        'Health',
        grantorUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Create eligibility rules
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
        '"true"',
        'hard_blocker',
        'pre_workspace',
        'Must be a 501(c)(3) nonprofit.',
        0,
        grantorUserId,
      ],
    );
    testRuleId = ruleResult.rows[0].rule_id;

    const advisoryRuleResult = await pool.query<{ rule_id: string }>(
      `INSERT INTO eligibility_rules (
        opportunity_id, rule_type, criterion_field, operator, criterion_value,
        severity, enforcement_point, explanation_text, display_order, created_by
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10) RETURNING rule_id`,
      [
        testOpportunityId,
        'nonprofit_status',
        'has_audit',
        'is_true',
        '"true"',
        'advisory',
        'pre_workspace',
        'Applicant should have an annual audit for awards over $750k.',
        1,
        grantorUserId,
      ],
    );
    testAdvisoryRuleId = advisoryRuleResult.rows[0].rule_id;

    // Create prescreening questionnaire via API (grantor PUT route)
    const questPayload = {
      placement: 'pre_workspace',
      questions: [
        {
          question_text: 'Is your organization for-profit?',
          question_type: 'yes_no',
          is_required: true,
          display_order: 0,
          options: [
            {
              option_text: 'Yes',
              mapped_rule_id: testRuleId,
              rule_outcome: 'violated',
            },
            {
              option_text: 'No',
              mapped_rule_id: null,
              rule_outcome: null,
            },
          ],
        },
        {
          question_text: 'Does your org have an annual audit?',
          question_type: 'yes_no',
          is_required: false,
          display_order: 1,
          options: [
            {
              option_text: 'No',
              mapped_rule_id: testAdvisoryRuleId,
              rule_outcome: 'advisory',
            },
            {
              option_text: 'Yes',
              mapped_rule_id: null,
              rule_outcome: null,
            },
          ],
        },
      ],
    };

    const questRes = await request(app)
      .put(`/api/v1/opportunities/${testOpportunityId}/prescreening`)
      .set('Authorization', `Bearer ${grantorAccessToken}`)
      .send(questPayload);

    if (questRes.status !== 200) {
      throw new Error(
        `PUT prescreening failed with status ${questRes.status}: ${JSON.stringify(questRes.body)}`,
      );
    }

    // Extract question and option IDs from the created questionnaire
    const questions = questRes.body.questions;
    const forProfitQ = questions.find((q: { question_text: string }) => q.question_text.includes('for-profit'));
    questionId = forProfitQ.question_id;
    optionYesId = forProfitQ.options.find((o: { option_text: string }) => o.option_text === 'Yes').option_id;
    optionNoId = forProfitQ.options.find((o: { option_text: string }) => o.option_text === 'No').option_id;
  });

  afterAll(async () => {
    // Clean up in dependency order
    // Remove eligibility_responses first
    await pool.query(
      `DELETE FROM eligibility_responses WHERE opportunity_id = $1`,
      [testOpportunityId],
    );
    // Remove prescreening data
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
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [grantorUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    await pool.query('DELETE FROM org_roles WHERE user_id = $1', [applicantUserId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    // Disable trigger to allow user deletion
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    await pool.query('DELETE FROM audit_events WHERE actor_user_id IN ($1, $2)', [applicantUserId, grantorUserId]);
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [applicantUserId, grantorUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── Test 1: GET questionnaire ────────────────────────────────────────────

  describe('GET /api/v1/opportunities/:id/prescreening/applicant', () => {
    it('returns 200 with questionnaire structure (questions + options)', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening/applicant`)
        .set('Authorization', `Bearer ${applicantAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeTruthy();
      expect(res.body.questions).toBeDefined();
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);
      // Verify options are present
      const q = res.body.questions[0];
      expect(q.options).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening/applicant`);

      expect(res.status).toBe(401);
    });
  });

  // ─── Test 2: POST submit — no org → 400 ─────────────────────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/submit — no org', () => {
    it('returns 400 when user has no org profile', async () => {
      // Create a user with no org
      const noOrgEmail = `ap.noorg.${UNIQUE_ID}@example.com`;
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(TEST_PASSWORD, 12);
      const noOrgResult = await pool.query<{ user_id: string }>(
        `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
        [noOrgEmail, 'No Org User', hash],
      );
      const noOrgUserId = noOrgResult.rows[0].user_id;
      const noOrgToken = await loginUser(noOrgEmail, TEST_PASSWORD);

      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/submit`)
        .set('Authorization', `Bearer ${noOrgToken}`)
        .send({
          responses: [
            { question_id: questionId, selected_option_id: optionNoId },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('NO_ORG_PROFILE');

      // Cleanup
      await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [noOrgUserId]);
    });
  });

  // ─── Test 3: Submit non-triggering responses → eligible ─────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/submit — eligible', () => {
    it('returns overall_result=eligible when no rules triggered', async () => {
      // Create a second applicant org (for this test, different from main applicant)
      const eligEmail = `ap.elig.${UNIQUE_ID}@example.com`;
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(TEST_PASSWORD, 12);
      const eligUserResult = await pool.query<{ user_id: string }>(
        `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
        [eligEmail, 'Eligible User', hash],
      );
      const eligUserId = eligUserResult.rows[0].user_id;

      const eligOrgResult = await pool.query<{ org_id: string }>(
        `INSERT INTO organizations (
          legal_name, address_line1, city, state, zip, entity_type,
          primary_contact_name, primary_contact_email, banking_readiness,
          sam_registered, profile_completeness_pct
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING org_id`,
        [
          `Eligible Org AP ${UNIQUE_ID}`, '456 Oak Ave', 'Testtown', 'CA', '90001',
          'nonprofit_501c3', 'Elig Contact', 'elig@testorg.example.com', 'ready',
          false, 50.00,
        ],
      );
      const eligOrgId = eligOrgResult.rows[0].org_id;

      await pool.query(
        `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
        [eligOrgId, eligUserId, JSON.stringify(['org_admin'])],
      );

      const eligToken = await loginUser(eligEmail, TEST_PASSWORD);

      // Get all questions to submit all
      const questRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening/applicant`)
        .set('Authorization', `Bearer ${eligToken}`);

      const questions = questRes.body.questions;

      // Build responses: select "No" for the for-profit question (no rule trigger)
      // and "Yes" for the audit question (no rule trigger)
      const responses = questions.map((q: { question_id: string; options: Array<{ option_id: string; option_text: string }> }) => {
        if (q.options && q.options.length > 0) {
          // Select option that doesn't trigger a rule (use last option which is "No" for first Q)
          return { question_id: q.question_id, selected_option_id: q.options[q.options.length - 1].option_id };
        }
        return { question_id: q.question_id, response_text: 'Test response' };
      });

      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/submit`)
        .set('Authorization', `Bearer ${eligToken}`)
        .send({ responses });

      expect(res.status).toBe(200);
      expect(res.body.overall_result).toBe('eligible');
      expect(res.body.workspace_access_granted).toBe(true);
      expect(res.body.triggered_rules).toHaveLength(0);
      expect(res.body.next_step).toContain('proceed');

      // Cleanup
      await pool.query('DELETE FROM eligibility_responses WHERE org_id = $1', [eligOrgId]);
      await pool.query('DELETE FROM org_roles WHERE user_id = $1', [eligUserId]);
      await pool.query('DELETE FROM organizations WHERE org_id = $1', [eligOrgId]);
      await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [eligUserId]);
    });
  });

  // ─── Test 4: Submit hard_blocker trigger → ineligible ───────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/submit — ineligible', () => {
    it('returns overall_result=ineligible when hard_blocker triggered', async () => {
      // Use main applicant user (first submission for testOpportunityId)
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/submit`)
        .set('Authorization', `Bearer ${applicantAccessToken}`)
        .send({
          responses: [
            { question_id: questionId, selected_option_id: optionYesId }, // triggers hard_blocker
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.overall_result).toBe('ineligible');
      expect(res.body.workspace_access_granted).toBe(false);
      expect(res.body.triggered_rules.length).toBeGreaterThan(0);
      const hardBlocker = res.body.triggered_rules.find(
        (r: { severity: string }) => r.severity === 'hard_blocker',
      );
      expect(hardBlocker).toBeTruthy();
      expect(hardBlocker.explanation_text).toBe('Must be a 501(c)(3) nonprofit.');
      expect(res.body.next_step).toContain('does not meet');
    });
  });

  // ─── Test 5: Advisory trigger → likely_eligible ──────────────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/submit — likely_eligible', () => {
    it('returns overall_result=likely_eligible when 1-2 advisories triggered', async () => {
      // Create another org for this test
      const advEmail = `ap.adv.${UNIQUE_ID}@example.com`;
      const bcrypt = await import('bcrypt');
      const hash = await bcrypt.hash(TEST_PASSWORD, 12);
      const advUserResult = await pool.query<{ user_id: string }>(
        `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
        [advEmail, 'Advisory User', hash],
      );
      const advUserId = advUserResult.rows[0].user_id;

      const advOrgResult = await pool.query<{ org_id: string }>(
        `INSERT INTO organizations (
          legal_name, address_line1, city, state, zip, entity_type,
          primary_contact_name, primary_contact_email, banking_readiness,
          sam_registered, profile_completeness_pct
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING org_id`,
        [
          `Advisory Org AP ${UNIQUE_ID}`, '789 Pine St', 'Testburg', 'TX', '75001',
          'nonprofit_501c3', 'Adv Contact', 'adv@testorg.example.com', 'ready',
          false, 50.00,
        ],
      );
      const advOrgId = advOrgResult.rows[0].org_id;

      await pool.query(
        `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
        [advOrgId, advUserId, JSON.stringify(['org_admin'])],
      );

      const advToken = await loginUser(advEmail, TEST_PASSWORD);

      // Get questions to find the audit question
      const questRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening/applicant`)
        .set('Authorization', `Bearer ${advToken}`);

      const questions = questRes.body.questions;
      const auditQ = questions.find((q: { question_text: string }) => q.question_text.includes('audit'));
      const noAuditOption = auditQ?.options?.find((o: { option_text: string }) => o.option_text === 'No');
      const notForProfitQ = questions.find((q: { question_text: string }) => q.question_text.includes('for-profit'));
      const notForProfitOption = notForProfitQ?.options?.find((o: { option_text: string }) => o.option_text === 'No');

      const responses = [
        { question_id: notForProfitQ.question_id, selected_option_id: notForProfitOption.option_id }, // no trigger
      ];
      if (auditQ && noAuditOption) {
        responses.push({ question_id: auditQ.question_id, selected_option_id: noAuditOption.option_id }); // triggers advisory
      }

      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/submit`)
        .set('Authorization', `Bearer ${advToken}`)
        .send({ responses });

      expect(res.status).toBe(200);
      expect(res.body.overall_result).toBe('likely_eligible');
      expect(res.body.workspace_access_granted).toBe(true);
      const advisory = res.body.triggered_rules.find(
        (r: { severity: string }) => r.severity === 'advisory',
      );
      expect(advisory).toBeTruthy();

      // Cleanup
      await pool.query('DELETE FROM eligibility_responses WHERE org_id = $1', [advOrgId]);
      await pool.query('DELETE FROM org_roles WHERE user_id = $1', [advUserId]);
      await pool.query('DELETE FROM organizations WHERE org_id = $1', [advOrgId]);
      await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [advUserId]);
    });
  });

  // ─── Test 6: Re-submit → 409 ALREADY_SUBMITTED ───────────────────────────

  describe('POST /api/v1/opportunities/:id/prescreening/submit — already submitted', () => {
    it('returns 409 ALREADY_SUBMITTED on re-submission', async () => {
      // Applicant user already submitted (from test 4 above)
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/prescreening/submit`)
        .set('Authorization', `Bearer ${applicantAccessToken}`)
        .send({
          responses: [
            { question_id: questionId, selected_option_id: optionNoId },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_SUBMITTED');
    });
  });

  // ─── Test 7: GET requires auth ────────────────────────────────────────────

  describe('GET /api/v1/opportunities/:id/prescreening/applicant — auth required', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/prescreening/applicant`);

      expect(res.status).toBe(401);
    });
  });

  // ─── Test 8: Verify eligibility_responses rows inserted ──────────────────

  describe('eligibility_responses storage', () => {
    it('stores one row per question for submitted org', async () => {
      // Count responses for applicant org (submitted in test 4)
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM eligibility_responses
         WHERE opportunity_id = $1 AND org_id = $2`,
        [testOpportunityId, applicantOrgId],
      );
      const count = parseInt(result.rows[0].count);
      // At least 1 row inserted (the question submitted)
      expect(count).toBeGreaterThan(0);
    });
  });
});
