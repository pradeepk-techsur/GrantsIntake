import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';

finalizeApp();

const UNIQUE_ID = `wsval-${Date.now()}`;
const APPLICANT_EMAIL = `wsval.applicant.${UNIQUE_ID}@example.com`;
const OUTSIDER_EMAIL = `wsval.outsider.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let applicantToken: string;
let outsiderToken: string;
let applicantUserId: string;
let outsiderUserId: string;
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

describe('Workspace Validation API', () => {
  beforeAll(async () => {
    // Clean up leftover test data
    for (const email of [APPLICANT_EMAIL, OUTSIDER_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    // Create applicant user
    const appUserRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [APPLICANT_EMAIL, 'WsVal Applicant', hash],
    );
    applicantUserId = appUserRes.rows[0].user_id;

    // Create outsider user (not in org)
    const outsiderRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [OUTSIDER_EMAIL, 'WsVal Outsider', hash],
    );
    outsiderUserId = outsiderRes.rows[0].user_id;

    // Create applicant org + role
    const appOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO organizations (legal_name, entity_type, address_line1, city, state, zip, primary_contact_name, primary_contact_email)
       VALUES ($1, $2, '100 Val St', 'Washington', 'DC', '20001', 'Val Contact', 'val@test.com') RETURNING org_id`,
      [`WsVal Applicant Org ${UNIQUE_ID}`, 'nonprofit'],
    );
    applicantOrgId = appOrgRes.rows[0].org_id;

    await pool.query(
      `INSERT INTO org_roles (org_id, user_id, roles, invited_by) VALUES ($1, $2, $3::jsonb, $2) ON CONFLICT DO NOTHING`,
      [applicantOrgId, applicantUserId, JSON.stringify(['org_admin'])],
    );

    // Create grantor org + program + opportunity
    const grantorOrgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`WsVal Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = grantorOrgRes.rows[0].org_id;

    const progRes = await pool.query<{ program_id: string }>(
      `INSERT INTO programs (grantor_org_id, program_name, is_federal, created_by) VALUES ($1, $2, false, $3) RETURNING program_id`,
      [grantorOrgId, `WsVal Program ${UNIQUE_ID}`, applicantUserId],
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
        `WsVal Opportunity ${UNIQUE_ID}`,
        'Federal Grant Agency',
        'Initial',
        `WSVAL-${UNIQUE_ID}`,
        100000,
        'Open to nonprofits',
        'Validation test funding',
        'Dr. WsVal',
        'wsval@example.gov',
        'Education',
        'published',
        `wsval-${UNIQUE_ID}`,
        applicantUserId,
        yesterday,
        futureClose,
        applicantUserId,
      ],
    );
    testOpportunityId = oppRes.rows[0].opportunity_id;

    // Create workspace
    const wsRes = await pool.query<{ workspace_id: string }>(
      `INSERT INTO application_workspaces (org_id, opportunity_id, created_by, status) VALUES ($1, $2, $3, 'draft') RETURNING workspace_id`,
      [applicantOrgId, testOpportunityId, applicantUserId],
    );
    workspaceId = wsRes.rows[0].workspace_id;

    // Create sections with various statuses and validation_errors
    await pool.query(
      `INSERT INTO application_sections (workspace_id, section_name, section_type, display_order, status, is_visible, validation_errors)
       VALUES
         ($1, 'Organization Profile', 'org_profile', 1, 'complete', true, '[]'::jsonb),
         ($1, 'Eligibility', 'eligibility', 2, 'in_progress', true, $2::jsonb),
         ($1, 'Certifications', 'certifications', 3, 'not_started', true, '[]'::jsonb),
         ($1, 'Review & Submit', 'review_submit', 4, 'not_started', true, '[]'::jsonb),
         ($1, 'Budget', 'budget', 5, 'complete', true, $3::jsonb)`,
      [
        workspaceId,
        JSON.stringify([
          { severity: 'blocking', field_id: 'ein', field_label: 'EIN', error_code: 'REQUIRED_FIELD', message: 'EIN is required' },
          { severity: 'warning', field_id: 'duns', field_label: 'DUNS', message: 'DUNS number recommended' },
        ]),
        JSON.stringify([
          { severity: 'warning', field_id: 'total', field_label: 'Total', message: 'Budget total exceeds guidelines' },
        ]),
      ],
    );

    // Login users
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
    outsiderToken = await loginUser(OUTSIDER_EMAIL, TEST_PASSWORD);
  });

  afterAll(async () => {
    // Disable immutability trigger on audit_events for cleanup
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    for (const uid of [applicantUserId, outsiderUserId]) {
      if (uid) await pool.query('DELETE FROM audit_events WHERE actor_user_id = $1', [uid]);
    }
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');

    await pool.query('DELETE FROM application_sections WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM application_workspaces WHERE workspace_id = $1', [workspaceId]);
    await pool.query('DELETE FROM opportunities WHERE opportunity_id = $1', [testOpportunityId]);
    await pool.query('DELETE FROM programs WHERE program_id = $1', [testProgramId]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    await pool.query('DELETE FROM org_roles WHERE org_id = $1', [applicantOrgId]);
    await pool.query('DELETE FROM organizations WHERE org_id = $1', [applicantOrgId]);
    for (const email of [APPLICANT_EMAIL, OUTSIDER_EMAIL]) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }
    await closeRedisClient();
  });

  it('POST /workspaces/:id/validate returns 200 with blocking, warnings, informational, blocking_count', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('blocking');
    expect(res.body).toHaveProperty('warnings');
    expect(res.body).toHaveProperty('informational');
    expect(res.body).toHaveProperty('blocking_count');
    expect(res.body.workspace_id).toBe(workspaceId);
    expect(Array.isArray(res.body.blocking)).toBe(true);
    expect(Array.isArray(res.body.warnings)).toBe(true);
    expect(Array.isArray(res.body.informational)).toBe(true);
  });

  it('returns blocking error for MANDATORY_SECTION_INCOMPLETE when section not complete', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    expect(res.status).toBe(200);
    // Eligibility, Certifications, and Review & Submit are mandatory and not complete
    const mandatoryIncomplete = res.body.blocking.filter(
      (e: { error_code: string }) => e.error_code === 'MANDATORY_SECTION_INCOMPLETE',
    );
    expect(mandatoryIncomplete.length).toBeGreaterThanOrEqual(2); // eligibility + certifications + review_submit
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .send();

    expect(res.status).toBe(401);
  });

  it('returns 403 for non-member', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send();

    expect(res.status).toBe(403);
  });

  it('blocking_count matches blocking.length', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.blocking_count).toBe(res.body.blocking.length);
  });

  it('blocking errors have link field pointing to workspace anchor', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/validate`)
      .set('Authorization', `Bearer ${applicantToken}`)
      .send();

    expect(res.status).toBe(200);
    for (const err of res.body.blocking) {
      expect(err.link).toBeDefined();
      expect(typeof err.link).toBe('string');
      expect(err.link.length).toBeGreaterThan(0);
    }
  });
});
