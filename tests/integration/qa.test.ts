import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `qa-${Date.now()}`;
const GRANTOR_ADMIN_EMAIL = `qa.grantor.admin.${UNIQUE_ID}@example.com`;
const APPLICANT_EMAIL = `qa.applicant.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let grantorAdminToken: string;
let applicantToken: string;
let grantorUserId: string;
let applicantUserId: string;
let grantorOrgId: string;
let applicantOrgId: string;
let testProgramId: string;
let enabledOpportunityId: string;
let disabledOpportunityId: string;
let createdQuestionId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Q&A API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    for (const email of [GRANTOR_ADMIN_EMAIL, APPLICANT_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    // Create grantor admin user
    const grantorResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [GRANTOR_ADMIN_EMAIL, 'QA Test Grantor Admin', hash],
    );
    grantorUserId = grantorResult.rows[0].user_id;

    // Create applicant user
    const applicantResult = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [APPLICANT_EMAIL, 'QA Test Applicant', hash],
    );
    applicantUserId = applicantResult.rows[0].user_id;

    // Create grantor org + role
    const grantorOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`QA Test Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [grantorOrgId, grantorUserId, JSON.stringify(['grantor_admin'])],
    );

    // Create applicant org + role
    const appOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (legal_name, entity_type, address_line1, city, state, zip, primary_contact_name, primary_contact_email)
       VALUES ($1, $2, '123 Test St', 'Washington', 'DC', '20001', 'Test Contact', 'contact@test.com') RETURNING org_id`,
      [`QA Test Applicant Org ${UNIQUE_ID}`, 'nonprofit'],
    );
    applicantOrgId = appOrgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by)
       VALUES ($1, $2, $3::jsonb, $2)
       ON CONFLICT DO NOTHING`,
      [applicantOrgId, applicantUserId, JSON.stringify(['org_admin'])],
    );

    // Create test program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `QA Test Program ${UNIQUE_ID}`, grantorUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Create opportunity with Q&A ENABLED
    const enabledResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by,
        qa_config
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17, $18)
      RETURNING opportunity_id`,
      [
        testProgramId,
        `QA Enabled Opportunity ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `QA-ENABLED-${UNIQUE_ID}`,
        100000,
        'Open to nonprofits',
        'Q&A test funding',
        'Dr. QA',
        'qa@example.gov',
        'Education',
        'published',
        `qa-enabled-${UNIQUE_ID}`,
        grantorUserId,
        yesterday,
        futureClose,
        grantorUserId,
        JSON.stringify({ enabled: true }),
      ],
    );
    enabledOpportunityId = enabledResult.rows[0].opportunity_id;

    // Create opportunity with Q&A DISABLED
    const disabledResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, published_at, published_by, created_by,
        qa_config
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), $12, $13, $14)
      RETURNING opportunity_id`,
      [
        testProgramId,
        `QA Disabled Opportunity ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `QA-DISABLED-${UNIQUE_ID}`,
        'Open to nonprofits',
        'Q&A disabled test',
        'Dr. NoQA',
        'noqa@example.gov',
        'Education',
        'published',
        grantorUserId,
        grantorUserId,
        JSON.stringify({ enabled: false }),
      ],
    );
    disabledOpportunityId = disabledResult.rows[0].opportunity_id;

    // Get access tokens
    grantorAdminToken = await loginUser(GRANTOR_ADMIN_EMAIL, TEST_PASSWORD);
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable audit_events immutability trigger for cleanup
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER ALL').catch(() => {});

    // Clean up in dependency order
    await pool.query('DELETE FROM qa_items WHERE opportunity_id IN ($1, $2)', [
      enabledOpportunityId,
      disabledOpportunityId,
    ]);
    await pool.query(
      `DELETE FROM audit_events WHERE actor_user_id IN ($1, $2) OR (entity_type = 'qa_item' AND payload::jsonb->>'opportunity_id' IN ($3, $4))`,
      [grantorUserId, applicantUserId, enabledOpportunityId, disabledOpportunityId],
    );
    // Clean up NOTIFICATION_SENT events for workspaces on these opportunities
    await pool.query(
      `DELETE FROM audit_events WHERE entity_type = 'workspace' AND event_type = 'NOTIFICATION_SENT' AND payload::jsonb->>'opportunity_id' IN ($1, $2)`,
      [enabledOpportunityId, disabledOpportunityId],
    );
    await pool.query('DELETE FROM application_workspaces WHERE opportunity_id IN ($1, $2)', [
      enabledOpportunityId,
      disabledOpportunityId,
    ]);
    await pool.query('DELETE FROM opportunity_versions WHERE opportunity_id IN ($1, $2)', [
      enabledOpportunityId,
      disabledOpportunityId,
    ]);
    await pool.query('DELETE FROM eligibility_rules WHERE opportunity_id IN ($1, $2)', [
      enabledOpportunityId,
      disabledOpportunityId,
    ]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id IN ($1, $2)', [
      enabledOpportunityId,
      disabledOpportunityId,
    ]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [grantorUserId]);
    await pool.query('DELETE FROM org_roles WHERE user_id = $1', [applicantUserId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id IN ($1, $2)', [
      grantorUserId,
      applicantUserId,
    ]);

    // Re-enable trigger
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER ALL').catch(() => {});

    await pool.end();
    await closeRedisClient();
  });

  // ─── Test 1: GET /opportunities/:id/qa returns empty array ─────────────────
  it('GET /opportunities/:id/qa returns 200 with empty array when no answered questions', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${enabledOpportunityId}/qa`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  // ─── Test 2: POST /opportunities/:id/questions (applicant submits) ─────────
  it('POST /opportunities/:id/questions with applicant token returns 201', async () => {
    const res = await request(app)
      .post(`/api/v1/opportunities/${enabledOpportunityId}/questions`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ question_text: 'What documents are required for eligibility?' });

    expect(res.status).toBe(201);
    expect(res.body.qa_id).toBeTruthy();
    expect(res.body.question_text).toBe('What documents are required for eligibility?');
    expect(res.body.status).toBe('submitted');
    expect(res.body.submitter_org_id).toBe(applicantOrgId);
    expect(res.body.submitter_user_id).toBe(applicantUserId);
    expect(res.body.answer_text).toBeNull();

    createdQuestionId = res.body.qa_id;
  });

  // ─── Test 3: POST without auth returns 401 ────────────────────────────────
  it('POST /opportunities/:id/questions without auth returns 401', async () => {
    const res = await request(app)
      .post(`/api/v1/opportunities/${enabledOpportunityId}/questions`)
      .send({ question_text: 'Unauthenticated question' });

    expect(res.status).toBe(401);
  });

  // ─── Test 4: POST when qa_config.enabled=false returns 403 QA_DISABLED ────
  it('POST /opportunities/:id/questions when qa_config.enabled=false returns 403', async () => {
    const res = await request(app)
      .post(`/api/v1/opportunities/${disabledOpportunityId}/questions`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ question_text: 'This should be rejected' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('QA_DISABLED');
  });

  // ─── Test 5: GET /opportunities/:id/questions with grantor token ───────────
  it('GET /opportunities/:id/questions with grantor token returns 200 with all questions', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${enabledOpportunityId}/questions`)
      .set('Authorization', `Bearer ${grantorAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((q: { qa_id: string }) => q.qa_id === createdQuestionId)).toBe(true);
  });

  // ─── Test 6: GET /questions with applicant token returns 403 ───────────────
  it('GET /opportunities/:id/questions with applicant token returns 403', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${enabledOpportunityId}/questions`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(res.status).toBe(403);
  });

  // ─── Test 7: PUT /questions/:id/answer with grantor ────────────────────────
  it('PUT /questions/:id/answer with grantor token returns 200 with answered status', async () => {
    const res = await request(app)
      .put(`/api/v1/questions/${createdQuestionId}/answer`)
      .set('Authorization', `Bearer ${grantorAdminToken}`)
      .send({ answer_text: 'You need a 501(c)(3) determination letter and your latest audit.' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('answered');
    expect(res.body.answer_text).toBe('You need a 501(c)(3) determination letter and your latest audit.');
    expect(res.body.published_by).toBe(grantorUserId);
    expect(res.body.published_at).toBeTruthy();
  });

  // ─── Test 8: GET /qa after answer published shows 1 item ───────────────────
  it('GET /opportunities/:id/qa after answer published returns 200 with 1 answered item', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${enabledOpportunityId}/qa`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].qa_id).toBe(createdQuestionId);
    expect(res.body[0].status).toBe('answered');
    expect(res.body[0].answer_text).toBeTruthy();
  });

  // ─── Test 9: GET /audit-history returns events ─────────────────────────────
  it('GET /opportunities/:id/audit-history with grantor token returns 200 with events', async () => {
    const res = await request(app)
      .get(`/api/v1/opportunities/${enabledOpportunityId}/audit-history`)
      .set('Authorization', `Bearer ${grantorAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2); // at least SUBMITTED + PUBLISHED
    const eventTypes = res.body.map((e: { event_type: string }) => e.event_type);
    expect(eventTypes).toContain('QA_QUESTION_SUBMITTED');
    expect(eventTypes).toContain('QA_ANSWER_PUBLISHED');
  });

  // ─── Test 10: PUT /questions/:id/answer with applicant token returns 403 ──
  it('PUT /questions/:id/answer with applicant token returns 403', async () => {
    const res = await request(app)
      .put(`/api/v1/questions/${createdQuestionId}/answer`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send({ answer_text: 'Applicant trying to answer' });

    expect(res.status).toBe(403);
  });
});
