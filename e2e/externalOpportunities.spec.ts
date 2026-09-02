import { test, expect } from '@playwright/test';

/**
 * Grants.gov external opportunity browser — Applicant e2e tests (Plan 08-02).
 *
 * Uses seeded applicant credentials: applicant@example.com / TestPass123!
 * All /api/v1/external-opportunities calls are mocked via Playwright route
 * handlers so the tests do not depend on Grants.gov ingestion having run.
 *
 * Navigation uses window.history.pushState + PopStateEvent to preserve the
 * Zustand in-memory access token across route changes (established pattern).
 *
 * PRD-INTAKE-019C/019D/019E.
 */

const APPLICANT_EMAIL = 'applicant@example.com';
const APPLICANT_PASS = 'TestPass123!';

const OPP_ID = '11111111-1111-4111-8111-111111111111';

const MOCK_OPP = {
  id: OPP_ID,
  source: 'grants.gov',
  source_url: 'https://grants.gov/opp/ABC-123',
  source_opportunity_number: 'ABC-123',
  source_assistance_listing: '93.243',
  api_reference: {},
  import_timestamp: '2026-09-01T10:00:00Z',
  last_fetched_at: '2026-09-02T04:00:00Z',
  title: 'Community Health Innovation Grant',
  agency: 'Department of Health and Human Services',
  opportunity_status: 'posted',
  eligibility_summary: 'Nonprofit organizations with 501(c)(3) status are eligible.',
  due_date: '2026-11-30',
  award_ceiling: 500000,
  award_floor: 50000,
  application_package_url: 'https://grants.gov/package/ABC-123',
  raw_metadata: {},
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-02T04:00:00Z',
  // The detail response carries versions[] inline (Plan 08-05 source-attribution
  // contract); the detail page reads opp.versions, not the /versions endpoint.
  versions: [
    {
      id: 'v1',
      external_opportunity_id: OPP_ID,
      version_number: 1,
      changed_fields: [],
      snapshot: {},
      fetched_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'v2',
      external_opportunity_id: OPP_ID,
      version_number: 2,
      changed_fields: ['due_date'],
      snapshot: {},
      fetched_at: '2026-09-02T04:00:00Z',
    },
  ],
};

const MOCK_FORECASTED = {
  ...MOCK_OPP,
  id: '22222222-2222-4222-8222-222222222222',
  source_opportunity_number: 'DEF-456',
  title: 'Forecasted Research Program',
  opportunity_status: 'forecasted',
};

const MOCK_LIST_RESPONSE = {
  items: [MOCK_OPP, MOCK_FORECASTED],
  total: 2,
  page: 1,
  limit: 25,
};

const MOCK_POSTED_ONLY = {
  items: [MOCK_OPP],
  total: 1,
  page: 1,
  limit: 25,
};

const MOCK_VERSIONS = {
  versions: [
    {
      id: 'v1',
      external_opportunity_id: OPP_ID,
      version_number: 1,
      changed_fields: [],
      snapshot: {},
      fetched_at: '2026-09-01T10:00:00Z',
    },
    {
      id: 'v2',
      external_opportunity_id: OPP_ID,
      version_number: 2,
      changed_fields: ['due_date'],
      snapshot: {},
      fetched_at: '2026-09-02T04:00:00Z',
    },
  ],
};

const MOCK_ALERTS = {
  alerts: [
    {
      id: 'alert-1',
      user_id: 'user-1',
      external_opportunity_id: OPP_ID,
      alert_type: 'due_date_change',
      previous_value: '2026-11-15',
      new_value: '2026-11-30',
      is_read: false,
      created_at: '2026-09-02T04:00:00Z',
    },
  ],
};

const EMPTY_ALERTS = { alerts: [] };
const EMPTY_SAVED = { items: [] };

async function loginAndNavigate(
  page: import('@playwright/test').Page,
  targetPath: string,
) {
  await page.goto('/login');
  await page.fill('[name="email"]', APPLICANT_EMAIL);
  await page.fill('[name="password"]', APPLICANT_PASS);
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**', { timeout: 10000 }).catch(() => {});

  await page.evaluate((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(800);
}

test.describe('Grants.gov browser — Applicant', () => {
  test('can navigate to Browse Grants.gov page', async ({ page }) => {
    await page.route('**/api/v1/external-opportunities/saved', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_SAVED) }),
    );
    await page.route('**/api/v1/external-opportunities/alerts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_ALERTS) }),
    );
    await page.route('**/api/v1/external-opportunities?**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LIST_RESPONSE) }),
    );

    await loginAndNavigate(page, '/applicant/grants-gov');

    await expect(
      page.getByRole('heading', { name: 'Browse Grants.gov Opportunities', level: 1 }),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('source-attribution-badge')).toBeVisible();
    await expect(page.getByTestId('external-opportunity-card')).toHaveCount(2);
  });

  test('filter by status=posted returns filtered results', async ({ page }) => {
    await page.route('**/api/v1/external-opportunities/saved', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_SAVED) }),
    );
    await page.route('**/api/v1/external-opportunities/alerts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_ALERTS) }),
    );
    await page.route('**/api/v1/external-opportunities?**', (route) => {
      const url = route.request().url();
      const body = url.includes('status=posted') ? MOCK_POSTED_ONLY : MOCK_LIST_RESPONSE;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await loginAndNavigate(page, '/applicant/grants-gov');
    await expect(page.getByTestId('external-opportunity-card')).toHaveCount(2);

    await page.getByTestId('filter-status-posted').check();
    await page.getByTestId('apply-filters').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('external-opportunity-card')).toHaveCount(1);
  });

  test('save button toggles saved state and persists', async ({ page }) => {
    let savedState = false;
    await page.route('**/api/v1/external-opportunities/saved', (route) => {
      const body = savedState ? { items: [MOCK_OPP] } : EMPTY_SAVED;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.route('**/api/v1/external-opportunities/alerts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_ALERTS) }),
    );
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}/save`, (route) => {
      savedState = route.request().method() === 'POST';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.route('**/api/v1/external-opportunities?**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_POSTED_ONLY) }),
    );

    await loginAndNavigate(page, '/applicant/grants-gov');

    const saveBtn = page.getByTestId('external-opportunity-save').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await expect(saveBtn).toContainText('Save');

    await saveBtn.click();
    await page.waitForTimeout(600);

    expect(savedState).toBe(true);
    await expect(page.getByTestId('external-opportunity-save').first()).toContainText('Saved');
  });

  test('alert bell shows unread count when alerts exist', async ({ page }) => {
    await page.route('**/api/v1/external-opportunities/saved', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_SAVED) }),
    );
    await page.route('**/api/v1/external-opportunities/alerts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ALERTS) }),
    );
    await page.route('**/api/v1/external-opportunities?**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LIST_RESPONSE) }),
    );

    await loginAndNavigate(page, '/applicant/grants-gov');

    await expect(page.getByTestId('alerts-unread-count')).toHaveText('1', { timeout: 5000 });

    await page.getByTestId('alerts-bell-button').click();
    await expect(page.getByTestId('alerts-dropdown')).toBeVisible();
    await expect(page.getByTestId('alert-item')).toHaveCount(1);
    await expect(page.getByTestId('alert-item')).toContainText('Due date changed');
  });

  test('detail page shows version history accordion and source attribution', async ({ page }) => {
    await page.route('**/api/v1/external-opportunities/saved', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_SAVED) }),
    );
    await page.route('**/api/v1/external-opportunities/alerts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_ALERTS) }),
    );
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}/versions`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VERSIONS) }),
    );
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OPP) }),
    );

    await loginAndNavigate(page, `/applicant/grants-gov/${OPP_ID}`);

    await expect(page.getByTestId('detail-title')).toContainText('Community Health Innovation Grant');

    // Source attribution visible
    await expect(page.getByTestId('source-attribution')).toContainText('Source: Grants.gov API');
    await expect(page.getByTestId('source-attribution')).toContainText('ABC-123');

    // Version history accordion
    await page.getByTestId('version-history-toggle').click();
    await expect(page.getByTestId('version-history-panel')).toBeVisible();
    await expect(page.getByTestId('version-history-item')).toHaveCount(2);
  });

  test('imports a Grants.gov opportunity and surfaces it on /applicant/applications with success banner and badge (PRD-INTAKE-019C, uat/5)', async ({
    page,
  }) => {
    const INTERNAL_ID = '33333333-3333-4333-8333-333333333333';
    let importCount = 0;

    // The imported-list surface always returns EXACTLY ONE item for this
    // opportunity regardless of how many imports fire (asserts no-duplicate).
    const IMPORTED_LIST = {
      items: [
        {
          opportunity_id: INTERNAL_ID,
          title: 'Community Health Innovation Grant',
          funder_name: 'Department of Health and Human Services',
          program_area: 'Federal Grants',
          max_award_amount: 500000,
          application_close_date: '2026-11-30',
          status_badge: 'open',
          source: 'grants_gov_import',
          import_timestamp: '2026-09-02T10:00:00Z',
        },
      ],
    };

    // Detail page fetches the external opportunity.
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}/versions`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_VERSIONS) }),
    );
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_OPP) }),
    );

    // Import endpoint: first POST → 201 (fresh); second → 200 already_imported.
    await page.route(`**/api/v1/external-opportunities/${OPP_ID}/import`, (route) => {
      importCount += 1;
      const alreadyImported = importCount > 1;
      return route.fulfill({
        status: alreadyImported ? 200 : 201,
        contentType: 'application/json',
        body: JSON.stringify({
          opportunity_id: INTERNAL_ID,
          workspace_url: `/applicant/workspaces?opportunity_id=${INTERNAL_ID}`,
          already_imported: alreadyImported,
        }),
      });
    });

    // Imported list surfaced on the applications page.
    await page.route('**/api/v1/external-opportunities/imported', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(IMPORTED_LIST) }),
    );

    // Applications page's other queries: empty workspaces + empty saved list.
    await page.route('**/api/v1/workspaces', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
    await page.route('**/api/v1/external-opportunities/saved', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_SAVED) }),
    );

    // ── Import (first time) ──────────────────────────────────────────────
    await loginAndNavigate(page, `/applicant/grants-gov/${OPP_ID}`);
    await expect(page.getByTestId('detail-title')).toContainText(
      'Community Health Innovation Grant',
    );

    await page.getByTestId('import-to-workspace').click();
    await expect(page.getByTestId('import-confirm-modal')).toBeVisible();
    await page.getByTestId('import-confirm-submit').click();

    // Lands on /applicant/applications (handler navigates after ~1200ms,
    // carrying router state { importedFromGrantsGov: true } which WorkspaceListPage
    // reads via useLocation to show the success banner).
    await page.waitForURL('**/applicant/applications', { timeout: 5000 });

    // Success banner + imported card with badge.
    await expect(page.getByTestId('import-success-banner')).toBeVisible();
    await expect(page.getByTestId('import-success-banner')).toContainText(
      /imported successfully/i,
    );
    await expect(page.getByTestId('imported-opportunity-card')).toHaveCount(1);
    await expect(page.getByTestId('imported-badge').first()).toContainText(
      'Imported from Grants.gov',
    );

    // ── Re-import (no duplicate) ─────────────────────────────────────────
    await page.evaluate((path: string) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, `/applicant/grants-gov/${OPP_ID}`);
    await page.waitForTimeout(800);

    await expect(page.getByTestId('import-to-workspace')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('import-to-workspace').click();
    await expect(page.getByTestId('import-confirm-modal')).toBeVisible();
    await page.getByTestId('import-confirm-submit').click();

    await page.waitForURL('**/applicant/applications', { timeout: 5000 });

    // Still exactly one imported card — the idempotency truth at the surface.
    await expect(page.getByTestId('imported-opportunity-card')).toHaveCount(1);

    expect(importCount).toBe(2);
  });
});
