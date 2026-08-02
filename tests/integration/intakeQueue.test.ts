import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `iq-${Date.now()}`;
const GRANTOR_EMAIL = `iq.grantor.${UNIQUE_ID}@example.com`;
const GRANTOR_ADMIN_EMAIL = `iq.admin.${UNIQUE_ID}@example.com`;
const APPLICANT_EMAIL = `iq.applicant.${UNIQUE_ID}@example.com`;
const OTHER_GRANTOR_EMAIL = `iq.othergrantor.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

const CERT_TEXT =
  'I certify that the information contained in this application is accurate and complete, and that I am authorized to submit this application on behalf of the applicant organization.';

let grantorToken: string;
let grantorAdminToken: string;
let applicantToken: string;
let otherGrantorToken: string;

let grantorUserId: string;
let grantorAdminUserId: string;
let applicantUserId: string;
let otherGrantorUserId: string;

let applicantOrgId: string;
let grantorOrgId: string;
let otherGrantorOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let workspaceId: string;
let entryId: string;
let notificationId: string;
let dispositionId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Intake Queue API', () => {
  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    // Clean up leftover test data by email
    for (const email of [GRANTOR_EMAIL, GRANTOR_ADMIN_EMAIL, APPLICANT_EMAIL, OTHER_GRANTOR_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    // Create grantor user (program_officer — can list queue but not apply disposition)
    const grantorRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [GRANTOR_EMAIL, 'IQ Grantor PO', hash],
    );
    grantorUserId = grantorRes.rows[0].user_id;

    // Create grantor admin user (grantor_admin — can apply dispositions)
    const grantorAdminRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [GRANTOR_ADMIN_EMAIL, 'IQ Grantor Admin', hash],
    );
    grantorAdminUserId = grantorAdminRes.rows[0].user_id;

    // Create applicant user
    const applicantRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [APPLICANT_EMAIL, 'IQ Applicant', hash],
    );
    applicantUserId = applicantRes.rows[0].user_id;

    // Create other grantor user (for cross-org IDOR test)
    const otherGrantorRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [OTHER_GRANTOR_EMAIL, 'IQ Other Grantor', hash],
    );
    otherGrantorUserId = otherGrantorRes.rows[0].user_id;

    // Create grantor org
    const grantorOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`IQ Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgRes.rows[0].org_id;

    // Assign roles to grantor users
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET roles = EXCLUDED.roles, revoked_at = NULL`,
      [grantorOrgId, grantorUserId, JSON.stringify(['program_officer'])],
    );
    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET roles = EXCLUDED.roles, revoked_at = NULL`,
      [grantorOrgId, grantorAdminUserId, JSON.stringify(['grantor_admin', 'intake_administrator'])],
    );

    // Create other grantor org (for IDOR test)
    const otherGrantorOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`IQ Other Grantor Org ${UNIQUE_ID}`, 'state_agency'],
    );
    otherGrantorOrgId = otherGrantorOrgRes.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET roles = EXCLUDED.roles, revoked_at = NULL`,
      [otherGrantorOrgId, otherGrantorUserId, JSON.stringify(['grantor_admin'])],
    );

    // Create applicant org + membership
    const appOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (legal_name, entity_type, address_line1, city, state, zip, primary_contact_name, primary_contact_email)
       VALUES ($1, $2, '100 Test St', 'Washington', 'DC', '20001', 'IQ Contact', 'iqcontact@test.com') RETURNING org_id`,
      [`IQ Applicant Org ${UNIQUE_ID}`, 'nonprofit'],
    );
    applicantOrgId = appOrgRes.rows[0].org_id;

    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by) VALUES ($1, $2, $3::jsonb, $2) ON CONFLICT DO NOTHING`,
      [applicantOrgId, applicantUserId, JSON.stringify(['authorized_representative'])],
    );

    // Create program + opportunity for the grantor org
    const progRes = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `IQ Program ${UNIQUE_ID}`, grantorAdminUserId],
    );
    testProgramId = progRes.rows[0].program_id;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const oppRes = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId, `IQ Test Opportunity ${UNIQUE_ID}`, 'Federal Grant Agency', 'Initial',
        `IQ-${UNIQUE_ID}`, 500000, 'Open to nonprofits', 'IQ test funding',
        'Dr. IQ', 'iq@example.gov', 'Research', 'published', `iq-${UNIQUE_ID}`,
        grantorAdminUserId, yesterday, futureClose, grantorAdminUserId,
      ],
    );
    testOpportunityId = oppRes.rows[0].opportunity_id;

    // Create workspace with all sections complete
    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, testOpportunityId, applicantUserId],
    );
    workspaceId = wsRes.rows[0].workspace_id;

    const sectionTypes = [
      { type: 'org_profile', name: 'Organization Profile', order: 1 },
      { type: 'eligibility', name: 'Eligibility', order: 2 },
      { type: 'narrative', name: 'Narrative', order: 3 },
      { type: 'budget', name: 'Budget', order: 4 },
      { type: 'workplan', name: 'Work Plan', order: 5 },
      { type: 'performance_measures', name: 'Performance Measures', order: 6 },
      { type: 'attachments', name: 'Attachments', order: 7 },
      { type: 'certifications', name: 'Certifications', order: 8 },
      { type: 'review_submit', name: 'Review & Submit', order: 9 },
    ];
    for (const s of sectionTypes) {
      await pool.query(
        `INSERT INTO application_sections (workspace_id, section_type, section_name, display_order, status, is_visible, validation_errors)
         VALUES ($1, $2, $3, $4, 'complete', true, '[]'::jsonb) ON CONFLICT DO NOTHING`,
        [workspaceId, s.type, s.name, s.order],
      );
    }

    // Create certification
    const { createHash } = await import('crypto');
    const certHash = createHash('sha256').update(CERT_TEXT).digest('hex');
    await pool.query(
      `INSERT INTO certifications (workspace_id, certifying_user_id, certification_text, certification_text_hash)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId, applicantUserId, CERT_TEXT, certHash],
    );

    // Submit the workspace (this creates the intake queue entry via submissionService)
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
    const submitRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submit`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(submitRes.status).toBe(200);

    // Find the queue entry created by submission
    const queueResult = await pool.query<{ entry_id: string }>(
      `SELECT entry_id FROM intake_queue_entries WHERE workspace_id = $1`,
      [workspaceId],
    );
    expect(queueResult.rows.length).toBe(1);
    entryId = queueResult.rows[0].entry_id;

    // Login other users
    grantorToken = await loginUser(GRANTOR_EMAIL, TEST_PASSWORD);
    grantorAdminToken = await loginUser(GRANTOR_ADMIN_EMAIL, TEST_PASSWORD);
    otherGrantorToken = await loginUser(OTHER_GRANTOR_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable triggers for cleanup
    await pool.query('ALTER TABLE submission_snapshots DISABLE TRIGGER trg_submission_snapshots_no_delete');
    await pool.query('ALTER TABLE submission_snapshots DISABLE TRIGGER trg_submission_snapshots_no_update');
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    // Clean notification_records
    await pool.query('DELETE FROM notification_records WHERE entity_id = $1', [entryId]);

    // Clean intake queue
    await pool.query('UPDATE intake_queue_entries SET disposition_id = NULL WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM intake_dispositions WHERE entry_id = $1', [entryId]);
    await pool.query('DELETE FROM intake_queue_entries WHERE workspace_id = $1', [workspaceId]);

    // Clean submission snapshots
    await pool.query('DELETE FROM submission_snapshots WHERE workspace_id = $1', [workspaceId]);

    // Clean audit events
    for (const uid of [grantorUserId, grantorAdminUserId, applicantUserId, otherGrantorUserId]) {
      if (uid) await pool.query('DELETE FROM audit_events WHERE actor_user_id = $1', [uid]);
    }

    // Re-enable triggers
    await pool.query('ALTER TABLE submission_snapshots ENABLE TRIGGER trg_submission_snapshots_no_delete');
    await pool.query('ALTER TABLE submission_snapshots ENABLE TRIGGER trg_submission_snapshots_no_update');
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    // Clean workspace
    await pool.query('DELETE FROM certifications WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM application_sections WHERE workspace_id = $1', [workspaceId]);
    await pool.query('UPDATE application_workspaces SET is_locked = false WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [workspaceId]);

    // Clean org + opportunity + program
    await pool.query('DELETE FROM org_roles WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);

    // Clean grantor data
    await pool.query('DELETE FROM grantor_roles WHERE grantor_org_id IN ($1, $2)', [grantorOrgId, otherGrantorOrgId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id IN ($1, $2)', [grantorOrgId, otherGrantorOrgId]);

    // Clean users
    for (const email of [GRANTOR_EMAIL, GRANTOR_ADMIN_EMAIL, APPLICANT_EMAIL, OTHER_GRANTOR_EMAIL]) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    await closeRedisClient();
  });

  // ── Test 1: GET /intake-queue requires authentication ─────────────────────────
  it('GET /api/v1/intake-queue returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/intake-queue');
    expect(res.status).toBe(401);
  });

  // ── Test 2: GET /intake-queue requires grantor role ───────────────────────────
  it('GET /api/v1/intake-queue returns 403 for applicant user', async () => {
    const res = await request(app)
      .get('/api/v1/intake-queue')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(res.status).toBe(403);
  });

  // ── Test 3: GET /intake-queue returns queue entries ───────────────────────────
  it('GET /api/v1/intake-queue returns 200 with queue entries after submission', async () => {
    const res = await request(app)
      .get('/api/v1/intake-queue')
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.entries).toBeInstanceOf(Array);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    const entry = res.body.entries.find((e: { entry_id: string }) => e.entry_id === entryId);
    expect(entry).toBeDefined();
    expect(entry.org_name).toContain('IQ Applicant Org');
    expect(entry.status).toBe('pending_screening');
    expect(entry.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
  });

  // ── Test 4: GET /intake-queue/:entryId returns full detail ────────────────────
  it('GET /api/v1/intake-queue/:entryId returns 200 with full detail', async () => {
    const res = await request(app)
      .get(`/api/v1/intake-queue/${entryId}`)
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.entry_id).toBe(entryId);
    expect(res.body.org_profile_snapshot).toBeDefined();
    expect(res.body.eligibility_snapshot).toBeDefined();
    expect(res.body.sections_snapshot).toBeDefined();
    expect(res.body.budget_snapshot).toBeDefined();
    expect(res.body.disposition_history).toBeInstanceOf(Array);
    expect(res.body.correction_requests).toBeInstanceOf(Array);
  });

  // ── Test 5: IDOR — grantor cannot see entry for another org's opportunity ─────
  it('GET /api/v1/intake-queue/:entryId returns 403 for cross-org IDOR attempt', async () => {
    // otherGrantorToken user is in a different org — cannot see entries for testOpportunity
    const res = await request(app)
      .get(`/api/v1/intake-queue/${entryId}`)
      .set('Authorization', `Bearer ${otherGrantorToken}`);
    expect(res.status).toBe(403);
  });

  // ── Test 6: POST /intake-queue/:entryId/disposition — accepted_for_review ─────
  it('POST /intake-queue/:entryId/disposition — accepted_for_review creates disposition (201)', async () => {
    const res = await request(app)
      .post(`/api/v1/intake-queue/${entryId}/disposition`)
      .set('Authorization', `Bearer ${grantorAdminToken}`)
      .send({ disposition: 'accepted_for_review' });

    expect(res.status).toBe(201);
    expect(res.body.disposition_id).toBeDefined();
    expect(res.body.disposition).toBe('accepted_for_review');
    dispositionId = res.body.disposition_id;

    // Verify entry status updated
    const entryResult = await pool.query(
      `SELECT status, disposition_id FROM intake_queue_entries WHERE entry_id = $1`,
      [entryId],
    );
    expect(entryResult.rows[0].status).toBe('accepted_for_review');
    expect(entryResult.rows[0].disposition_id).toBe(dispositionId);
  });

  // ── Test 7: POST disposition — returned_for_correction without rationale → 422 ─
  it('POST disposition returned_for_correction without rationale returns 422 RATIONALE_REQUIRED', async () => {
    const res = await request(app)
      .post(`/api/v1/intake-queue/${entryId}/disposition`)
      .set('Authorization', `Bearer ${grantorAdminToken}`)
      .send({ disposition: 'returned_for_correction' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('RATIONALE_REQUIRED');
  });

  // ── Test 8: POST disposition — returned_for_correction with rationale → 201 ───
  it('POST disposition returned_for_correction with rationale returns 201', async () => {
    const res = await request(app)
      .post(`/api/v1/intake-queue/${entryId}/disposition`)
      .set('Authorization', `Bearer ${grantorAdminToken}`)
      .send({
        disposition: 'returned_for_correction',
        rationale: 'Missing required budget narrative documentation.',
      });

    expect(res.status).toBe(201);
    expect(res.body.disposition).toBe('returned_for_correction');
    expect(res.body.rationale).toBe('Missing required budget narrative documentation.');
  });

  // ── Test 9: Disposition history is immutable — second disposition creates new row ─
  it('Second POST disposition creates new row, disposition history grows (immutable history)', async () => {
    const historyResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM intake_dispositions WHERE entry_id = $1`,
      [entryId],
    );
    // Should have at least 2 dispositions by now (test 6 + test 8)
    expect(historyResult.rows[0].count).toBeGreaterThanOrEqual(2);

    // First disposition row should still exist (not overwritten)
    const firstDisposition = await pool.query(
      `SELECT disposition_id, disposition FROM intake_dispositions WHERE disposition_id = $1`,
      [dispositionId],
    );
    expect(firstDisposition.rows.length).toBe(1);
    expect(firstDisposition.rows[0].disposition).toBe('accepted_for_review');
  });

  // ── Test 10: GET /notifications returns notification from disposition ──────────
  it('GET /api/v1/notifications returns 200 with DISPOSITION_APPLIED notification', async () => {
    // Applicant should have received notification
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    const dispNotification = res.body.notifications.find(
      (n: { notification_type: string }) => n.notification_type === 'DISPOSITION_APPLIED',
    );
    expect(dispNotification).toBeDefined();
    notificationId = dispNotification.notification_id;
  });

  // ── Test 11: PUT /notifications/:notificationId/read marks as read ────────────
  it('PUT /api/v1/notifications/:notificationId/read returns 200 and marks as read', async () => {
    const res = await request(app)
      .put(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${applicantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(true);

    // Verify it's actually marked read in DB
    const notifResult = await pool.query(
      `SELECT is_read FROM notification_records WHERE notification_id = $1`,
      [notificationId],
    );
    expect(notifResult.rows[0].is_read).toBe(true);
  });

  // ── Test 12: IDOR — cannot mark another user's notification as read ───────────
  it('PUT /notifications/:notificationId/read returns 404 for another user\'s notification', async () => {
    // grantorToken tries to mark applicant's notification as read
    const res = await request(app)
      .put(`/api/v1/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${grantorToken}`);

    expect(res.status).toBe(404);
  });
});
