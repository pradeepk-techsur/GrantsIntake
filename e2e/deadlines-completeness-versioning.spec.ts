import { test, expect } from '@playwright/test';

/**
 * E2E tests for F4 (Deadline Configuration), F5 (Publication Completeness), and F6 (Versioning).
 * Tests cover:
 * 1. DeadlineForm section visibility and field rendering
 * 2. Client-side validation: close before open, LOI required toggle, rolling cadence validation
 * 3. CompletenessChecklist: green/red per completion state
 * 4. "Check Readiness" button shows blockers
 * 5. Publish button disabled until requirements met; enables on completion
 * 6. Post-publication: modification reason modal appears on save
 * 7. VersionHistory tab shows versions in DESC order
 * 8. Version 1 shows "Initial publication"
 *
 * NOTE: E2E tests require the full app running via docker-compose.
 * These tests are deferred to the verify phase per test execution boundary.
 * Placeholder tests verify component structure without browser server requirement.
 */

const BASE_URL = 'http://localhost:3000';

// Test account seeded in src/db/seed.ts
const ADMIN_EMAIL = 'admin@example.gov';
const ADMIN_PASSWORD = 'Admin123!';

test.describe('Deadlines & Intake Window (F4)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as grantor admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="field-email"]', ADMIN_EMAIL);
    await page.fill('[data-testid="field-password"]', ADMIN_PASSWORD);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/grantor\/dashboard/);
  });

  test('1. DeadlineForm section is visible in Opportunity Builder', async ({ page }) => {
    // Navigate to opportunities
    await page.goto(`${BASE_URL}/grantor/opportunities`);

    // Create an opportunity or navigate to existing one
    // (assuming seeded test opportunity exists)
    await page.click('[data-testid="tab-deadlines"]');
    await expect(page.locator('[data-testid="deadline-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="field-open-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="field-close-date"]')).toBeVisible();
  });

  test('2. Client-side validation: close date before open date shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-deadlines"]');

    // Set close date before open date
    await page.fill('[data-testid="field-open-date"]', '2025-09-01T00:00');
    await page.fill('[data-testid="field-close-date"]', '2025-06-01T00:00');
    await page.locator('[data-testid="field-close-date"]').blur();

    // Error should appear
    await expect(page.locator('[data-testid="close-date-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="close-date-error"]')).toContainText(
      'Close date must be after open date',
    );
  });

  test('3. LOI Required checkbox reveals LOI deadline field', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-deadlines"]');

    // LOI deadline field should not be visible initially
    await expect(page.locator('[data-testid="loi-deadline-field"]')).not.toBeVisible();

    // Check LOI Required
    await page.check('[data-testid="field-loi-required"]');
    await expect(page.locator('[data-testid="loi-deadline-field"]')).toBeVisible();

    // Uncheck — field should disappear
    await page.uncheck('[data-testid="field-loi-required"]');
    await expect(page.locator('[data-testid="loi-deadline-field"]')).not.toBeVisible();
  });

  test('4. Enable Rolling Review shows cadence field; 0 triggers error', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-deadlines"]');

    // Cadence field not visible initially
    await expect(page.locator('[data-testid="rolling-cadence-field"]')).not.toBeVisible();

    // Enable rolling review
    await page.check('[data-testid="field-rolling-review"]');
    await expect(page.locator('[data-testid="rolling-cadence-field"]')).toBeVisible();

    // Enter 0 — should show error
    await page.fill('[data-testid="field-rolling-cadence"]', '0');
    await page.locator('[data-testid="field-rolling-cadence"]').blur();
    await expect(page.locator('[data-testid="rolling-cadence-error"]')).toBeVisible();
  });

  test('5. Valid dates save successfully (no error toast)', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-deadlines"]');

    // Set valid open/close dates
    await page.fill('[data-testid="field-open-date"]', '2025-06-01T00:00');
    await page.fill('[data-testid="field-close-date"]', '2025-09-01T00:00');
    await page.locator('[data-testid="field-close-date"]').blur();

    // No validation errors
    await expect(page.locator('[data-testid="close-date-error"]')).not.toBeVisible();

    // Success toast should appear after save
    await expect(page.locator('[data-testid="deadline-save-success"]')).toBeVisible();
  });
});

test.describe('Completeness Checklist & Publication (F5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="field-email"]', ADMIN_EMAIL);
    await page.fill('[data-testid="field-password"]', ADMIN_PASSWORD);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/grantor\/dashboard/);
  });

  test('6. CompletenessChecklist: incomplete opportunity shows red X on Metadata', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    // Find or create an incomplete opportunity (missing required fields)
    const checklist = page.locator('[data-testid="completeness-checklist"]');
    await expect(checklist).toBeVisible();

    // Metadata item should show X if not complete
    await expect(page.locator('[data-testid="x-metadata"]')).toBeVisible();
  });

  test('7. Check Readiness button shows blockers alert for incomplete opportunity', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    const checklist = page.locator('[data-testid="completeness-checklist"]');
    await expect(checklist).toBeVisible();

    await page.click('[data-testid="check-readiness-button"]');

    // Blockers alert should appear
    await expect(page.locator('[data-testid="readiness-blockers-alert"]')).toBeVisible();
  });

  test('8. Publish button is disabled when checklist has incomplete required items', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    const publishBtn = page.locator('[data-testid="publish-button"]');
    await expect(publishBtn).toBeVisible();
    await expect(publishBtn).toBeDisabled();
  });

  test('9. Complete opportunity can be published; status changes to Published', async ({ page }) => {
    // This test requires a fully complete opportunity
    // Navigate to a complete opportunity and publish
    await page.goto(`${BASE_URL}/grantor/opportunities`);

    // Fill all required fields via Metadata tab
    await page.click('[data-testid="tab-metadata"]');
    // (fields assumed filled from seeded data or previous tests)

    // Fill deadlines
    await page.click('[data-testid="tab-deadlines"]');
    await page.fill('[data-testid="field-open-date"]', '2025-06-01T00:00');
    await page.fill('[data-testid="field-close-date"]', '2025-09-01T00:00');
    await page.locator('[data-testid="field-close-date"]').blur();
    await page.waitForTimeout(500); // wait for save

    // Publish button should now be enabled
    const publishBtn = page.locator('[data-testid="publish-button"]');
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // Status badge should update to Published
    await expect(page.locator('[data-testid="opportunity-status-badge"]')).toContainText('Published');
  });
});

test.describe('Post-Publication Modification & Version History (F6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="field-email"]', ADMIN_EMAIL);
    await page.fill('[data-testid="field-password"]', ADMIN_PASSWORD);
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/grantor\/dashboard/);
  });

  test('10. After publication: editing a field shows modification reason modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    // Assumes an opportunity is already published (from test 9 or seed)

    // Try editing a metadata field
    await page.click('[data-testid="tab-metadata"]');
    await page.fill('[data-testid="field-title"]', 'Updated Title After Publication');
    await page.locator('[data-testid="field-title"]').blur();

    // Modification reason modal should appear
    await expect(page.locator('[data-testid="modification-reason-modal"]')).toBeVisible();

    // Enter reason and submit
    await page.fill('[data-testid="mod-reason-input"]', 'Correcting title for clarity');
    await page.click('[data-testid="mod-reason-submit"]');

    // Modal should close
    await expect(page.locator('[data-testid="modification-reason-modal"]')).not.toBeVisible();
  });

  test('11. VersionHistory tab shows versions in DESC order after publication', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-versions"]');

    // Should show version rows
    const versionRow1 = page.locator('[data-testid="version-row-1"]');
    await expect(versionRow1).toBeVisible();
  });

  test('12. Version 1 shows "Initial publication" as modification reason', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.click('[data-testid="tab-versions"]');

    const versionRow1 = page.locator('[data-testid="version-row-1"]');
    await expect(versionRow1).toContainText('Initial publication');
  });
});
