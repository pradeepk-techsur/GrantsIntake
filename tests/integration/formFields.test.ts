import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ff-${Date.now()}`;

// User emails
const ORG_ADMIN_EMAIL = `ff.org.admin.${UNIQUE_ID}@example.com`;
const APPLICANT_EMAIL = `ff.applicant.${UNIQUE_ID}@example.com`;
const GRANTOR_EMAIL = `ff.grantor.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

// IDs
let orgAdminUserId: string;
let applicantUserId: string;
let grantorUserId: string;
let grantorOrgId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let testWorkspaceId: string;
let testSectionId: string;
let testFieldId: string;
let testRequiredFieldId: string;

// Tokens
let orgAdminToken: string;
let applicantToken: string;
let outsiderToken: string;

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

describe('Form Fields API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    const emails = [ORG_ADMIN_EMAIL, APPLICANT_EMAIL, GRANTOR_EMAIL];
    for (const email of emails) {
      const res = await pool.query<{ user_id: string }>('SELECT user_id FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [res.rows[0].user_id]);
      }
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Create test users
    orgAdminUserId = await createUser(ORG_ADMIN_EMAIL, 'FF Org Admin');
    applicantUserId = await createUser(APPLICANT_EMAIL, 'FF Applicant');
    grantorUserId = await createUser(GRANTOR_EMAIL, 'FF Grantor');

    // Create grantor org
    const grantorOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`FF Test Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
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
        `FF Test Org ${UNIQUE_ID}`,
        '123 Test St',
        'Springfield',
        'IL',
        '62701',
        'nonprofit_501c3',
        'Test Contact',
        `ff-contact.${UNIQUE_ID}@example.com`,
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

    // Create test grantor program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `FF Test Program ${UNIQUE_ID}`, grantorUserId],
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
        `FF Test Opportunity ${UNIQUE_ID}`,
        'Test Agency',
        'Initial',
        `FF-OPP-${UNIQUE_ID}`,
        'Open to all nonprofits',
        'Form field capture test opportunity',
        'Test Contact',
        `ff-opp-contact.${UNIQUE_ID}@example.gov`,
        'Testing',
        grantorUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Log in users
    orgAdminToken = await loginUser(ORG_ADMIN_EMAIL, TEST_PASSWORD);
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);

    // Create an outsider user (not in the org) for 403 tests
    const outsiderEmail = `ff.outsider.${UNIQUE_ID}@example.com`;
    await createUser(outsiderEmail, 'FF Outsider');
    outsiderToken = await loginUser(outsiderEmail, TEST_PASSWORD);

    // Create workspace (and capture section_id)
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ opportunity_id: testOpportunityId });

    testWorkspaceId = wsRes.body.workspace.workspace_id;
    testSectionId = wsRes.body.sections[0].section_id;
  });

  afterAll(async () => {
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    // Clean up form field data
    if (testWorkspaceId) {
      await pool.query('DELETE FROM field_responses WHERE workspace_id = $1', [testWorkspaceId]);
    }
    if (testSectionId) {
      await pool.query('DELETE FROM form_field_definitions WHERE section_id = $1', [testSectionId]);
    }

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

    const userEmails = [ORG_ADMIN_EMAIL, APPLICANT_EMAIL, GRANTOR_EMAIL, `ff.outsider.${UNIQUE_ID}@example.com`];
    const userIds: string[] = [];
    for (const email of userEmails) {
      const res = await pool.query<{ user_id: string }>('SELECT user_id FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) userIds.push(res.rows[0].user_id);
    }

    if (userIds.length > 0) {
      await pool.query(
        `DELETE FROM audit_events WHERE actor_user_id = ANY($1::uuid[])`,
        [userIds],
      );
    }

    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

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

  // ─── 1. GET fields when none defined → 200 empty array ───────────────────────

  describe('GET /api/v1/workspaces/:id/sections/:sectionId/fields', () => {
    it('returns 200 empty array when no fields defined', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('returns 200 with field and no current_response after inserting field definition', async () => {
      // Insert a test field definition directly via DB
      const fieldResult = await pool.query<{ field_id: string }>(
        `INSERT INTO form_field_definitions
           (opportunity_id, section_id, field_type, label, is_required, display_order, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING field_id`,
        [testOpportunityId, testSectionId, 'text', 'Project Title', false, 1, orgAdminUserId],
      );
      testFieldId = fieldResult.rows[0].field_id;

      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].field_id).toBe(testFieldId);
      expect(res.body[0].field_type).toBe('text');
      expect(res.body[0].label).toBe('Project Title');
      expect(res.body[0].current_response).toBeUndefined();
    });
  });

  // ─── 2. PUT field → saves response, section status → 'in_progress' ───────────

  describe('PUT /api/v1/workspaces/:id/sections/:sectionId/fields/:fieldId', () => {
    it('saves field response and returns 200 with response_id', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ response_value: 'My Test Project' });

      expect(res.status).toBe(200);
      expect(res.body.response_id).toBeTruthy();
      expect(res.body.field_id).toBe(testFieldId);
      expect(res.body.response_value).toBe('My Test Project');
    });

    it('section status becomes in_progress after first field save', async () => {
      const sectionRes = await pool.query<{ status: string }>(
        'SELECT status FROM application_sections WHERE section_id = $1',
        [testSectionId],
      );
      expect(sectionRes.rows[0].status).toBe('in_progress');
    });

    it('updates (upserts) field response — no duplicate row on second save', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ response_value: 'Updated Project Title' });

      expect(res.status).toBe(200);
      expect(res.body.response_value).toBe('Updated Project Title');

      // Verify only one row exists (UNIQUE constraint honored)
      const countRes = await pool.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM field_responses WHERE workspace_id = $1 AND field_id = $2',
        [testWorkspaceId, testFieldId],
      );
      expect(parseInt(countRes.rows[0].count)).toBe(1);
    });

    it('returns 404 when workspace not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .put(`/api/v1/workspaces/${fakeId}/sections/${testSectionId}/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ response_value: 'test' });

      expect(res.status).toBe(404);
    });

    it('returns 403 for non-member', async () => {
      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ response_value: 'test' });

      expect(res.status).toBe(403);
    });

    it('returns 423 when workspace is locked', async () => {
      // Lock the workspace
      await pool.query(
        'UPDATE application_workspaces SET is_locked = true WHERE workspace_id = $1',
        [testWorkspaceId],
      );

      const res = await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields/${testFieldId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ response_value: 'test' });

      expect(res.status).toBe(423);
      expect(res.body.error).toBe('WORKSPACE_LOCKED');

      // Unlock the workspace for subsequent tests
      await pool.query(
        'UPDATE application_workspaces SET is_locked = false WHERE workspace_id = $1',
        [testWorkspaceId],
      );
    });
  });

  // ─── 3. POST /validate — section validation ───────────────────────────────────

  describe('POST /api/v1/workspaces/:id/sections/:sectionId/validate', () => {
    it('returns invalid with blocking error for empty required field', async () => {
      // Insert a required field definition
      const reqFieldResult = await pool.query<{ field_id: string }>(
        `INSERT INTO form_field_definitions
           (opportunity_id, section_id, field_type, label, is_required, display_order, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING field_id`,
        [testOpportunityId, testSectionId, 'text', 'Organization Mission', true, 2, orgAdminUserId],
      );
      testRequiredFieldId = reqFieldResult.rows[0].field_id;

      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/validate`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.validation_status).toBe('invalid');
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      const blockingErr = res.body.errors.find(
        (e: { field_id: string; severity: string }) => e.field_id === testRequiredFieldId && e.severity === 'blocking',
      );
      expect(blockingErr).toBeTruthy();
    });

    it('section status becomes error after validation with blocking errors', async () => {
      const sectionRes = await pool.query<{ status: string; validation_errors: unknown }>(
        'SELECT status, validation_errors FROM application_sections WHERE section_id = $1',
        [testSectionId],
      );
      expect(sectionRes.rows[0].status).toBe('error');
      expect(sectionRes.rows[0].validation_errors).toBeTruthy();
    });

    it('returns valid after filling required field and section status becomes complete', async () => {
      // Fill the required field
      await request(app)
        .put(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/fields/${testRequiredFieldId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({ response_value: 'Our mission is to serve the community.' });

      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/sections/${testSectionId}/validate`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.validation_status).toBe('valid');
      expect(res.body.errors).toHaveLength(0);

      // Verify section status is complete
      const sectionRes = await pool.query<{ status: string }>(
        'SELECT status FROM application_sections WHERE section_id = $1',
        [testSectionId],
      );
      expect(sectionRes.rows[0].status).toBe('complete');
    });
  });
});
