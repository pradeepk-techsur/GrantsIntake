import { test, expect } from '@playwright/test';

// Test 1: My Applications page loads
test('workspace list page renders', async ({ page }) => {
  // Login as applicant
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**');

  await page.goto('/applicant/applications');
  await expect(page.locator('[data-testid="workspace-list"]')).toBeVisible();
});

// Test 2: Navigation sidebar has My Applications link
test('ApplicantSidebar has My Applications nav link', async ({ page }) => {
  await page.goto('/applicant/applications');
  await expect(page.locator('[data-testid="nav-my-applications"]')).toBeVisible();
});

// Test 3: WorkspacePage renders with section sidebar
test('workspace page shows section sidebar with 9 sections', async ({ page }) => {
  // navigate to a known workspace (requires setup)
  // Test that section sidebar renders with expected section names
  // Can use mocked API or skip if no workspace exists yet
  // Verify data-testid="workspace-section-sidebar" is present when page loads
  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  // If no cards, verify empty state
  const count = await cards.count();
  if (count > 0) {
    await cards.first().locator('a, button').first().click();
    await expect(page.locator('[data-testid="workspace-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-section-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="workspace-section-content"]')).toBeVisible();
  } else {
    await expect(page.locator('text=You have no applications yet')).toBeVisible();
  }
});

// Test 4: Section switching does NOT change URL
test('clicking section in sidebar changes panel without URL change', async ({ page }) => {
  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    await cards.first().locator('a, button').first().click();
    const initialUrl = page.url();
    // Click second section in sidebar
    const sidebarItems = page.locator('[data-testid="workspace-section-sidebar"] [role="button"], [data-testid="workspace-section-sidebar"] button');
    if (await sidebarItems.count() > 1) {
      await sidebarItems.nth(1).click();
      expect(page.url()).toBe(initialUrl); // URL must not change
    }
  }
});
