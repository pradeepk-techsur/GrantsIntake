import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import request from 'supertest';
import { app, finalizeApp } from '../../src/server';
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';
import { externalOpportunityService } from '../../src/services/external/externalOpportunityService';
import { ingestionScheduler } from '../../src/services/external/ingestionScheduler';

finalizeApp();

// ─── Source attribution, version-history immutability & audit trail ──────────
// PRD-INTAKE-019E (Plan 08-05). Drives the scheduler's refreshAll() against a
// mocked Grants.gov API (Node global fetch stubbed via vi.stubGlobal — the
// established pattern since nock cannot intercept undici) and asserts that:
//   1. every attribution field is preserved and non-null on first ingest,
//   2. import_timestamp is set once and never modified by a later refresh,
//   3. last_fetched_at IS updated on every fetch,
//   4. version V1 is immutable across re-ingests,
//   5. an EXTERNAL_OPPORTUNITY_IMPORTED audit event is written on first ingest.

const UNIQUE = `attr-${Date.now()}`;
const APPLICANT_EMAIL = `attr.applicant.${UNIQUE}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const FON = `ATTR-FON-${Date.now()}`;

let applicantToken: string;
let applicantUserId: string;

const SEARCH_HIT = {
  id: '960001',
  number: FON,
  title: 'Attribution Coverage Grant',
  agencyName: 'Department of Attribution',
  oppStatus: 'posted',
  closeDate: '10/15/2026',
  cfdaList: ['12.345'],
};

// Base detail (v1).
function detailV1() {
  return {
    id: '960001',
    opportunityId: '960001',
    opportunityNumber: FON,
    opportunityTitle: 'Attribution Coverage Grant',
    agencyName: 'Department of Attribution',
    opportunityStatus: 'posted',
    closeDate: '10/15/2026',
    awardCeiling: '250000',
    awardFloor: '25000',
    cfdaNumbers: ['12.345'],
    eligibilityTypes: ['Nonprofits'],
    applicantEligibilityDesc: 'Open to eligible nonprofits.',
    packages: [
      {
        packageURL:
          'https://apply07.grants.gov/apply/opportunities/instructions/PKG-ATTR',
      },
    ],
  };
}

// v2: due_date + status changed → a genuine refresh (new version + refresh audit).
function detailV2() {
  return { ...detailV1(), closeDate: '09/30/2026', opportunityStatus: 'closed' };
}

function makeMockFetch(detail: () => Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    // Search: POST to the corrected /search2 path (must NOT match the old 403
    // path /search2/opportunities/search).
    if (init?.method === 'POST' && /\/search2(\?|$)/.test(u)) {
      const startRecordNum = init?.body
        ? JSON.parse(init.body as string).startRecordNum ?? 0
        : 0;
      const body =
        startRecordNum === 0
          ? { data: { oppHits: [SEARCH_HIT] } }
          : { data: { oppHits: [] } };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Detail: POST to /fetchOpportunity (the live GET /opportunities/:id 403s).
    if (u.includes('/fetchOpportunity')) {
      return new Response(JSON.stringify({ data: detail() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.access_token;
}

async function cleanOpportunity() {
  // audit_events reference the external opp id but have no FK cascade to it;
  // remove them (disabling the immutability trigger) before deleting the opp.
  const ids = await pool.query<{ id: string }>(
    `SELECT id FROM external_opportunities WHERE source_opportunity_number = $1`,
    [FON],
  );
  if (ids.rows.length > 0) {
    const idList = ids.rows.map((r) => r.id);
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    await pool.query(
      `DELETE FROM audit_events WHERE entity_type = 'external_opportunity' AND entity_id = ANY($1)`,
      [idList],
    );
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');
  }
  await pool.query(
    `DELETE FROM external_opportunities WHERE source_opportunity_number = $1`,
    [FON],
  );
}

describe('External opportunity attribution, version immutability & audit (Plan 08-05)', () => {
  beforeAll(async () => {
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(TEST_PASSWORD, 12);

    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [
      APPLICANT_EMAIL,
    ]);
    if (existing.rows.length > 0) {
      const uid = existing.rows[0].user_id;
      await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [uid]);
      await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [uid]);
      await pool.query('DELETE FROM users WHERE user_id = $1', [uid]);
    }

    const res = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active)
       VALUES ($1, $2, $3, true) RETURNING user_id`,
      [APPLICANT_EMAIL, 'Attribution Applicant', hash],
    );
    applicantUserId = res.rows[0].user_id;
    applicantToken = await loginUser(APPLICANT_EMAIL, TEST_PASSWORD);
  });

  beforeEach(async () => {
    await cleanOpportunity();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await cleanOpportunity();
    ingestionScheduler.stop();
    await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [applicantUserId]);
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [
      applicantUserId,
    ]);
    await pool.query('ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable');
    await pool.query('DELETE FROM audit_events WHERE actor_user_id = $1', [applicantUserId]);
    await pool.query('ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable');
    await pool.query('DELETE FROM users WHERE user_id = $1', [applicantUserId]);
    await closeRedisClient();
    await pool.end();
  });

  // ── Attribution fields present & non-null (Task 1) ──────────────────────────
  it('exposes all attribution fields non-null after initial ingest (detail endpoint)', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find((o) => o.source_opportunity_number === FON)!;
    expect(target).toBeDefined();

    const res = await request(app).get(
      `/api/v1/external-opportunities/${target.id}`,
    );
    expect(res.status).toBe(200);
    // All five attribution fields present and non-null (PRD-INTAKE-019E).
    expect(res.body.source).toBeTruthy();
    expect(res.body.source_url).toBeTruthy();
    expect(res.body.source_opportunity_number).toBe(FON);
    expect(res.body.import_timestamp).toBeTruthy();
    expect(res.body.api_reference).toBeTruthy();
    expect(res.body.api_reference.opportunityNumber).toBe(FON);
    // Detail response carries the version history array.
    expect(Array.isArray(res.body.versions)).toBe(true);
    expect(res.body.versions.length).toBe(1);
  });

  // ── import_timestamp immutable; last_fetched_at updated (Task 5) ────────────
  it('preserves import_timestamp across refreshes while updating last_fetched_at', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const first = await pool.query(
      `SELECT import_timestamp, last_fetched_at FROM external_opportunities
        WHERE source_opportunity_number = $1`,
      [FON],
    );
    const importTs = new Date(first.rows[0].import_timestamp).getTime();
    const firstFetch = new Date(first.rows[0].last_fetched_at).getTime();

    // Small delay so timestamps are distinguishable, then a changed refresh.
    await new Promise((r) => setTimeout(r, 25));
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    await ingestionScheduler.refreshAll();

    const second = await pool.query(
      `SELECT import_timestamp, last_fetched_at FROM external_opportunities
        WHERE source_opportunity_number = $1`,
      [FON],
    );
    const importTs2 = new Date(second.rows[0].import_timestamp).getTime();
    const secondFetch = new Date(second.rows[0].last_fetched_at).getTime();

    // import_timestamp is the first-import time and must never change.
    expect(importTs2).toBe(importTs);
    // last_fetched_at IS updated on every fetch.
    expect(secondFetch).toBeGreaterThan(firstFetch);
  });

  // ── Version V1 is immutable across re-ingests (Task 5) ──────────────────────
  it('never overwrites version V1 when the same opportunity is re-ingested', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find((o) => o.source_opportunity_number === FON)!;

    const v1Before = await externalOpportunityService.getVersionHistory(target.id);
    expect(v1Before.length).toBe(1);
    expect(v1Before[0].version_number).toBe(1);
    expect(v1Before[0].changed_fields).toEqual([]);
    const v1Id = v1Before[0].id;
    const v1FetchedAt = new Date(v1Before[0].fetched_at).getTime();

    // A refresh with real changes: adds V2 but must leave V1 untouched.
    await new Promise((r) => setTimeout(r, 25));
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    await ingestionScheduler.refreshAll();

    const after = await externalOpportunityService.getVersionHistory(target.id);
    expect(after.length).toBe(2);
    // V1 row unchanged (same id, same fetched_at, still empty changed_fields).
    const v1After = after.find((v) => v.version_number === 1)!;
    expect(v1After.id).toBe(v1Id);
    expect(new Date(v1After.fetched_at).getTime()).toBe(v1FetchedAt);
    expect(v1After.changed_fields).toEqual([]);
    // V2 carries the diff.
    const v2 = after.find((v) => v.version_number === 2)!;
    expect(v2.changed_fields).toContain('due_date');
    expect(v2.changed_fields).toContain('opportunity_status');
  });

  // ── EXTERNAL_OPPORTUNITY_IMPORTED audit on first ingest (Task 4/5) ──────────
  it('writes an EXTERNAL_OPPORTUNITY_IMPORTED audit event on first ingest and REFRESHED on change', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find((o) => o.source_opportunity_number === FON)!;

    const imported = await pool.query(
      `SELECT actor_user_id, entity_type, payload FROM audit_events
        WHERE event_type = 'EXTERNAL_OPPORTUNITY_IMPORTED' AND entity_id = $1`,
      [target.id],
    );
    expect(imported.rows.length).toBe(1);
    expect(imported.rows[0].entity_type).toBe('external_opportunity');
    // Scheduler-driven events have no actor.
    expect(imported.rows[0].actor_user_id).toBeNull();
    expect(imported.rows[0].payload.source_opportunity_number).toBe(FON);

    // A changed refresh emits EXTERNAL_OPPORTUNITY_REFRESHED (not a 2nd IMPORTED).
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    await ingestionScheduler.refreshAll();

    const importedAgain = await pool.query(
      `SELECT count(*)::int AS n FROM audit_events
        WHERE event_type = 'EXTERNAL_OPPORTUNITY_IMPORTED' AND entity_id = $1`,
      [target.id],
    );
    expect(importedAgain.rows[0].n).toBe(1);

    const refreshed = await pool.query(
      `SELECT payload FROM audit_events
        WHERE event_type = 'EXTERNAL_OPPORTUNITY_REFRESHED' AND entity_id = $1`,
      [target.id],
    );
    expect(refreshed.rows.length).toBe(1);
    expect(refreshed.rows[0].payload.changed_fields).toContain('due_date');
  });

  // ── EXTERNAL_OPPORTUNITY_SAVED audit on user save (Task 4/5) ────────────────
  it('writes an EXTERNAL_OPPORTUNITY_SAVED audit event (with actor) on first save only', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find((o) => o.source_opportunity_number === FON)!;

    const saveRes = await request(app)
      .post(`/api/v1/external-opportunities/${target.id}/save`)
      .set('Authorization', `Bearer ${applicantToken}`);
    expect(saveRes.status).toBe(201);

    // Idempotent re-save must not create a second audit event.
    await request(app)
      .post(`/api/v1/external-opportunities/${target.id}/save`)
      .set('Authorization', `Bearer ${applicantToken}`);

    const saved = await pool.query(
      `SELECT actor_user_id, entity_type FROM audit_events
        WHERE event_type = 'EXTERNAL_OPPORTUNITY_SAVED' AND entity_id = $1`,
      [target.id],
    );
    expect(saved.rows.length).toBe(1);
    expect(saved.rows[0].entity_type).toBe('external_opportunity');
    expect(saved.rows[0].actor_user_id).toBe(applicantUserId);

    // Cleanup this test's save + alert artifacts.
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [
      applicantUserId,
    ]);
  });
});
