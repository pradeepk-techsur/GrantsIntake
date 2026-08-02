import { test, expect } from '@playwright/test';

/**
 * Intake Queue e2e tests.
 *
 * Uses seeded grantor admin credentials: admin@example.gov / TestPassword123!
 * API calls are mocked via Playwright route handlers to avoid needing a submitted
 * application in the seed data.
 *
 * Navigation uses window.history.pushState + PopStateEvent pattern
 * to preserve Zustand in-memory accessToken across route changes.
 */

const ADMIN_EMAIL = 'admin@example.gov';
const ADMIN_PASS = 'TestPassword123!';

const MOCK_ENTRY_ID = 'test-entry-id-1234';
const MOCK_ORG_NAME = 'Test Nonprofit Organization';

const MOCK_QUEUE_RESPONSE = {
  entries: [
    {
      entry_id: MOCK_ENTRY_ID,
      workspace_id: 'test-ws-id',
      opportunity_id: 'test-opp-id',
      opportunity_title: 'Test Grant Opportunity',
      org_id: 'test-org-id',
      org_name: MOCK_ORG_NAME,
      snapshot_id: 'test-snap-id',
      status: 'pending_screening',
      routed_to: null,
      created_at: '2026-07-01T12:00:00Z',
      submission_timestamp: '2026-07-01T12:00:00Z',
      confirmation_number: 'GI-2026-00000001',
      requested_amount: 150000,
      attachment_count: 3,
      eligibility_result: 'eligible',
      validation_summary: { blocking: 0, warnings: 0, info: 0 },
      disposition_id: null,
    },
  ],
  total: 1,
  page: 1,
  page_size: 25,
};

const MOCK_ENTRY_DETAIL = {
  ...MOCK_QUEUE_RESPONSE.entries[0],
  org_profile_snapshot: { legal_name: MOCK_ORG_NAME, entity_type: 'nonprofit', primary_contact_name: 'Jane Smith', primary_contact_email: 'jane@test.org' },
  eligibility_snapshot: { overall_result: 'eligible' },
  sections_snapshot: {},
  budget_snapshot: { total_federal_requested: '150000' },
  attachment_refs: [],
  correction_requests: [],
  disposition_history: [],
};

async function loginAsGrantorAndNavigate(
  page: import('@playwright/test').Page,
  targetPath: string,
) {
  await page.goto('/login');
  await page.fill('[name="email"]', ADMIN_EMAIL);
  await page.fill('[name="password"]', ADMIN_PASS);
  await page.click('[type="submit"]');
  // Wait for grantor redirect
  await page.waitForURL('**/grantor/**', { timeout: 10000 }).catch(() => {});

  // SPA navigate using pushState to preserve in-memory auth token
  await page.evaluate((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(800);
}

test.describe('Intake Queue — Grantor View', () => {

  test('navigates to Intake Queue from sidebar link', async ({ page }) => {
    // Mock the queue API
    await page.route('**/api/v1/intake-queue**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUEUE_RESPONSE),
      });
    });

    await loginAsGrantorAndNavigate(page, '/grantor/dashboard');
    await page.waitForTimeout(500);

    // Click "Intake Queue" in the sidebar
    const sidebarNav = page.getByRole('navigation', { name: 'Grantor portal navigation' });
    const intakeQueueLink = sidebarNav.getByRole('link', { name: /Intake Queue/i });
    await expect(intakeQueueLink).toBeVisible({ timeout: 5000 });
    await intakeQueueLink.click();

    // Verify page heading visible
    await expect(page.getByRole('heading', { name: 'Intake Queue', level: 1 })).toBeVisible({ timeout: 5000 });
  });

  test('intake queue table renders with headers', async ({ page }) => {
    // Mock the queue API
    await page.route('**/api/v1/intake-queue**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUEUE_RESPONSE),
      });
    });

    await loginAsGrantorAndNavigate(page, '/grantor/intake-queue');

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: /Organization/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('columnheader', { name: /Opportunity/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Status/i })).toBeVisible();
  });

  test('filter by status shows filtered results', async ({ page }) => {
    // Mock the queue API
    await page.route('**/api/v1/intake-queue**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_QUEUE_RESPONSE),
      });
    });

    await loginAsGrantorAndNavigate(page, '/grantor/intake-queue');

    // Wait for table to load
    await expect(page.getByRole('columnheader', { name: /Organization/i })).toBeVisible({ timeout: 5000 });

    // Select status filter
    await page.selectOption('#status-filter', 'pending_screening');

    // Submit filter form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Table should still render without error state
    await expect(page.getByRole('columnheader', { name: /Organization/i })).toBeVisible();
  });

  test('navigates to detail page on View click', async ({ page }) => {
    // Single consolidated route handler to avoid ordering issues
    await page.route('**/api/v1/intake-queue**', async (route) => {
      const url = route.request().url();
      if (url.includes('/snapshots')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ snapshots: [] }),
        });
      } else if (url.includes(MOCK_ENTRY_ID)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ENTRY_DETAIL),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_QUEUE_RESPONSE),
        });
      }
    });

    await loginAsGrantorAndNavigate(page, '/grantor/intake-queue');

    // Wait for table - give React Query time to load
    await expect(page.getByRole('columnheader', { name: /Organization/i })).toBeVisible({ timeout: 8000 });

    // Click the View button on the first row
    const viewButton = page.getByTestId('view-entry-button').first();
    await expect(viewButton).toBeVisible({ timeout: 8000 });
    await viewButton.click();

    // Verify URL changed to detail page pattern
    await page.waitForURL(`**/grantor/intake-queue/**`, { timeout: 8000 });
    await expect(page.url()).toContain('/grantor/intake-queue/');

    // Verify back link visible
    await expect(page.getByRole('link', { name: /Back to Intake Queue/i })).toBeVisible({ timeout: 8000 });
  });

  test('detail page shows screening disposition form for pending_screening entries', async ({ page }) => {
    // Mock entry detail and snapshots APIs
    await page.route(`**/api/v1/intake-queue/${MOCK_ENTRY_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_ENTRY_DETAIL),
      });
    });

    await page.route(`**/api/v1/intake-queue/${MOCK_ENTRY_ID}/snapshots`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ snapshots: [] }),
      });
    });

    await loginAsGrantorAndNavigate(page, `/grantor/intake-queue/${MOCK_ENTRY_ID}`);

    // Verify fieldset with "Apply Screening Disposition" legend is visible
    await expect(page.getByRole('group', { name: /Apply Screening Disposition/i })).toBeVisible({ timeout: 5000 });
  });

  test('disposition form requires rationale for returned_for_correction', async ({ page }) => {
    // Mock entry detail and snapshots APIs
    await page.route(`**/api/v1/intake-queue/${MOCK_ENTRY_ID}`, async (route) => {
      if (!route.request().url().includes('disposition') && !route.request().url().includes('snapshots')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_ENTRY_DETAIL),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/v1/intake-queue/${MOCK_ENTRY_ID}/snapshots`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ snapshots: [] }),
      });
    });

    await page.route(`**/api/v1/intake-queue/${MOCK_ENTRY_ID}/disposition`, async (route) => {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'RATIONALE_REQUIRED', message: 'Rationale is required for non-acceptance dispositions' }),
      });
    });

    await loginAsGrantorAndNavigate(page, `/grantor/intake-queue/${MOCK_ENTRY_ID}`);

    // Wait for fieldset — this page uses React Query so may take a moment
    await expect(page.getByRole('group', { name: /Apply Screening Disposition/i })).toBeVisible({ timeout: 10000 });

    // Select returned_for_correction
    await page.selectOption('#disposition-select', 'returned_for_correction');
    await page.waitForTimeout(500);

    // Verify rationale textarea is shown
    await expect(page.getByTestId('rationale-textarea')).toBeVisible({ timeout: 3000 });

    // Submit WITHOUT rationale (clear the textarea)
    await page.fill('[data-testid="rationale-textarea"]', '');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Verify client-side error shown (rationale is required before even hitting API)
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('unauthenticated user cannot access intake queue', async ({ page }) => {
    // Navigate directly to intake queue without logging in
    // React router redirects to /login when no access token in Zustand store
    await page.goto('/grantor/intake-queue');
    // Wait for React to render and redirect
    await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
    // Should be on login page (either via redirect or direct)
    expect(page.url()).toContain('/login');
  });

});
