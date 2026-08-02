import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `wssub-${Date.now()}`;
const AR_EMAIL = `wssub.ar.${UNIQUE_ID}@example.com`;
const NON_AUTH_EMAIL = `wssub.noauth.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

const CERT_TEXT =
  'I certify that the information contained in this application is accurate and complete, and that I am authorized to submit this application on behalf of the applicant organization.';

let arToken: string;
let arUserId: string;
let noAuthUserId: string;
let applicantOrgId: string;
let grantorOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let workspaceId: string;
let workspaceId2: string; // For second-submission uniqueness test
let testOpportunityId2: string; // Separate opportunity for uniqueness test (avoids uq_workspace_org_opp)
let firstSnapshotId: string;
// Track ephemeral workspace IDs for cleanup in individual tests
const ephemeralWorkspaceIds: string[] = [];
const ephemeralOpportunityIds: string[] = [];

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Workspace Submission API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    for (const email of [AR_EMAIL, NON_AUTH_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    // Create AR user
    const arRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [AR_EMAIL, 'WsSub AR', hash],
    );
    arUserId = arRes.rows[0].user_id;

    // Create non-auth user (no org membership)
    const noAuthRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [NON_AUTH_EMAIL, 'WsSub NoAuth', hash],
    );
    noAuthUserId = noAuthRes.rows[0].user_id;

    // Create applicant org
    const appOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (legal_name, entity_type, address_line1, city, state, zip, primary_contact_name, primary_contact_email)
       VALUES ($1, $2, '300 Sub St', 'Washington', 'DC', '20001', 'Sub Contact', 'sub@test.com') RETURNING org_id`,
      [`WsSub Applicant Org ${UNIQUE_ID}`, 'nonprofit'],
    );
    applicantOrgId = appOrgRes.rows[0].org_id;

    // AR user gets authorized_representative role
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by) VALUES ($1, $2, $3::jsonb, $2) ON CONFLICT DO NOTHING`,
      [applicantOrgId, arUserId, JSON.stringify(['authorized_representative'])],
    );

    // Create grantor org + program + opportunity
    const grantorOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`WsSub Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgRes.rows[0].org_id;

    const progRes = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `WsSub Program ${UNIQUE_ID}`, arUserId],
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
        testProgramId,
        `WsSub Opportunity ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `WSSUB-${UNIQUE_ID}`,
        100000,
        'Open to nonprofits',
        'Submission test funding',
        'Dr. WsSub',
        'wssub@example.gov',
        'Education',
        'published',
        `wssub-${UNIQUE_ID}`,
        arUserId,
        yesterday,
        futureClose,
        arUserId,
      ],
    );
    testOpportunityId = oppRes.rows[0].opportunity_id;

    // Create workspace with all 9 sections in 'complete' status
    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status) VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, testOpportunityId, arUserId],
    );
    workspaceId = wsRes.rows[0].workspace_id;

    // Create all 9 sections with 'complete' status (no validation_errors)
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
         VALUES ($1, $2, $3, $4, 'complete', true, '[]'::jsonb)
         ON CONFLICT DO NOTHING`,
        [workspaceId, s.type, s.name, s.order],
      );
    }

    // Create certification record (pre-certified for submission)
    const { createHash } = await import('crypto');
    const certHash = createHash('sha256').update(CERT_TEXT).digest('hex');
    await pool.query(
      `INSERT INTO certifications (workspace_id, certifying_user_id, certification_text, certification_text_hash)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId, arUserId, CERT_TEXT, certHash],
    );

    // Login
    arToken = await loginUser(AR_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable immutability triggers for test cleanup
    await pool.query('ALTER TABLE submission_snapshots DISABLE TRIGGER trg_submission_snapshots_no_delete');
    await pool.query('ALTER TABLE submission_snapshots DISABLE TRIGGER trg_submission_snapshots_no_update');
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    // All workspace IDs to clean (main + second + ephemeral)
    const allWsIds = [workspaceId, workspaceId2, ...ephemeralWorkspaceIds].filter(Boolean);

    // Clean submission_snapshots (all workspaces)
    for (const wsId of allWsIds) {
      await pool.query('DELETE FROM submission_snapshots WHERE workspace_id = $1', [wsId]);
    }

    // Clean audit events
    for (const uid of [arUserId, noAuthUserId]) {
      if (uid) await pool.query('DELETE FROM audit_events WHERE actor_user_id = $1', [uid]);
    }

    // Re-enable triggers
    await pool.query('ALTER TABLE submission_snapshots ENABLE TRIGGER trg_submission_snapshots_no_delete');
    await pool.query('ALTER TABLE submission_snapshots ENABLE TRIGGER trg_submission_snapshots_no_update');
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    // Clean certifications + sections + workspaces
    for (const wsId of allWsIds) {
      await pool.query('DELETE FROM certifications WHERE workspace_id = $1', [wsId]);
      await pool.query('DELETE FROM application_sections WHERE workspace_id = $1', [wsId]);
    }
    for (const wsId of allWsIds) {
      await pool.query('UPDATE application_workspaces SET is_locked = false WHERE workspace_id = $1', [wsId]);
      await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [wsId]);
    }

    // Clean opportunities (main + second + ephemeral)
    const allOppIds = [testOpportunityId, testOpportunityId2, ...ephemeralOpportunityIds].filter(Boolean);
    for (const oppId of allOppIds) {
      await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [oppId]);
    }
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);

    // Clean org_roles + org + users
    await pool.query('DELETE FROM org_roles WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    for (const email of [AR_EMAIL, NON_AUTH_EMAIL]) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    await closeRedisClient();
  });

  // ── Test 1: Successful submission ─────────────────────────────────────────
  it('POST /workspaces/:id/submit returns 200 with SubmissionConfirmation including GI-YEAR-8digit', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submit`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    expect(res.body.snapshot_id).toBeDefined();
    expect(res.body.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
    expect(res.body.submitted_at).toBeDefined();
    expect(res.body.opportunity_title).toContain('WsSub Opportunity');
    expect(res.body.applicant_org_name).toContain('WsSub Applicant Org');
    expect(res.body.receipt_download_url).toContain('/receipt');

    firstSnapshotId = res.body.snapshot_id;
  });

  // ── Test 2: Unique confirmation numbers ───────────────────────────────────
  it('confirmation_number is unique — second workspace gets different number', async () => {
    // Create a SEPARATE opportunity (uq_workspace_org_opp prevents same org+opportunity)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const oppRes2 = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId, `WsSub Opp2 ${UNIQUE_ID}`, 'Federal Grant Agency', 'Initial',
        `WSSUB2-${UNIQUE_ID}`, 100000, 'Open to nonprofits', 'Submission test 2',
        'Dr. WsSub2', 'wssub2@example.gov', 'Education', 'published', `wssub2-${UNIQUE_ID}`,
        arUserId, yesterday, futureClose, arUserId,
      ],
    );
    testOpportunityId2 = oppRes2.rows[0].opportunity_id;

    const wsRes2 = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, testOpportunityId2, arUserId],
    );
    workspaceId2 = wsRes2.rows[0].workspace_id;

    // Setup sections for second workspace
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
         VALUES ($1, $2, $3, $4, 'complete', true, '[]'::jsonb)
         ON CONFLICT DO NOTHING`,
        [workspaceId2, s.type, s.name, s.order],
      );
    }

    // Add certification
    const { createHash } = await import('crypto');
    const certHash = createHash('sha256').update(CERT_TEXT).digest('hex');
    await pool.query(
      `INSERT INTO certifications (workspace_id, certifying_user_id, certification_text, certification_text_hash)
       VALUES ($1, $2, $3, $4)`,
      [workspaceId2, arUserId, CERT_TEXT, certHash],
    );

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId2}/submit`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    // The confirmation number must be different from the first
    const firstRes = await pool.query(
      `SELECT confirmation_number FROM submission_snapshots WHERE workspace_id = $1`,
      [workspaceId],
    );
    expect(res.body.confirmation_number).not.toBe(firstRes.rows[0].confirmation_number);
    expect(res.body.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
  });

  // ── Test 3: Already submitted → 409 ──────────────────────────────────────
  it('POST /workspaces/:id/submit a second time returns 409 ALREADY_SUBMITTED', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submit`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_SUBMITTED');
  });

  // ── Test 4: Workspace locked after submission ──────────────────────────────
  it('After submission, workspace is_locked=true and visibility=shared', async () => {
    const result = await pool.query(
      `SELECT is_locked, visibility FROM application_workspaces WHERE workspace_id = $1`,
      [workspaceId],
    );
    expect(result.rows[0].is_locked).toBe(true);
    expect(result.rows[0].visibility).toBe('shared');
  });

  // ── Test 5: Blocking validation errors → 422 ──────────────────────────────
  it('POST /workspaces/:id/submit with blocking validation errors returns 422 SUBMISSION_BLOCKED', async () => {
    // Create a separate opportunity (avoids uq_workspace_org_opp constraint)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const ephOppRes = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId, `WsSub Blocked ${UNIQUE_ID}`, 'Federal Grant Agency', 'Initial',
        `WSBLK-${UNIQUE_ID}`, 100000, 'Open', 'Blocked test', 'Dr. Blk', 'blk@example.gov',
        'Education', 'published', `wsblk-${UNIQUE_ID}`, arUserId, yesterday, futureClose, arUserId,
      ],
    );
    const ephOppId = ephOppRes.rows[0].opportunity_id;
    ephemeralOpportunityIds.push(ephOppId);

    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, ephOppId, arUserId],
    );
    const blockedWsId = wsRes.rows[0].workspace_id;
    ephemeralWorkspaceIds.push(blockedWsId);

    // Create sections with one mandatory section NOT complete (org_profile status='draft')
    const sectionTypes = [
      { type: 'org_profile', name: 'Organization Profile', order: 1, status: 'draft' },
      { type: 'eligibility', name: 'Eligibility', order: 2, status: 'complete' },
      { type: 'narrative', name: 'Narrative', order: 3, status: 'complete' },
      { type: 'budget', name: 'Budget', order: 4, status: 'complete' },
      { type: 'workplan', name: 'Work Plan', order: 5, status: 'complete' },
      { type: 'performance_measures', name: 'Performance Measures', order: 6, status: 'complete' },
      { type: 'attachments', name: 'Attachments', order: 7, status: 'complete' },
      { type: 'certifications', name: 'Certifications', order: 8, status: 'complete' },
      { type: 'review_submit', name: 'Review & Submit', order: 9, status: 'complete' },
    ];
    for (const s of sectionTypes) {
      await pool.query(
        `INSERT INTO application_sections (workspace_id, section_type, section_name, display_order, status, is_visible, validation_errors)
         VALUES ($1, $2, $3, $4, $5, true, '[]'::jsonb)
         ON CONFLICT DO NOTHING`,
        [blockedWsId, s.type, s.name, s.order, s.status],
      );
    }

    // Add certification
    const { createHash } = await import('crypto');
    const certHash = createHash('sha256').update(CERT_TEXT).digest('hex');
    await pool.query(
      `INSERT INTO certifications (workspace_id, certifying_user_id, certification_text, certification_text_hash)
       VALUES ($1, $2, $3, $4)`,
      [blockedWsId, arUserId, CERT_TEXT, certHash],
    );

    const res = await request(app)
      .post(`/api/v1/workspaces/${blockedWsId}/submit`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe('SUBMISSION_BLOCKED');
    expect(res.body.blocking_errors).toBeInstanceOf(Array);
    expect(res.body.blocking_errors.length).toBeGreaterThan(0);
  });

  // ── Test 6: Missing certification → 422 ────────────────────────────────────
  it('POST /workspaces/:id/submit without certification returns 422 SUBMISSION_BLOCKED CERTIFICATION_INCOMPLETE', async () => {
    // Create separate opportunity (avoids uq_workspace_org_opp)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const ephOppRes = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId, `WsSub NoCert ${UNIQUE_ID}`, 'Federal Grant Agency', 'Initial',
        `WSNOCERT-${UNIQUE_ID}`, 100000, 'Open', 'NoCert test', 'Dr. NC', 'nc@example.gov',
        'Education', 'published', `wsnocert-${UNIQUE_ID}`, arUserId, yesterday, futureClose, arUserId,
      ],
    );
    const ephOppId = ephOppRes.rows[0].opportunity_id;
    ephemeralOpportunityIds.push(ephOppId);

    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, ephOppId, arUserId],
    );
    const noCertWsId = wsRes.rows[0].workspace_id;
    ephemeralWorkspaceIds.push(noCertWsId);

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
         VALUES ($1, $2, $3, $4, 'complete', true, '[]'::jsonb)
         ON CONFLICT DO NOTHING`,
        [noCertWsId, s.type, s.name, s.order],
      );
    }

    const res = await request(app)
      .post(`/api/v1/workspaces/${noCertWsId}/submit`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error_code).toBe('SUBMISSION_BLOCKED');
    expect(res.body.blocking_errors).toBeInstanceOf(Array);
    const certError = res.body.blocking_errors.find(
      (e: { error_code: string }) => e.error_code === 'CERTIFICATION_INCOMPLETE',
    );
    expect(certError).toBeDefined();
  });

  // ── Test 7: Receipt after submission ───────────────────────────────────────
  it('GET /workspaces/:id/receipt after submission returns 200 with confirmation data', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/receipt`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    expect(res.body.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
    expect(res.body.submitted_at).toBeDefined();
    expect(res.body.opportunity_title).toContain('WsSub Opportunity');
    expect(res.body.snapshot_id).toBe(firstSnapshotId);
  });

  // ── Test 8: Receipt before submission → 404 ────────────────────────────────
  it('GET /workspaces/:id/receipt before submission returns 404', async () => {
    // Create separate opportunity (avoids uq_workspace_org_opp)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const futureClose = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const ephOppRes = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        funding_amount_max, eligibility_summary, executive_summary,
        contact_name, contact_email, program_area, status, public_slug,
        published_at, published_by, application_open_date, application_close_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), $14, $15, $16, $17)
      RETURNING opportunity_id`,
      [
        testProgramId, `WsSub NoSub ${UNIQUE_ID}`, 'Federal Grant Agency', 'Initial',
        `WSNOSUB-${UNIQUE_ID}`, 100000, 'Open', 'NoSub test', 'Dr. NS', 'ns@example.gov',
        'Education', 'published', `wsnosub-${UNIQUE_ID}`, arUserId, yesterday, futureClose, arUserId,
      ],
    );
    const ephOppId = ephOppRes.rows[0].opportunity_id;
    ephemeralOpportunityIds.push(ephOppId);

    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status)
       VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, ephOppId, arUserId],
    );
    const noSubWsId = wsRes.rows[0].workspace_id;
    ephemeralWorkspaceIds.push(noSubWsId);

    const res = await request(app)
      .get(`/api/v1/workspaces/${noSubWsId}/receipt`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(404);
  });

  // ── Test 9: SUBMISSION_COMPLETED audit event created ───────────────────────
  it('SUBMISSION_COMPLETED audit_event created with entity_type=submission_snapshot', async () => {
    const auditRes = await pool.query(
      `SELECT * FROM audit_events
       WHERE event_type = 'SUBMISSION_COMPLETED'
         AND actor_user_id = $1
         AND entity_type = 'submission_snapshot'
         AND payload->>'workspace_id' = $2`,
      [arUserId, workspaceId],
    );
    expect(auditRes.rowCount).toBeGreaterThanOrEqual(1);
    const payload = auditRes.rows[0].payload;
    expect(payload.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
    expect(payload.workspace_id).toBe(workspaceId);
  });

  // ── Test 10: Immutability trigger fires on UPDATE ──────────────────────────
  it('Immutability: direct UPDATE on submission_snapshots raises PostgreSQL exception', async () => {
    try {
      await pool.query(
        `UPDATE submission_snapshots SET confirmation_number = 'HACK' WHERE snapshot_id = $1`,
        [firstSnapshotId],
      );
      // If we get here, trigger didn't fire — fail the test
      expect(true).toBe(false);
    } catch (err: unknown) {
      const pgErr = err as { message?: string };
      expect(pgErr.message).toContain('immutable');
    }
  });

  // ── Test 11: GET /submissions/:snapshotId returns snapshot metadata ────────
  it('GET /submissions/:snapshotId returns 200 with snapshot metadata', async () => {
    const res = await request(app)
      .get(`/api/v1/submissions/${firstSnapshotId}`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    expect(res.body.snapshot_id).toBe(firstSnapshotId);
    expect(res.body.confirmation_number).toMatch(/^GI-\d{4}-\d{8}$/);
    expect(res.body.workspace_id).toBe(workspaceId);
    expect(res.body.is_current).toBe(true);
  });

  // ── Test 12: No auth → 401 ─────────────────────────────────────────────────
  it('POST /workspaces/:id/submit without auth returns 401', async () => {
    const res = await request(app).post(`/api/v1/workspaces/${workspaceId}/submit`);
    expect(res.status).toBe(401);
  });
});
