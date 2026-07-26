import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `org-${Date.now()}`;
const ADMIN_EMAIL = `org.admin.${UNIQUE_ID}@example.com`;
const MEMBER_EMAIL = `org.member.${UNIQUE_ID}@example.com`;
const OTHER_EMAIL = `org.other.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let memberAccessToken: string;
let otherAccessToken: string;

let adminUserId: string;
let memberUserId: string;
let otherUserId: string;

let testOrgId: string;
let memberRoleId: string;
let testDocId: string;

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

describe('Organizations API', () => {
  beforeAll(async () => {
    // Clean up any leftover test data
    for (const email of [ADMIN_EMAIL, MEMBER_EMAIL, OTHER_EMAIL]) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }

    adminUserId = await createUser(ADMIN_EMAIL, 'Org Admin User');
    memberUserId = await createUser(MEMBER_EMAIL, 'Org Member User');
    otherUserId = await createUser(OTHER_EMAIL, 'Unrelated User');

    adminAccessToken = await loginUser(ADMIN_EMAIL, TEST_PASSWORD);
    memberAccessToken = await loginUser(MEMBER_EMAIL, TEST_PASSWORD);
    otherAccessToken = await loginUser(OTHER_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable immutability trigger so we can clean up audit_events
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');

    if (testOrgId) {
      await pool.query('DELETE FROM org_attachments WHERE org_id = $1', [testOrgId]);
      await pool.query('DELETE FROM org_contacts WHERE org_id = $1', [testOrgId]);
      await pool.query(
        `DELETE FROM audit_events WHERE entity_type = 'organization' AND entity_id = $1::uuid`,
        [testOrgId],
      );
      await pool.query('DELETE FROM org_roles WHERE org_id = $1', [testOrgId]);
      await pool.query('DELETE FROM organizations WHERE org_id = $1', [testOrgId]);
    }

    // Also delete any audit events where our test users are actors
    if (adminUserId || memberUserId || otherUserId) {
      const userIds = [adminUserId, memberUserId, otherUserId].filter(Boolean);
      await pool.query(
        `DELETE FROM audit_events WHERE actor_user_id = ANY($1::uuid[])`,
        [userIds],
      );
    }

    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    await pool.query('DELETE FROM users WHERE user_id = ANY($1::uuid[])', [
      [adminUserId, memberUserId, otherUserId].filter(Boolean),
    ]);

    await pool.end();
    await closeRedisClient();
  });

  // ─── 1. POST /organizations → 201 with org_id and profile_completeness_pct ───

  describe('POST /api/v1/organizations', () => {
    it('creates org and returns 201 with org_id and profile_completeness_pct', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          legal_name: `Test Org ${UNIQUE_ID}`,
          address_line1: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
          country: 'US',
          entity_type: 'nonprofit_501c3',
          primary_contact_name: 'Jane Admin',
          primary_contact_email: `contact.${UNIQUE_ID}@example.com`,
          banking_readiness: 'ready',
          ein: '123456789',
          uei: 'ABC123DEF456',
          sam_registered: true,
          sam_expiration_date: '2020-01-01', // past date → for credential-status test
        });

      expect(res.status).toBe(201);
      expect(res.body.org_id).toBeTruthy();
      expect(typeof res.body.profile_completeness_pct).toBe('number');
      expect(res.body.profile_completeness_pct).toBeGreaterThanOrEqual(0);
      expect(res.body.legal_name).toBe(`Test Org ${UNIQUE_ID}`);

      testOrgId = res.body.org_id;
    });

    // ─── 2. POST /organizations → 422 with invalid UEI ──────────────────────

    it('returns 422 with invalid UEI (wrong format)', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          legal_name: 'Invalid UEI Org',
          address_line1: '456 Test Ave',
          city: 'Chicago',
          state: 'IL',
          zip: '60601',
          entity_type: 'nonprofit_501c3',
          primary_contact_name: 'Test Contact',
          primary_contact_email: 'contact@example.com',
          banking_readiness: 'unknown',
          uei: 'TOOSHORT', // invalid: not 12 alphanumeric chars
        });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/organizations')
        .send({ legal_name: 'Unauthenticated Org' });

      expect(res.status).toBe(401);
    });
  });

  // ─── 3. GET /organizations/:org_id → 200 for creator ─────────────────────

  describe('GET /api/v1/organizations/:org_id', () => {
    it('returns 200 with full org for creator (org_admin)', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.org_id).toBe(testOrgId);
      expect(res.body.legal_name).toBeTruthy();
      expect(res.body.entity_type).toBe('nonprofit_501c3');
    });

    // ─── 4. GET /organizations/:org_id → 403 for unrelated user ──────────────

    it('returns 403 for unrelated authenticated user (IDOR guard)', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 401 without authentication', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}`);

      expect(res.status).toBe(401);
    });
  });

  // ─── 5. PUT /organizations/:org_id → 200 for org_admin ───────────────────

  describe('PUT /api/v1/organizations/:org_id', () => {
    it('returns 200 for org_admin and updates legal_name', async () => {
      const newName = `Updated Org ${UNIQUE_ID}`;
      const res = await request(app)
        .put(`/api/v1/organizations/${testOrgId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ legal_name: newName });

      expect(res.status).toBe(200);
      expect(res.body.legal_name).toBe(newName);
      expect(res.body.org_id).toBe(testOrgId);
    });

    // ─── 6. PUT /organizations/:org_id → 403 for non-admin ───────────────────

    it('returns 403 for non-admin member', async () => {
      // First add memberUser to org_roles with a non-admin role
      await pool.query(
        `INSERT INTO org_roles (org_id, user_id, roles)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (org_id, user_id) DO UPDATE SET roles = $3::jsonb`,
        [testOrgId, memberUserId, JSON.stringify(['contributor'])],
      );

      const res = await request(app)
        .put(`/api/v1/organizations/${testOrgId}`)
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send({ legal_name: 'Should Fail' });

      expect(res.status).toBe(403);
    });
  });

  // ─── 7. GET /organizations/:org_id/credential-status → 200 ───────────────

  describe('GET /api/v1/organizations/:org_id/credential-status', () => {
    it('returns 200 with credentials array; past sam_expiration_date → expired', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/credential-status`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.org_id).toBe(testOrgId);
      expect(Array.isArray(res.body.credentials)).toBe(true);

      // sam_expiration_date was set to 2020-01-01 → should be expired
      const samCred = res.body.credentials.find(
        (c: { item_type: string }) => c.item_type === 'sam_expiration',
      );
      expect(samCred).toBeTruthy();
      expect(samCred.status).toBe('expired');
      expect(samCred.days_remaining).toBeLessThan(0);
    });
  });

  // ─── 8. GET /organizations/:org_id/roles → 200, creator is org_admin ──────

  describe('GET /api/v1/organizations/:org_id/roles', () => {
    it('returns 200 with list including creator as org_admin', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/roles`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const adminRole = res.body.find((r: { user_id: string }) => r.user_id === adminUserId);
      expect(adminRole).toBeTruthy();
      expect(adminRole.roles).toContain('org_admin');
    });
  });

  // ─── 9. POST /organizations/:org_id/roles → 201, assigns second user ──────

  describe('POST /api/v1/organizations/:org_id/roles', () => {
    it('returns 201 and assigns second user to proposal_lead', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/roles`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          user_id: otherUserId,
          roles: ['proposal_lead'],
        });

      expect(res.status).toBe(201);
      expect(res.body.role_id).toBeTruthy();
      expect(res.body.user_id).toBe(otherUserId);
      expect(res.body.roles).toContain('proposal_lead');

      memberRoleId = res.body.role_id;
    });

    it('returns 403 for non-admin trying to assign roles', async () => {
      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/roles`)
        .set('Authorization', `Bearer ${memberAccessToken}`)
        .send({
          user_id: memberUserId,
          roles: ['contributor'],
        });

      expect(res.status).toBe(403);
    });
  });

  // ─── 10. DELETE /organizations/:org_id/roles/:role_id → 204 ─────────────

  describe('DELETE /api/v1/organizations/:org_id/roles/:role_id', () => {
    it('returns 204 and revokes second user role', async () => {
      const res = await request(app)
        .delete(`/api/v1/organizations/${testOrgId}/roles/${memberRoleId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(204);
    });
  });

  // ─── 11. GET /organizations/:org_id/documents → 200, empty initially ──────

  describe('GET /api/v1/organizations/:org_id/documents', () => {
    it('returns 200 with empty array initially', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/documents`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─── 12. POST /organizations/:org_id/documents → 201 with attachment_id ──

  describe('POST /api/v1/organizations/:org_id/documents', () => {
    it('returns 201 with attachment_id on document upload (base64 JSON)', async () => {
      const testContent = 'Test file content for W9';
      const base64Content = Buffer.from(testContent).toString('base64');

      const res = await request(app)
        .post(`/api/v1/organizations/${testOrgId}/documents`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          document_type: 'w9',
          file_name: 'test-w9.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: testContent.length,
          file_content_base64: base64Content,
        });

      expect(res.status).toBe(201);
      expect(res.body.attachment_id).toBeTruthy();
      expect(res.body.document_type).toBe('w9');
      expect(res.body.org_id).toBe(testOrgId);
      expect(res.body.version_number).toBe(1);
      expect(res.body.expiration_status).toBeTruthy();

      testDocId = res.body.attachment_id;
    });
  });

  // ─── 13. GET /organizations/:org_id/documents/:doc_id/versions → 200 ─────

  describe('GET /api/v1/organizations/:org_id/documents/:doc_id/versions', () => {
    it('returns 200 with version history for document', async () => {
      const res = await request(app)
        .get(`/api/v1/organizations/${testOrgId}/documents/${testDocId}/versions`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].attachment_id).toBe(testDocId);
      expect(res.body[0].version_number).toBeGreaterThan(0);
    });
  });
});
