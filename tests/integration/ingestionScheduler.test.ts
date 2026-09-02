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
import { pool } from '../../src/db/client';
import { closeRedisClient } from '../../src/services/auth/tokenService';
import { externalOpportunityService } from '../../src/services/external/externalOpportunityService';
import { ingestionScheduler } from '../../src/services/external/ingestionScheduler';

// ─── Setup ───────────────────────────────────────────────────────────────────
// This test drives the scheduler's refreshAll() against a mocked Grants.gov API
// and asserts the scheduled-refresh → change-detection → alert-delivery pipeline
// (Plan 08-04 Task 4 / PRD-INTAKE-019D). The service uses Node global fetch
// (undici); nock cannot intercept it, so we stub fetch via vi.stubGlobal
// (established pattern from Plan 08-01).

const UNIQUE_ID = `sched-${Date.now()}`;
const SAVER_EMAIL = `sched.saver.${UNIQUE_ID}@example.com`;
const FON = `SCHED-FON-${Date.now()}`;

let saverUserId: string;

const SEARCH_HIT = {
  id: '950001',
  number: FON,
  title: 'Scheduled Refresh Test Grant',
  agencyName: 'Department of Testing',
  oppStatus: 'posted',
  closeDate: '11/01/2026',
  cfdaList: ['00.001'],
};

// Base detail (v1): due_date 2026-11-01.
function detailV1() {
  return {
    id: '950001',
    opportunityId: '950001',
    opportunityNumber: FON,
    opportunityTitle: 'Scheduled Refresh Test Grant',
    agencyName: 'Department of Testing',
    opportunityStatus: 'posted',
    closeDate: '11/01/2026',
    awardCeiling: '100000',
    awardFloor: '10000',
    cfdaNumbers: ['00.001'],
    eligibilityTypes: ['Nonprofits'],
    applicantEligibilityDesc: 'Open to eligible nonprofits.',
    synopsis: { synopsisAddendum: 'Original addendum text.' },
    packages: [
      {
        packageURL: 'https://apply07.grants.gov/apply/opportunities/instructions/PKG-A',
        instructions: 'Original instructions.',
      },
    ],
  };
}

// v2: due_date moved to 2026-12-01 (only tracked change here).
function detailV2() {
  return { ...detailV1(), closeDate: '12/01/2026' };
}

// v3: synopsis addendum + package instructions changed.
function detailV3() {
  return {
    ...detailV1(),
    synopsis: { synopsisAddendum: 'Updated addendum text.' },
    packages: [
      {
        packageURL: 'https://apply07.grants.gov/apply/opportunities/instructions/PKG-A',
        instructions: 'Revised instructions.',
      },
    ],
  };
}

function makeMockFetch(detail: () => Record<string, unknown>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = typeof url === 'string' ? url : url.toString();
    if (u.includes('/search2/opportunities/search')) {
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
    if (u.includes('/opportunities/')) {
      return new Response(JSON.stringify({ data: detail() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('not found', { status: 404 });
  });
}

async function cleanOpportunity() {
  await pool.query(
    `DELETE FROM external_opportunities WHERE source_opportunity_number = $1`,
    [FON],
  );
}

describe('IngestionScheduler — scheduled refresh & change alerts (Plan 08-04)', () => {
  beforeAll(async () => {
    const res = await pool.query<{ user_id: string }>(
      `INSERT INTO users (email, full_name, password_hash, is_active)
       VALUES ($1, $2, $3, true) RETURNING user_id`,
      [SAVER_EMAIL, 'Scheduler Saver', 'x'],
    );
    saverUserId = res.rows[0].user_id;
  });

  beforeEach(async () => {
    await cleanOpportunity();
    await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [saverUserId]);
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [
      saverUserId,
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await cleanOpportunity();
    ingestionScheduler.stop();
    await pool.query('DELETE FROM change_alerts WHERE user_id = $1', [saverUserId]);
    await pool.query('DELETE FROM saved_external_opportunities WHERE user_id = $1', [
      saverUserId,
    ]);
    await pool.query('DELETE FROM users WHERE user_id = $1', [saverUserId]);
    await closeRedisClient();
    await pool.end();
  });

  it('creates a due_date_change alert for savers and a version diff when refreshAll re-fetches a changed due_date', async () => {
    // 1. First refresh seeds v1 (due_date = 2026-11-01)
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    const first = await ingestionScheduler.refreshAll();
    expect(first.upserted).toBe(1);

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find(
      (o) => o.source_opportunity_number === FON,
    )!;
    expect(target).toBeDefined();
    expect(target.due_date).toBe('2026-11-01');

    // 2. Saver tracks the opportunity so they receive alerts
    await externalOpportunityService.saveOpportunity(saverUserId, target.id);

    // 3. Second refresh returns updated due_date = 2026-12-01
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    const second = await ingestionScheduler.refreshAll();
    expect(second.upserted).toBe(1);

    // 4. change_alerts row created for the saver
    const alerts = await externalOpportunityService.getUnreadAlerts(saverUserId);
    const dueAlert = alerts.find((a) => a.alert_type === 'due_date_change');
    expect(dueAlert).toBeDefined();
    expect(dueAlert!.previous_value).toBe('2026-11-01');
    expect(dueAlert!.new_value).toBe('2026-12-01');

    // 5. version row captures the changed_fields diff
    const versions = await externalOpportunityService.getVersionHistory(target.id);
    expect(versions.length).toBe(2);
    expect(versions[1].changed_fields).toContain('due_date');
  });

  it('raises addenda_change and instructions_change alerts when raw_metadata changes', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    const listed = await externalOpportunityService.listOpportunities({});
    const target = listed.items.find(
      (o) => o.source_opportunity_number === FON,
    )!;
    await externalOpportunityService.saveOpportunity(saverUserId, target.id);

    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV3));
    await ingestionScheduler.refreshAll();

    const alerts = await externalOpportunityService.getUnreadAlerts(saverUserId);
    const types = alerts.map((a) => a.alert_type);
    expect(types).toContain('addenda_change');
    expect(types).toContain('instructions_change');

    const versions = await externalOpportunityService.getVersionHistory(target.id);
    expect(versions[1].changed_fields).toContain('synopsis_addendum');
    expect(versions[1].changed_fields).toContain('package_instructions');
  });

  it('does not create alerts for users who have not saved the opportunity', async () => {
    vi.stubGlobal('fetch', makeMockFetch(detailV1));
    await ingestionScheduler.refreshAll();

    // No save this time.
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', makeMockFetch(detailV2));
    await ingestionScheduler.refreshAll();

    const alerts = await externalOpportunityService.getUnreadAlerts(saverUserId);
    expect(alerts.length).toBe(0);
  });
});
