import { test, expect } from '@playwright/test';

/**
 * E2E tests for the applicant-facing opportunity portal (PRD-INTAKE-013 to PRD-INTAKE-018).
 *
 * Prerequisites:
 * - App server running at http://localhost:3000 (via docker compose up)
 * - Seed data applied: at least one published opportunity with public_slug
 * - Seed data: admin@example.gov / TestPassword123! with grantor_admin role
 *
 * Tests:
 * 1. Opportunity list renders with filters (no auth required)
 * 2. Keyword search narrows results and adds active filter chip
 * 3. Detail page breadcrumbs and CTA (unauthenticated shows "Sign In to Apply")
 * 4. Updates & Addenda section heading is visible on detail page
 * 5. Navigation: "Find Opportunities" link in grantor portal header routes to /opportunities
 * 6. Status badge variants visible on list page
 */

const BASE_URL = 'http://localhost:3000';

test.describe('Opportunity Portal (PRD-INTAKE-013 to PRD-INTAKE-018)', () => {
  test('1. Opportunity list renders with "Funding Opportunities" heading and search filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/opportunities`);

    // Heading
    await expect(page.getByRole('heading', { name: 'Funding Opportunities', level: 1 })).toBeVisible();

    // SearchFilters keyword input
    await expect(page.getByLabel('Search by keyword')).toBeVisible();

    // At least one card rendered (if seed data exists)
    // Check for the card list structure
    const cardGroup = page.locator('.usa-card-group');

    // Wait for loading to complete (cards OR empty state)
    await page.waitForTimeout(2000); // allow API call to complete

    const emptyState = page.locator('.usa-alert--info');
    const cardCount = await cardGroup.count();

    // Either cards are rendered OR an empty state is shown
    if (cardCount > 0) {
      // If cards exist, each should have a status badge
      const cards = page.locator('.usa-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    } else {
      // Empty state should be visible
      await expect(emptyState).toBeVisible();
    }
  });

  test('2. Keyword search updates URL with keyword param and shows filter chip', async ({ page }) => {
    await page.goto(`${BASE_URL}/opportunities`);

    // Type a keyword and submit
    const keywordInput = page.getByLabel('Search by keyword');
    await keywordInput.fill('climate');
    await page.click('button[type="submit"]:has-text("Search")');

    // Wait for the results to update
    await page.waitForTimeout(1500);

    // Active filter chip should appear with keyword text and × button
    const chip = page.locator('span').filter({ hasText: 'Keyword: climate' });
    await expect(chip).toBeVisible();

    // Remove filter chip by clicking ×
    const removeButton = chip.locator('button[aria-label*="Remove filter"]');
    await removeButton.click();

    // Chip should disappear after removal
    await page.waitForTimeout(500);
    await expect(chip).not.toBeVisible();
  });

  test('3. Detail page: breadcrumbs, status badge, and CTA for unauthenticated user', async ({ page }) => {
    await page.goto(`${BASE_URL}/opportunities`);
    await page.waitForTimeout(2000);

    // Find and click a "View Details" link
    const viewDetailsLinks = page.locator('a[aria-label*="View details for"]');
    const linkCount = await viewDetailsLinks.count();

    if (linkCount === 0) {
      // No published opportunities in seed data — skip visual test
      test.skip();
      return;
    }

    // Click the first "View Details" link
    await viewDetailsLinks.first().click();

    // Wait for navigation to /opportunities/:slug
    await page.waitForURL(/\/opportunities\/.+/, { timeout: 10000 });

    // Breadcrumb "Funding Opportunities" links back to /opportunities
    const breadcrumb = page.locator('.usa-breadcrumb__list');
    await expect(breadcrumb).toBeVisible();
    const fundingOppsLink = breadcrumb.locator('a').filter({ hasText: 'Funding Opportunities' });
    await expect(fundingOppsLink).toBeVisible();

    // CTA button for unauthenticated user: "Sign In to Apply"
    await expect(page.getByRole('link', { name: 'Sign In to Apply' })).toBeVisible();

    // "Updates & Addenda" section heading
    await expect(page.getByRole('heading', { name: 'Updates & Addenda' })).toBeVisible();
  });

  test('4. Addenda timeline is rendered on detail page (section heading visible)', async ({ page }) => {
    await page.goto(`${BASE_URL}/opportunities`);
    await page.waitForTimeout(2000);

    const viewDetailsLinks = page.locator('a[aria-label*="View details for"]');
    const linkCount = await viewDetailsLinks.count();

    if (linkCount === 0) {
      test.skip();
      return;
    }

    await viewDetailsLinks.first().click();
    await page.waitForURL(/\/opportunities\/.+/, { timeout: 10000 });

    // "Updates & Addenda" section is present
    await expect(page.getByRole('heading', { name: 'Updates & Addenda' })).toBeVisible();

    // Either shows addenda entries or "No updates posted yet"
    const noUpdates = page.locator('p').filter({ hasText: 'No updates posted yet' });
    const addendaItems = page.locator('.usa-process-list__item');
    const addendaCount = await addendaItems.count();

    // One or the other must be visible
    if (addendaCount > 0) {
      await expect(addendaItems.first()).toBeVisible();
    } else {
      await expect(noUpdates).toBeVisible();
    }
  });

  test('5. "Find Opportunities" link in app header navigates to /opportunities', async ({ page }) => {
    // Visit the login page first (which has a real header rendered)
    await page.goto(`${BASE_URL}/login`);

    // After login, the GrantorLayout will render with "Find Opportunities" link
    // Login as admin to see the grantor layout header
    await page.fill('input[name="email"]', 'admin@example.gov');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(`${BASE_URL}/grantor/dashboard`, { timeout: 15000 });

    // "Find Opportunities" link should be in the header nav
    const findOppsLink = page.locator('a[href="/opportunities"]').filter({ hasText: 'Find Opportunities' });
    await expect(findOppsLink).toBeVisible();

    // Click it
    await findOppsLink.click();

    // Should navigate to /opportunities
    await page.waitForURL(`${BASE_URL}/opportunities`, { timeout: 10000 });
    await expect(page.url()).toContain('/opportunities');
  });

  test('6. Status badges render with expected color-coded variants', async ({ page }) => {
    await page.goto(`${BASE_URL}/opportunities`);
    await page.waitForTimeout(2000);

    const cards = page.locator('.usa-card');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      // No published opportunities — skip visual badge test
      test.skip();
      return;
    }

    // At least one card must have a status badge with one of the expected labels
    const validBadgeLabels = ['Open', 'Closing Soon', 'Closed', 'Not Yet Open'];

    // Check that at least one valid status badge exists on the page
    let foundBadge = false;
    for (const label of validBadgeLabels) {
      const badgeCount = await page.locator('span').filter({ hasText: label }).count();
      if (badgeCount > 0) {
        foundBadge = true;
        break;
      }
    }
    expect(foundBadge).toBe(true);
  });
});
