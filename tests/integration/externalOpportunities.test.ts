import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';
import { grantsGovService } from '../../src/services/external/grantsGovService';
import { externalOpportunityService } from '../../src/services/external/externalOpportunityService';
import { ingestionScheduler } from '../../src/services/external/ingestionScheduler';

finalizeApp();

const UNIQUE_ID = `ext-${Date.now()}`;
const ADMIN_EMAIL = `ext.admin.${UNIQUE_ID}@example.com`;
const APPLICANT_EMAIL = `ext.applicant.${UNIQUE_ID}@example.com`;
const TEST_PASSWORD = 'TestPass123!';

let adminToken: string;
let applicantToken: string;
let adminUserId: string;
let applicantUserId: string;
let grantorOrgId: string;

// ─── Grants.gov API fixtures ─────────────────────────────────────────────────

const SEARCH_HIT = {
  id: '900001',
  number: 'TEST-FON-001',
  title: 'Community Health Innovation Grant',
  agencyName: 'Department of Health and Human Services',
  oppStatus: 'posted',
  closeDate: '12/31/2026',
  cfdaList: ['93.999'],
};

function detailV1() {
  return {
    id: '900001',
    opportunityId: '900001',
    opportunityNumber: 'TEST-FON-001',
    opportunityTitle: 'Community Health Innovation Grant',
    agencyName: 'Department of Health and Human Services',
    opportunityStatus: 'posted',
    closeDate: '12/31/2026',
    awardCeiling: '500000',
    awardFloor: '50000',
    cfdaNumbers: ['93.999'],
    eligibilityTypes: ['Nonprofits', 'State governments'],
    applicantEligibilityDesc: 'Open to eligible nonprofits.',
    packages: [{ packageURL: 'https://apply07.grants.gov/apply/opportunities/instructions/PKG-1' }],
  };
}

// Same opportunity, later fetch: due_date + status changed → should raise alerts.
function detailV2() {
  return {
    ...detailV1(),
    closeDate: '11/30/2026',
    opportunityStatus: 'closed',
  };
}

// Build a mock fetch that dispatches on URL/method.
function makeMockFetch(detail: () => Record<string, unknown>, hits = [SEARCH_HIT]) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    if (u.includes('/search2/opportunities/search')) {
      const startRecordNum = init?.body
        ? (JSON.parse(init.body as string).startRecordNum ?? 0)
        : 0;
      // Only the first page returns hits; subsequent pages are empty.
      const body = startRecordNum === 0 ? { data: { oppHits: hits } } : { data: { oppHits: [] } };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (u.includes('/opportunities/')) {
      return new Response(JSON.stringify({ data: detail() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.access_token;
}

describe('External Opportunities (Grants.gov ingestion)', () => {
  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    // Clean leftover users
    for (const email of [ADMIN_EMAIL, APPLICANT_EMAIL]) {
      const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        const uid = existing.rows[0].user_id;
        await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM org_roles WHERE user_id = $1', [uid]);
        await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
      }
    }

    const adminRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [ADMIN_EMAIL, 'Ext Grantor Admin', hash],
    );
    adminUserId = adminRes.rows[0].user_id;

    const applicantRes = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active) VALUES ($1, $2, $3, true) RETURNING user_id`,
      [APPLICANT_EMAIL, 'Ext Applicant', hash],
    );
    applicantUserId = applicantRes.rows[0].user_id;

    const orgRes = await pool.query<{ org_id: string }>(
      `INSERT INTO grantor_organizations (org_name, org_type) VALUES ($1, $2) RETURNING org_id`,
      [`Ext Grantor Org ${UNIQUE_ID}`, 'federal_agency'],
    );
    grantorOrgId = orgRes.rows[0].org_id;

    await pool.query(
      `INSERT INTO grantor_roles (grantor_org_id, user_id, roles) VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (grantor_org_id, user_id) DO UPDATE SET roles = EXCLUDED.roles, revoked_at = NULL`,
      [grantorOrgId, adminUserId, JSON.stringify(['grantor_admin'])],
    );

    adminToken = await loginUser(ADMIN_EMAIL, TEST_PASSWORD);
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function cleanOpportunities() {
    await pool.query(
      `DELETE FROM external_opportunities WHERE source_opportunity_number = $1`,
      ['TEST-FON-001'],
    );
  }

  beforeEach(async () => {
    await cleanOpportunities();
  });

  afterAll(async () => {
    await cleanOpportunities();
    ingestionScheduler.stop();
    await pool.query('DELETE FROM change_alerts WHERE user_id = ANY($1)', [[adminUserId, applicantUserId]]);
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = ANY($1)', [[adminUserId, applicantUserId]]);
    await pool.query('DELETE FROM grantor_roles WHERE user_id = $1', [adminUserId]);
    // audit_events is immutable via trigger; disable to clean up login events (Phase 1 pattern)
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    await pool.query('DELETE FROM audit_events WHERE actor_user_id = ANY($1)', [[adminUserId, applicantUserId]]);
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');
    await pool.query('DELETE FROM users WHERE user_id = ANY($1)', [[adminUserId, applicantUserId]]);
    await pool.query('DELETE FROM grantor_organizations WHERE org_id = $1', [grantorOrgId]);
    await closeRedisClient();
    await pool.end();
  });

  // ─── PRD-INTAKE-019B: normalizer maps required fields ─────────────────────
  it('PRD-INTAKE-019B: normalizes all required metadata fields', () => {
    const normalized = grantsGovService.normalizeOpportunity(detailV1());
    expect(normalized.title).toBe('Community Health Innovation Grant');
    expect(normalized.agency).toBe('Department of Health and Human Services');
    expect(normalized.source_opportunity_number).toBe('TEST-FON-001');
    expect(normalized.source_assistance_listing).toBe('93.999');
    expect(normalized.opportunity_status).toBe('posted');
    expect(normalized.due_date).toBe('2026-12-31');
    expect(normalized.award_ceiling).toBe(500000);
    expect(normalized.award_floor).toBe(50000);
    expect(normalized.eligibility_summary).toContain('Nonprofits');
    expect(normalized.application_package_url).toContain('PKG-1');
    expect(normalized.source_url).toBe('https://www.grants.gov/search-results-detail/900001');
    expect(normalized.source).toBe('grants.gov');
  });

  // ─── PRD-INTAKE-019A: scheduler ingests search results ────────────────────
  it('PRD-INTAKE-019A: refreshAll ingests opportunities from Grants.gov', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    const result = await ingestionScheduler.refreshAll();
    expect(result.upserted).toBe(1);
    expect(result.failed).toBe(0);

    const listed = await request(app).get('/api/v1/external-opportunities?status=posted');
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBeGreaterThanOrEqual(1);
    const opp = listed.body.items.find(
      (o: { source_opportunity_number: string }) => o.source_opportunity_number === 'TEST-FON-001',
    );
    expect(opp).toBeDefined();
    expect(opp.title).toBe('Community Health Innovation Grant');
  });

  // ─── PRD-INTAKE-019E: source attribution + api_reference preserved ────────
  it('PRD-INTAKE-019E: preserves source attribution and api_reference', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const row = await pool.query(
      `SELECT source, source_url, source_opportunity_number, import_timestamp, api_reference
         FROM external_opportunities WHERE source_opportunity_number = $1`,
      ['TEST-FON-001'],
    );
    expect(row.rows[0].source).toBe('grants.gov');
    expect(row.rows[0].source_url).toContain('grants.gov');
    expect(row.rows[0].import_timestamp).toBeTruthy();
    expect(row.rows[0].api_reference.opportunityNumber).toBe('TEST-FON-001');
  });

  // ─── PRD-INTAKE-019C: applicant save/unsave/list ──────────────────────────
  it('PRD-INTAKE-019C: applicant can save, list, and unsave opportunities', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();
    const opp = await externalOpportunityService.listOpportunities({});
    const target = opp.items.find((o) => o.source_opportunity_number === 'TEST-FON-001')!;

    const saveRes = await request(app)
      .post(`/api/v1/external-opportunities/${target.id}/save`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(saveRes.status).toBe(201);

    const savedList = await request(app)
      .get('/api/v1/external-opportunities/saved')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(savedList.status).toBe(200);
    expect(savedList.body.items.some((o: { id: string }) => o.id === target.id)).toBe(true);

    const unsaveRes = await request(app)
      .delete(`/api/v1/external-opportunities/${target.id}/save`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(unsaveRes.status).toBe(200);

    const savedAfter = await request(app)
      .get('/api/v1/external-opportunities/saved')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(savedAfter.body.items.some((o: { id: string }) => o.id === target.id)).toBe(false);
  });

  // ─── PRD-INTAKE-019D + 019E: change alerts + version diff on re-fetch ─────
  it('PRD-INTAKE-019D/019E: re-fetch with changed due_date creates alert and version diff', async () => {
    // First fetch (v1)
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();
    const opp = await externalOpportunityService.listOpportunities({});
    const target = opp.items.find((o) => o.source_opportunity_number === 'TEST-FON-001')!;

    // Applicant saves so they receive alerts
    await externalOpportunityService.saveOpportunity(applicantUserId, target.id);

    // Second fetch (v2) with changed due_date + status
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    await ingestionScheduler.refreshAll();

    // Version history: v1 (initial, no changed_fields) + v2 (changed due_date, status)
    const versions = await externalOpportunityService.getVersionHistory(target.id);
    expect(versions.length).toBe(2);
    expect(versions[0].version_number).toBe(1);
    expect(versions[1].version_number).toBe(2);
    expect(versions[1].changed_fields).toContain('due_date');
    expect(versions[1].changed_fields).toContain('opportunity_status');

    // Change alerts for the saver
    const alertsRes = await request(app)
      .get('/api/v1/external-opportunities/alerts')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(alertsRes.status).toBe(200);
    const dueDateAlert = alertsRes.body.alerts.find(
      (a: { alert_type: string }) => a.alert_type === 'due_date_change',
    );
    expect(dueDateAlert).toBeDefined();
    expect(dueDateAlert.new_value).toBe('2026-11-30');

    // Mark alert read
    const readRes = await request(app)
      .put(`/api/v1/external-opportunities/alerts/${dueDateAlert.id}/read`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(readRes.status).toBe(200);

    const afterRead = await request(app)
      .get('/api/v1/external-opportunities/alerts')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(
      afterRead.body.alerts.some((a: { id: string }) => a.id === dueDateAlert.id),
    ).toBe(false);

    // Cleanup this test's alerts/saves
    await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [applicantUserId]);
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [applicantUserId]);
  });

  // ─── Admin refresh endpoint requires grantor_admin ────────────────────────
  it('PRD-INTAKE-019A: admin refresh requires grantor_admin role', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));

    // Applicant is forbidden
    const forbidden = await request(app)
      .post('/api/v1/external-opportunities/admin/refresh')
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(forbidden.status).toBe(403);

    // Grantor admin succeeds
    const ok = await request(app)
      .post('/api/v1/external-opportunities/admin/refresh')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.upserted).toBeGreaterThanOrEqual(1);
  });

  // ─── Version history endpoint (public) ────────────────────────────────────
  it('PRD-INTAKE-019E: GET /:id/versions returns version history', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();
    const opp = await externalOpportunityService.listOpportunities({});
    const target = opp.items.find((o) => o.source_opportunity_number === 'TEST-FON-001')!;

    const res = await request(app).get(`/api/v1/external-opportunities/${target.id}/versions`);
    expect(res.status).toBe(200);
    expect(res.body.versions.length).toBeGreaterThanOrEqual(1);
  });

  // ─── PRD-INTAKE-019C: import external opportunity into internal workspace ──
  it('PRD-INTAKE-019C: import creates an internal opportunity with mapped fields', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();
    const opp = await externalOpportunityService.listOpportunities({});
    const target = opp.items.find(
      (o) => o.source_opportunity_number === 'TEST-FON-001',
    )!;

    // Unauthenticated import is rejected.
    const anon = await request(app).post(
      `/api/v1/external-opportunities/${target.id}/import`,
    );
    expect(anon.status).toBe(401);

    // Applicant imports the opportunity.
    const importRes = await request(app)
      .post(`/api/v1/external-opportunities/${target.id}/import`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(importRes.status).toBe(201);
    expect(importRes.body.opportunity_id).toBeTruthy();
    expect(importRes.body.workspace_url).toContain(importRes.body.opportunity_id);
    expect(importRes.body.already_imported).toBe(false);

    const internalId = importRes.body.opportunity_id as string;

    // Internal opportunity is pre-populated from the external source.
    const internal = await pool.query(
      `SELECT title, opportunity_number, funding_amount_max, funding_amount_min,
              eligibility_summary, application_close_date, source, external_opportunity_id, status
         FROM opportunities WHERE opportunity_id = $1`,
      [internalId],
    );
    expect(internal.rows.length).toBe(1);
    const row = internal.rows[0];
    expect(row.title).toBe('Community Health Innovation Grant');
    expect(row.opportunity_number).toBe('TEST-FON-001');
    expect(Number(row.funding_amount_max)).toBe(500000);
    expect(Number(row.funding_amount_min)).toBe(50000);
    expect(row.eligibility_summary).toContain('Nonprofits');
    expect(row.application_close_date).toBeTruthy();
    expect(row.source).toBe('grants_gov_import');
    expect(row.external_opportunity_id).toBe(target.id);
    expect(row.status).toBe('imported');

    // OPPORTUNITY_IMPORTED audit event was emitted.
    const audit = await pool.query(
      `SELECT payload FROM audit_events
        WHERE event_type = 'OPPORTUNITY_IMPORTED' AND entity_id = $1`,
      [internalId],
    );
    expect(audit.rows.length).toBe(1);
    expect(audit.rows[0].payload.source_opportunity_number).toBe('TEST-FON-001');

    // Re-import is idempotent: returns the same internal record (200).
    const reimport = await request(app)
      .post(`/api/v1/external-opportunities/${target.id}/import`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(reimport.status).toBe(200);
    expect(reimport.body.opportunity_id).toBe(internalId);
    expect(reimport.body.already_imported).toBe(true);

    // Cleanup this test's internal artifacts.
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    await pool.query(`DELETE FROM audit_events WHERE entity_id = $1`, [internalId]);
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');
    await pool.query(`DELETE FROM opportunities WHERE opportunity_id = $1`, [internalId]);
    await pool.query(
      `DELETE FROM programs WHERE grantor_org_id IN
         (SELECT org_id FROM grantor_organizations WHERE org_name = 'Grants.gov Imports')`,
    );
    await pool.query(`DELETE FROM grantor_organizations WHERE org_name = 'Grants.gov Imports'`);
  });
});
