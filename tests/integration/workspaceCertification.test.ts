import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `wscert-${Date.now()}`;
const AR_EMAIL = `wscert.ar.${UNIQUE_ID}@example.com`;
const NON_AR_EMAIL = `wscert.nonar.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

const CERT_TEXT = 'I certify that the information contained in this application is accurate and complete, and that I am authorized to submit this application on behalf of the applicant organization.';

let arToken: string;
let nonArToken: string;
let arUserId: string;
let nonArUserId: string;
let applicantOrgId: string;
let grantorOrgId: string;
let testProgramId: string;
let testOpportunityId: string;
let workspaceId: string;

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

describe('Workspace Certification API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    for (const email of [AR_EMAIL, NON_AR_EMAIL]) {
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
      [AR_EMAIL, 'WsCert AR', hash],
    );
    arUserId = arRes.rows[0].user_id;

    // Create non-AR user
    const nonArRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [NON_AR_EMAIL, 'WsCert Non-AR', hash],
    );
    nonArUserId = nonArRes.rows[0].user_id;

    // Create applicant org
    const appOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (legal_name, entity_type, address_line1, city, state, zip, primary_contact_name, primary_contact_email)
       VALUES ($1, $2, '200 Cert St', 'Washington', 'DC', '20001', 'Cert Contact', 'cert@test.com') RETURNING org_id`,
      [`WsCert Applicant Org ${UNIQUE_ID}`, 'nonprofit'],
    );
    applicantOrgId = appOrgRes.rows[0].org_id;

    // AR user gets authorized_representative role
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by) VALUES ($1, $2, $3::jsonb, $2) ON CONFLICT DO NOTHING`,
      [applicantOrgId, arUserId, JSON.stringify(['authorized_representative'])],
    );

    // Non-AR user gets contributor role (same org, but no AR role)
    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by) VALUES ($1, $2, $3::jsonb, $2) ON CONFLICT DO NOTHING`,
      [applicantOrgId, nonArUserId, JSON.stringify(['contributor'])],
    );

    // Create grantor org + program + opportunity
    const grantorOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`WsCert Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgRes.rows[0].org_id;

    const progRes = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `WsCert Program ${UNIQUE_ID}`, arUserId],
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
        `WsCert Opportunity ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `WSCERT-${UNIQUE_ID}`,
        100000,
        'Open to nonprofits',
        'Certification test funding',
        'Dr. WsCert',
        'wscert@example.gov',
        'Education',
        'published',
        `wscert-${UNIQUE_ID}`,
        arUserId,
        yesterday,
        futureClose,
        arUserId,
      ],
    );
    testOpportunityId = oppRes.rows[0].opportunity_id;

    // Create workspace
    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status) VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, testOpportunityId, arUserId],
    );
    workspaceId = wsRes.rows[0].workspace_id;

    // Login users
    arToken = await loginUser(AR_EMAIL, TEST_PASSWORD);
    nonArToken = await loginUser(NON_AR_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable immutability trigger on audit_events for cleanup
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    for (const uid of [arUserId, nonArUserId]) {
      if (uid) await pool.query('DELETE FROM audit_events WHERE actor_user_id = $1', [uid]);
    }
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    await pool.query('DELETE FROM certifications WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM workspace_comments WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    await pool.query('DELETE FROM org_roles WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    for (const email of [AR_EMAIL, NON_AR_EMAIL]) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }
    await closeRedisClient();
  });

  it('GET /workspaces/:id/certification returns { certified: false, certification: null } before certifying', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/certification`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    expect(res.body.certified).toBe(false);
    expect(res.body.certification).toBeNull();
  });

  it('POST /workspaces/:id/certify with non-AR user token returns 403 FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/certify`)
      .set('Authorization', `Bearer ${nonArToken}`)
      .send({ certification_text: CERT_TEXT });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });

  it('POST /workspaces/:id/certify with AR user token returns 200 with cert_id, certification_text_hash', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/certify`)
      .set('Authorization', `Bearer ${arToken}`)
      .send({ certification_text: CERT_TEXT });

    expect(res.status).toBe(200);
    expect(res.body.cert_id).toBeDefined();
    expect(res.body.certification_text_hash).toBeDefined();
    expect(res.body.workspace_id).toBe(workspaceId);
    expect(res.body.certifying_user_id).toBe(arUserId);
  });

  it('certification_text_hash is a valid 64-char SHA-256 hex string', async () => {
    const certRes = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/certification`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(certRes.status).toBe(200);
    const hash = certRes.body.certification.certification_text_hash;
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('POST /workspaces/:id/certify second call (duplicate) returns 409 ALREADY_CERTIFIED', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/certify`)
      .set('Authorization', `Bearer ${arToken}`)
      .send({ certification_text: CERT_TEXT });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_CERTIFIED');
  });

  it('GET /workspaces/:id/certification returns { certified: true, certification: {...} } after certifying', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/certification`)
      .set('Authorization', `Bearer ${arToken}`);

    expect(res.status).toBe(200);
    expect(res.body.certified).toBe(true);
    expect(res.body.certification).toBeDefined();
    expect(res.body.certification.cert_id).toBeDefined();
    expect(res.body.certification.certification_text_hash).toBeDefined();
  });

  it('Audit event CERTIFICATION_COMPLETED created after successful certification', async () => {
    const auditRes = await pool.query(
      `SELECT * FROM audit_events WHERE event_type = 'CERTIFICATION_COMPLETED' AND actor_user_id = $1`,
      [arUserId],
    );
    expect(auditRes.rowCount).toBeGreaterThanOrEqual(1);
    expect(auditRes.rows[0].entity_type).toBe('certification');
  });

  it('POST /workspaces/:id/concern with AR token returns 200 (non-blocking)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/concern`)
      .set('Authorization', `Bearer ${arToken}`)
      .send({ concern_text: 'I have concerns about section 3 completeness' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Concern flag recorded');

    // Verify workspace comment was created
    const commentRes = await pool.query(
      `SELECT * FROM workspace_comments WHERE workspace_id = $1 AND comment_text LIKE '[AR CONCERN FLAG]%'`,
      [workspaceId],
    );
    expect(commentRes.rowCount).toBeGreaterThanOrEqual(1);
  });
});
