import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `ar-${Date.now()}`;
const TEST_EMAIL = `ar.admin.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminAccessToken: string;
let testUserId: string;
let testOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let createdRequirementId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Attachment Requirements API', () => {
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
      [TEST_EMAIL, 'Attachment Requirements Test Admin', hash],
    );
    testUserId = adminResult.rows[0].user_id;

    // Create test org
    const orgResult = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Test Org AR ${UNIQUE_ID}`, 'federal_agency'],
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
      [testOrgId, `Test Program AR ${UNIQUE_ID}`, testUserId],
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
        'Test Attachment Requirements Opportunity',
        'Federal Grant Agency',
        'Initial',
        `AR-${UNIQUE_ID}`,
        'Nonprofits only',
        'Testing attachment requirements',
        'Test Contact',
        'test@example.gov',
        'Health',
        testUserId,
      ],
    );
    testOpportunityId = oppResult.rows[0].opportunity_id;

    // Get access token
    adminAccessToken = await loginUser(TEST_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM attachment_requirements WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [testOrgId]);
    await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [testUserId]);
    await pool.end();
    await closeRedisClient();
  });

  // ─── POST creates attachment requirement ──────────────────────────────────

  describe('POST /api/v1/opportunities/:id/attachment-requirements', () => {
    it('creates requirement with stage_scope=full_application, applicant_type_scope, file_format_restrictions', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          document_type: 'financial_statements',
          stage_scope: 'full_application',
          applicant_type_scope: ['nonprofit'],
          is_required: true,
          file_format_restrictions: ['.pdf', '.docx'],
          max_file_size_mb: 25,
        });

      expect(res.status).toBe(201);
      expect(res.body.requirement_id).toBeTruthy();
      expect(res.body.opportunity_id).toBe(testOpportunityId);
      expect(res.body.document_type).toBe('financial_statements');
      expect(res.body.stage_scope).toBe('full_application');
      expect(res.body.is_required).toBe(true);
      expect(res.body.max_file_size_mb).toBe(25);

      createdRequirementId = res.body.requirement_id;
    });

    it('returns 400 on invalid stage_scope', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          document_type: 'financial_statements',
          stage_scope: 'invalid_stage',
          applicant_type_scope: [],
          is_required: true,
        });

      // Zod validation happens at route layer (422), or service layer (400)
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('returns 401 without authentication token', async () => {
      const res = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .send({
          document_type: 'financial_statements',
          stage_scope: 'full_application',
        });

      expect(res.status).toBe(401);
    });
  });

  // ─── GET returns list with created requirement ─────────────────────────────

  describe('GET /api/v1/opportunities/:id/attachment-requirements', () => {
    it('returns list with the created requirement', async () => {
      const res = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.find(
        (r: { requirement_id: string }) => r.requirement_id === createdRequirementId,
      );
      expect(found).toBeTruthy();
      expect(found.document_type).toBe('financial_statements');
    });
  });

  // ─── PUT updates instructions ──────────────────────────────────────────────

  describe('PUT /api/v1/attachment-requirements/:requirement_id', () => {
    it('updates instructions field', async () => {
      const res = await request(app)
        .put(`/api/v1/attachment-requirements/${createdRequirementId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          instructions: 'Please submit audited financial statements for the last 2 fiscal years.',
        });

      expect(res.status).toBe(200);
      expect(res.body.requirement_id).toBe(createdRequirementId);
      expect(res.body.instructions).toBe(
        'Please submit audited financial statements for the last 2 fiscal years.',
      );
    });
  });

  // ─── DELETE removes requirement ────────────────────────────────────────────

  describe('DELETE /api/v1/attachment-requirements/:requirement_id', () => {
    it('removes requirement; subsequent GET returns empty list for this opportunity', async () => {
      // Create a separate requirement to delete
      const createRes = await request(app)
        .post(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          document_type: 'board_resolution',
          stage_scope: 'pre_application',
          applicant_type_scope: [],
          is_required: false,
        });
      expect(createRes.status).toBe(201);
      const deleteId = createRes.body.requirement_id;

      const deleteRes = await request(app)
        .delete(`/api/v1/attachment-requirements/${deleteId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify it's gone
      const listRes = await request(app)
        .get(`/api/v1/opportunities/${testOpportunityId}/attachment-requirements`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      const found = listRes.body.find(
        (r: { requirement_id: string }) => r.requirement_id === deleteId,
      );
      expect(found).toBeUndefined();
    });
  });
});
