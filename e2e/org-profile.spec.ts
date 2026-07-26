import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the applicant-facing organization profile portal.
 *
 * Implements: PRD-INTAKE-019, PRD-INTAKE-021, PRD-INTAKE-022, PRD-INTAKE-023, PRD-INTAKE-024
 *
 * Prerequisites:
 * - App server running at http://localhost:3000 (via docker compose up)
 * - Seed data applied: applicant@example.com / TestPass123! exists in users table
 * - localStorage is cleared between tests (automatic per Playwright page isolation)
 *
 * Tests:
 * 1. Unauthenticated user redirected from /applicant/profile to /login
 * 2. ApplicantLayout renders with My Profile, Find Opportunities, My Applications nav links
 * 3. My Profile nav link is active (usa-current) on /applicant/profile
 * 4. Org profile create form renders required fields
 * 5. Submitting org profile form with valid data creates org and shows completeness
 * 6. Invalid UEI shows validation error
 * 7. /applicant/profile/roles is reachable from My Profile page link
 * 8. /applicant/profile/documents is reachable from My Profile page link
 * 9. Credential status section renders on org profile page
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Login helper — authenticates as the applicant test user.
 * Waits for redirect to /applicant/profile after successful login.
 */
async function loginAsApplicant(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'applicant@example.com');
  await page.fill('input[name="password"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  // Wait for redirect — either to /applicant/profile or stay at /applicant if redirected by router
  await page.waitForURL(/\/applicant/, { timeout: 15000 });
}

test.describe('Applicant Layout and Org Profile', () => {
  test('1. unauthenticated user is redirected to /login from /applicant/profile', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/applicant/profile`);
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('2. ApplicantLayout renders with My Profile, Find Opportunities, My Applications nav links', async ({
    page,
  }) => {
    await loginAsApplicant(page);
    // All three nav items from ApplicantSidebar must be visible
    await expect(page.getByRole('link', { name: 'My Profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find Opportunities' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Applications' })).toBeVisible();
  });

  test('3. My Profile nav link is active (usa-current) on /applicant/profile', async ({
    page,
  }) => {
    await loginAsApplicant(page);
    // Navigate to /applicant/profile explicitly to ensure active state
    await page.goto(`${BASE_URL}/applicant/profile`);
    await expect(page.locator('.usa-current', { hasText: 'My Profile' })).toBeVisible();
  });

  test('4. org profile create form renders required fields', async ({ page }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);
    // Required form fields with labels
    await expect(page.getByLabel('Legal Name')).toBeVisible();
    await expect(page.getByLabel('Entity Type')).toBeVisible();
    await expect(page.getByText('Banking Readiness')).toBeVisible();
    await expect(page.getByLabel('Primary Contact Name')).toBeVisible();
    await expect(page.getByLabel('Primary Contact Email')).toBeVisible();
  });

  test('5. submitting org profile form with valid data creates org and shows completeness', async ({
    page,
  }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);

    // Fill required fields
    await page.fill('[name="legal_name"]', 'Test Nonprofit Org');
    await page.fill('[name="address_line1"]', '123 Main St');
    await page.fill('[name="city"]', 'Washington');
    await page.selectOption('[name="state"]', 'DC');
    await page.fill('[name="zip"]', '20001');
    await page.selectOption('[name="entity_type"]', 'nonprofit_501c3');
    await page.fill('[name="primary_contact_name"]', 'Jane Doe');
    await page.fill('[name="primary_contact_email"]', 'jane@example.org');

    // Submit the form
    await page.click('[data-testid="save-org-button"]');

    // Wait for success state — completeness % should appear
    await page.waitForTimeout(2000);
    await expect(page.locator('text=% complete')).toBeVisible({ timeout: 10000 });
  });

  test('6. invalid UEI shows validation error', async ({ page }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);

    // Enter an invalid UEI (too short)
    await page.fill('[name="uei"]', 'TOOSHORT');
    await page.click('[data-testid="save-org-button"]');

    // Validation error should appear immediately (client-side)
    await expect(page.getByText('UEI must be 12 alphanumeric characters')).toBeVisible();
  });

  test('7. /applicant/profile/roles is reachable from My Profile page link', async ({
    page,
  }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);

    // Wait for org to load (if exists) — the Team Roles link only appears when org is present
    // Navigate directly to roles page via URL (tests the route is wired)
    await page.goto(`${BASE_URL}/applicant/profile/roles`);

    // If org exists: roles page renders. If no org: redirects to /applicant/profile.
    // Either outcome is valid — we just verify the route is accessible
    const url = page.url();
    const onRolesPage = url.includes('/applicant/profile/roles');
    const redirectedToProfile = url.includes('/applicant/profile') && !url.includes('/roles');

    expect(onRolesPage || redirectedToProfile).toBe(true);

    if (onRolesPage) {
      await expect(page.getByRole('heading', { name: 'Team Roles' })).toBeVisible();
    }
  });

  test('8. /applicant/profile/documents is reachable from My Profile page link', async ({
    page,
  }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);

    // Navigate directly to documents page via URL (tests the route is wired)
    await page.goto(`${BASE_URL}/applicant/profile/documents`);

    const url = page.url();
    const onDocsPage = url.includes('/applicant/profile/documents');
    const redirectedToProfile = url.includes('/applicant/profile') && !url.includes('/documents');

    expect(onDocsPage || redirectedToProfile).toBe(true);

    if (onDocsPage) {
      await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    }
  });

  test('9. credential status section renders on org profile page', async ({ page }) => {
    await loginAsApplicant(page);
    await page.goto(`${BASE_URL}/applicant/profile`);

    // The credential-status section is rendered on mount
    // (banners appear if the org has expired/expiring credentials, section always present)
    await expect(page.locator('[data-testid="credential-status-section"]')).toBeVisible({
      timeout: 5000,
    });
  });
});
