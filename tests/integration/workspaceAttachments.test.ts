/**
 * Integration tests for workspace attachments API (PRD-INTAKE-041 / PRD-INTAKE-042)
 * and preview API (PRD-INTAKE-043).
 *
 * Tests:
 * 1. POST /workspaces/:id/attachments (source_type: 'upload') → 201 with attachment_id, version_number: 1
 * 2. POST /workspaces/:id/attachments same requirement_id again → 201 with version_number: 2; prior attachment is_active: false
 * 3. GET /workspaces/:id/attachments → 200 with only is_active: true attachments
 * 4. GET /workspaces/:id/attachments/:attachmentId/versions → 200 array with both versions (active + inactive)
 * 5. DELETE /workspaces/:id/attachments/:attachmentId → 204; GET list no longer includes it
 * 6. GET /workspaces/:id/preview → 200 with label: 'DRAFT PREVIEW — NOT SUBMITTED' (no comments in response)
 * 7. Preview does NOT include workspace_comments in response body (verify by checking response keys)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `att-${Date.now()}`;

const ORG_ADMIN_EMAIL = `att.admin.${UNIQUE_ID}@example.com`;
const GRANTOR_EMAIL = `att.grantor.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let orgAdminUserId: string;
let grantorUserId: string;
let grantorOrgId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let testWorkspaceId: string;

// Attachment requirement (from migration 008)
let testRequirementId: string;

let orgAdminToken: string;

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

// Small PDF file encoded as base64 (minimal valid content for testing)
const TEST_FILE_BASE64 = Buffer.from('This is a test document content.').toString('base64');
const TEST_FILE_NAME = 'test-doc.txt';
const TEST_MIME_TYPE = 'text/plain';
const TEST_FILE_SIZE = Buffer.from('This is a test document content.').length;

describe('Workspace Attachments API (PRD-INTAKE-041/042)', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    const emails = [ORG_ADMIN_EMAIL, GRANTOR_EMAIL];
    for (const email of emails) {
      const res = await pool.query<{ user_id: string }>('SELECT user_id FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [res.rows[0].user_id]);
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [res.rows[0].user_id]);
      }
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    // Create users
    orgAdminUserId = await createUser(ORG_ADMIN_EMAIL, 'ATT Org Admin');
    grantorUserId = await createUser(GRANTOR_EMAIL, 'ATT Grantor');

    // Create grantor org
    const grantorOrgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`ATT Test Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
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
        `ATT Test Org ${UNIQUE_ID}`,
        '100 Attachment Ave',
        'Baltimore',
        'MD',
        '21201',
        'nonprofit_501c3',
        'ATT Contact',
        `att-contact.${UNIQUE_ID}@example.com`,
        'ready',
        0,
      ],
    );
    testOrgId = orgResult.rows[0].org_id;

    // Assign org_admin role
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)`,
      [testOrgId, orgAdminUserId, JSON.stringify(['org_admin'])],
    );

    // Create grantor program
    const progResult = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by)
       VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `ATT Test Program ${UNIQUE_ID}`, grantorUserId],
    );
    testProgramId = progResult.rows[0].program_id;

    // Create opportunity
    const oppResult = await pool.query<{ opportunity_id: string }>(
      `INSERT INTO opportunities (
        program_id, title, funding_source, announcement_type, opportunity_number,
        eligibility_summary, executive_summary, contact_name, contact_email, program_area, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING opportunity_id`,
      [
        testProgramId,
        `ATT Test Opportunity ${UNIQUE_ID}`,
        'Test Agency',
        'Initial',
        `ATT-OPP-${UNIQUE_ID}`,
        'Open to nonprofits',
        'Attachment test opportunity',
        'Test Contact',
        `att-opp.${UNIQUE_ID}@example.gov`,
        'Testing',
        grantorUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Create an attachment requirement for version history tests
    const reqResult = await pool.query<{ requirement_id: string }>(
      `INSERT INTO attachment_requirements
         (opportunity_id, document_type, custom_document_name, is_required, stage_scope, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING requirement_id`,
      [
        testOpportunityId,
        'other',
        `Test Attachment Requirement ${UNIQUE_ID}`,
        true,
        'full_application',
        grantorUserId,
      ],
    );
    testRequirementId = reqResult.rows[0].requirement_id;

    // Log in
    orgAdminToken = await loginUser(ORG_ADMIN_EMAIL, TEST_PASSWORD);

    // Create workspace
    const wsRes = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${orgAdminToken}`)
      .send({ opportunity_id: testOpportunityId });

    expect(wsRes.status).toBe(201);
    testWorkspaceId = wsRes.body.workspace.workspace_id;
  });

  afterAll(async () => {
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    if (testWorkspaceId) {
      await pool.query('DELETE FROM budget_line_items WHERE budget_id IN (SELECT budget_id FROM budgets WHERE workspace_id = $1)', [testWorkspaceId]);
      await pool.query('DELETE FROM budgets WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query('DELETE FROM attachments WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query('DELETE FROM workspace_tasks WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query('DELETE FROM application_sections WHERE workspace_id = $1', [testWorkspaceId]);
      await pool.query(
        `DELETE FROM audit_events WHERE entity_type = 'workspace' AND entity_id = $1::uuid`,
        [testWorkspaceId],
      );
      await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [testWorkspaceId]);
    }

    if (testRequirementId) {
      await pool.query('DELETE FROM attachment_requirements WHERE requirement_id = $1', [testRequirementId]);
    }

    const userIds = [orgAdminUserId, grantorUserId].filter(Boolean);
    if (userIds.length > 0) {
      await pool.query(`DELETE FROM audit_events WHERE actor_user_id = ANY($1::uuid[])`, [userIds]);
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

  // ── Test 1: POST attachment (upload) → 201 with version_number: 1 ──────────────

  describe('POST /api/v1/workspaces/:id/attachments', () => {
    let firstAttachmentId: string;

    it('uploads attachment and returns 201 with attachment_id and version_number: 1', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          source_type: 'upload',
          requirement_id: testRequirementId,
          file_name: TEST_FILE_NAME,
          mime_type: TEST_MIME_TYPE,
          file_size_bytes: TEST_FILE_SIZE,
          content_base64: TEST_FILE_BASE64,
        });

      expect(res.status).toBe(201);
      expect(res.body.attachment_id).toBeTruthy();
      expect(res.body.version_number).toBe(1);
      expect(res.body.is_active).toBe(true);
      expect(res.body.file_name).toBe(TEST_FILE_NAME);
      firstAttachmentId = res.body.attachment_id;
    });

    // ── Test 2: Upload again for same requirement → version_number: 2; prior is_active: false ─

    it('second upload for same requirement_id creates version_number: 2; prior is_active: false', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          source_type: 'upload',
          requirement_id: testRequirementId,
          file_name: 'test-doc-v2.txt',
          mime_type: TEST_MIME_TYPE,
          file_size_bytes: TEST_FILE_SIZE,
          content_base64: TEST_FILE_BASE64,
        });

      expect(res.status).toBe(201);
      expect(res.body.version_number).toBe(2);
      expect(res.body.is_active).toBe(true);

      // Verify prior version is now inactive
      const priorRes = await pool.query<{ is_active: boolean }>(
        `SELECT is_active FROM attachments WHERE attachment_id = $1`,
        [firstAttachmentId],
      );
      expect(priorRes.rows[0].is_active).toBe(false);
    });
  });

  // ── Test 3: GET attachments → only active attachments ────────────────────────

  describe('GET /api/v1/workspaces/:id/attachments', () => {
    it('returns only is_active: true attachments', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      // All returned attachments must be active
      for (const att of res.body) {
        expect(att.is_active).toBe(true);
      }

      // Should have exactly one active attachment for our requirement
      const forReq = res.body.filter(
        (a: { requirement_id: string }) => a.requirement_id === testRequirementId
      );
      expect(forReq.length).toBe(1);
      expect(forReq[0].version_number).toBe(2);
    });
  });

  // ── Test 4: GET versions → both versions (active + inactive) ─────────────────

  describe('GET /api/v1/workspaces/:id/attachments/:attachmentId/versions', () => {
    it('returns all versions (active + inactive) for a requirement', async () => {
      // Get the active attachment for this requirement
      const listRes = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      const activeAtt = listRes.body.find(
        (a: { requirement_id: string }) => a.requirement_id === testRequirementId
      );
      expect(activeAtt).toBeTruthy();

      const versionsRes = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/attachments/${activeAtt.attachment_id}/versions`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(versionsRes.status).toBe(200);
      expect(Array.isArray(versionsRes.body)).toBe(true);
      // Should have at least 2 versions (v1 inactive, v2 active)
      expect(versionsRes.body.length).toBeGreaterThanOrEqual(2);

      const versionNumbers = versionsRes.body.map((a: { version_number: number }) => a.version_number);
      expect(versionNumbers).toContain(1);
      expect(versionNumbers).toContain(2);
    });
  });

  // ── Test 5: DELETE → 204; GET list no longer includes it ─────────────────────

  describe('DELETE /api/v1/workspaces/:id/attachments/:attachmentId', () => {
    it('soft-deletes attachment (204) and it no longer appears in active list', async () => {
      // Upload a new attachment without requirement linkage (standalone)
      const uploadRes = await request(app)
        .post(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`)
        .send({
          source_type: 'upload',
          file_name: 'to-delete.txt',
          mime_type: TEST_MIME_TYPE,
          file_size_bytes: TEST_FILE_SIZE,
          content_base64: TEST_FILE_BASE64,
        });
      expect(uploadRes.status).toBe(201);
      const attachmentId = uploadRes.body.attachment_id;

      // Delete it
      const delRes = await request(app)
        .delete(`/api/v1/workspaces/${testWorkspaceId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${orgAdminToken}`);
      expect(delRes.status).toBe(204);

      // Confirm it's gone from active list
      const listRes = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/attachments`)
        .set('Authorization', `Bearer ${orgAdminToken}`);
      const found = listRes.body.find((a: { attachment_id: string }) => a.attachment_id === attachmentId);
      expect(found).toBeUndefined();
    });
  });

  // ── Test 6: GET /preview → 200 with correct label ────────────────────────────

  describe('GET /api/v1/workspaces/:id/preview', () => {
    it("returns 200 with label: 'DRAFT PREVIEW — NOT SUBMITTED'", async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/preview`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.label).toBe('DRAFT PREVIEW — NOT SUBMITTED');
      expect(res.body.workspace_id).toBe(testWorkspaceId);
      expect(res.body.generated_at).toBeTruthy();
      expect(Array.isArray(res.body.sections)).toBe(true);
      expect(res.body.budget).toBeTruthy();
      expect(Array.isArray(res.body.attachments)).toBe(true);
    });

    // ── Test 7: Preview does NOT include workspace_comments ───────────────────────

    it('preview response does NOT include workspace_comments key', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${testWorkspaceId}/preview`)
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect(res.status).toBe(200);

      // Verify 'comments' key is absent from response (T-04-16)
      expect(res.body).not.toHaveProperty('comments');
      expect(res.body).not.toHaveProperty('workspace_comments');
      expect(res.body).not.toHaveProperty('internal_comments');

      // Verify the response only has the expected keys
      const responseKeys = Object.keys(res.body);
      const allowedKeys = ['workspace_id', 'generated_at', 'label', 'sections', 'budget', 'attachments'];
      for (const key of responseKeys) {
        expect(allowedKeys).toContain(key);
      }
    });
  });
});


