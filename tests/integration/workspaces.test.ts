import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ws-${Date.now()}`;

// User emails
const ORG_ADMIN_EMAIL = `ws.org.admin.${UNIQUE_ID}@example.com`;
const APPLICANT_EMAIL = `ws.applicant.${UNIQUE_ID}@example.com`;
const GRANTOR_EMAIL = `ws.grantor.${UNIQUE_ID}@example.com`;
const PROPOSAL_LEAD_EMAIL = `ws.lead.${UNIQUE_ID}@example.com`;
const CONTRIBUTOR_EMAIL = `ws.contrib.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

// IDs
let orgAdminUserId: string;
let applicantUserId: string;
let grantorUserId: string;
let proposalLeadUserId: string;
let contributorUserId: string;
let grantorOrgId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let testWorkspaceId: string;
let testSectionId: string;

// Tokens
let orgAdminToken: string;
let applicantToken: string;
let grantorToken: string;
let proposalLeadToken: string;
let contributorToken: string;

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

describe('Workspaces API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    const emails = [ORG_ADMIN_EMAIL, APPLICANT_EMAIL, GRANTOR_EMAIL, PROPOSAL_LEAD_EMAIL, CONTRIBUTOR_EMAIL];
    for (const email of emails) {
      const res = await pool.query<{ user_id: string }>('SELECT user_id FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [res.rows[0].user_id]);
      }
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Create test users
    orgAdminUserId = await createUser(ORG_ADMIN_EMAIL, 'WS Org Admin');
    applicantUserId = await createUser(APPLICANT_EMAIL, 'WS Applicant');
    grantorUserId = await createUser(GRANTOR_EMAIL, 'WS Grantor');
    proposalLeadUserId = await createUser(PROPOSAL_LEAD_EMAIL, 'WS Proposal Lead');
    contributorUserId = await createUser(CONTRIBUTOR_EMAIL, 'WS Contributor');

    // Create grantor org and assign grantor_admin role to grantorUser
    const grantorOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`WS Test Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgResult.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [grantorOrgId, grantorUserId, JSON.stringify(['grantor_admin'])],
    );

    // Create applicant organization
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (
        legal_name, address_line1, city, state, zip, entity_type,
        primary_contact_name, primary_contact_email, banking_readiness, profile_completeness_pct
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING org_id`,
      [
        `WS Test Org ${UNIQUE_ID}`,
        '123 Test St',
        'Springfield',
        'IL',
        '62701',
        'nonprofit_501c3',
        'Test Contact',
        `contact.${UNIQUE_ID}@example.com`,
        'ready',
        0,
      ],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign org roles
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, orgAdminUserId, JSON.stringify(['org_admin'])],
    );
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, applicantUserId, JSON.stringify(['authorized_representative'])],
    );
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, proposalLeadUserId, JSON.stringify(['proposal_lead'])],
    );
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, contributorUserId, JSON.stringify(['finance_contributor'])],
    );

    // Create test grantor program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `WS Test Program ${UNIQUE_ID}`, grantorUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    // Create test opportunity (published so workspaces can be created)
    const oppResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary, contact_name, contact_email, program_area, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING opportunity_id`,
      [
        testProgramId,
        `WS Test Opportunity ${UNIQUE_ID}`,
        'Test Agency',
        'Initial',
        `WS-OPP-${UNIQUE_ID}`,
        'Open to all nonprofits',
        'Workspace foundation test opportunity',
        'Test Contact',
        `opp-contact.${UNIQUE_ID}@example.gov`,
        'Testing',
        grantorUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Log in all users
    orgAdminToken = await loginUser(ORG_ADMIN_EMAIL, TEST_PASSWORD);
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
    grantorToken = await loginUser(GRANTOR_EMAIL, TEST_PASSWORD);
    proposalLeadToken = await loginUser(PROPOSAL_LEAD_EMAIL, TEST_PASSWORD);
    contributorToken = await loginUser(CONTRIBUTOR_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    // Clean up workspace data
    if (testWorkspaceId) {
      await pool.query('DELETE FROM workspace_comments WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query('DELETE FROM workspace_tasks WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query('DELETE FROM application_sections WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query(
        `DELETE FROM audit_events WHERE entity_type = 'workspace' AND entity_id = $1::uuid`,
        [testWorkspaceId],
      );
      await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [testWorkspaceId]);
    }

    // Clean up any duplicate workspace attempts (for the 409 test)
    await pool.query(
      'DELETE FROM application_workspaces WHERE opportunity_id = $1 AND org_id = $2',
      [testOpportunityId, testOrgId],
    );

    // Clean up users' audit events
    const userIds = [orgAdminUserId, applicantUserId, grantorUserId, proposalLeadUserId, contributorUserId].filter(Boolean);
    if (userIds.length > 0) {
      await pool.query(
        `DELETE FROM audit_events WHERE actor_user_id = ANY($1::uuid[])`,
        [userIds],
      );
    }

    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    // Clean up other data
    if (testOpportunityId) {
      await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    }
    if (testProgramId) {
      await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    }
    if (testOrgId) {
      await pool.query('DELETE FROM org_roles WHERE org_id = $1', [testOrgId]);
      await pool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
    }
    if (grantorOrgId) {
      await pool.query('DELETE FROM grantor_roles WHERE grantor_org_id = $1', [grantorOrgId]);
      await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    }
    if (userIds.length > 0) {
      await pool.query('DELETE FROM users WHERE user_id = ANY($1::uuid[])', [userIds]);
    }

    await pool.end();
    await closeRedisClient();
  });

  // ─── 1. POST /workspaces → 201 with workspace_id and 9 sections ──────────────

  describe('POST /api/v1/workspaces', () => {
    it('creates workspace and returns 201 with workspace_id and 9 sections', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ opportunity_id: testOpportunityId });

      expect(res.status).toBe(201);
      expect(res.body.workspace).toBeTruthy();
      expect(res.body.workspace.workspace_id).toBeTruthy();
      expect(res.body.workspace.opportunity_id).toBe(testOpportunityId);
      expect(res.body.workspace.org_id).toBe(testOrgId);
      expect(res.body.workspace.status).toBe('workspace_created');

      // 9 sections auto-created
      expect(Array.isArray(res.body.sections)).toBe(true);
      expect(res.body.sections).toHaveLength(9);

      const sectionTypes = res.body.sections.map((s: { section_type: string }) => s.section_type);
      expect(sectionTypes).toContain('org_profile');
      expect(sectionTypes).toContain('eligibility');
      expect(sectionTypes).toContain('narrative');
      expect(sectionTypes).toContain('budget');
      expect(sectionTypes).toContain('workplan');
      expect(sectionTypes).toContain('performance_measures');
      expect(sectionTypes).toContain('attachments');
      expect(sectionTypes).toContain('certifications');
      expect(sectionTypes).toContain('review_submit');

      // All sections have 'not_started' status
      for (const section of res.body.sections) {
        expect(section.status).toBe('not_started');
      }

      testWorkspaceId = res.body.workspace.workspace_id;
      testSectionId = res.body.sections[0].section_id;
    });

    it('returns 409 DUPLICATE_WORKSPACE on duplicate creation attempt', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ opportunity_id: testOpportunityId });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('DUPLICATE_WORKSPACE');
    });

    it('returns 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/v1/workspaces')
        .send({ opportunity_id: testOpportunityId });

      expect(res.status).toBe(401);
    });
  });

  // ─── 2. GET /workspaces/:id → 200 with workspace ─────────────────────────────

  describe('GET /api/v1/workspaces/:id', () => {
    it('returns 200 with workspace for org member', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.workspace_id).toBe(testWorkspaceId);
    });

    it('returns 403 for non-member', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}`)
        .set('Authorization', `Bearer ${grantorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 3. GET /workspaces/:id/sections → 200 with 9 sections ──────────────────

  describe('GET /api/v1/workspaces/:id/sections', () => {
    it('returns 200 with 9 visible sections', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/sections`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(9);
      // All sections ordered by display_order
      for (let i = 0; i < res.body.length - 1; i++) {
        expect(res.body[i].display_order).toBeLessThan(res.body[i + 1].display_order);
      }
    });
  });

  // ─── 4. PUT /workspaces/:id/sections/:sectionId/assignment ───────────────────

  describe('PUT /api/v1/workspaces/:id/sections/:sectionId/assignment', () => {
    it('allows proposal_lead to assign section owner and due date', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/assignment`)
        .set('Authorization', `Bearer ${proposalLeadToken}`)
        .send({ owner_id: proposalLeadUserId, internal_due_date: '2026-12-31' });

      expect(res.status).toBe(200);
      expect(res.body.owner_id).toBe(proposalLeadUserId);
      expect(res.body.internal_due_date).toMatch('2026-12-31');
    });

    it('returns 403 for finance_contributor (not proposal_lead or org_admin)', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/assignment`)
        .set('Authorization', `Bearer ${contributorToken}`)
        .send({ owner_id: contributorUserId });

      expect(res.status).toBe(403);
    });
  });

  // ─── 5. POST /workspaces/:id/tasks → 201 with task_id ────────────────────────

  describe('POST /api/v1/workspaces/:id/tasks', () => {
    it('creates a task and returns 201', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/tasks`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          task_title: 'Gather org documents',
          assignee_id: applicantUserId,
          task_due_date: '2026-12-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.task_id).toBeTruthy();
      expect(res.body.task_title).toBe('Gather org documents');
      expect(res.body.status).toBe('open');
    });
  });

  // ─── 6. GET /workspaces/:id/comments → 200 for applicant ─────────────────────

  describe('GET /api/v1/workspaces/:id/comments', () => {
    it('returns 200 for applicant org member', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/comments`)
        .set('Authorization', `Bearer ${applicantToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 403 GRANTOR_ACCESS_DENIED for grantor user', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/comments`)
        .set('Authorization', `Bearer ${grantorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('GRANTOR_ACCESS_DENIED');
    });
  });

  // ─── 7. POST /workspaces/:id/comments → 201 comment ─────────────────────────

  describe('POST /api/v1/workspaces/:id/comments', () => {
    it('allows applicant to post a comment (201)', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/comments`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({ comment_text: 'This is an internal comment.' });

      expect(res.status).toBe(201);
      expect(res.body.comment_id).toBeTruthy();
      expect(res.body.comment_text).toBe('This is an internal comment.');
      expect(res.body.visibility).toBe('internal');
    });

    it('returns 403 GRANTOR_ACCESS_DENIED for grantor user', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/comments`)
        .set('Authorization', `Bearer ${grantorToken}`)
        .send({ comment_text: 'Grantor attempting to comment.' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('GRANTOR_ACCESS_DENIED');
    });
  });
});
