import { test, expect } from '@playwright/test';

test.describe('Login redirect', () => {
  test('applicant login navigates to /applicant/applications', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/applications**', { timeout: 8000 });
    await expect(page).toHaveURL(/applicant\/applications/);
  });

  test('/applicant index redirects to /applicant/applications', async ({ page }) => {
    // Log in first so ApplicantLayout auth guard passes
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    await page.goto('/applicant');
    await expect(page).toHaveURL(/applicant\/applications/);
  });
});

test.describe('Workspace 3-column layout', () => {
  test('workspace page sidebar has grid-col-3 class (not grid-col-2)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    await page.goto('/applicant/applications');
    const cards = page.locator('[data-testid="workspace-card"]');
    const count = await cards.count();

    if (count === 0) {
      test.skip(true, 'No workspaces seeded — skipping layout check');
      return;
    }

    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');

    // Sidebar must have grid-col-3
    const sidebar = page.locator('[data-testid="workspace-section-sidebar"]');
    await expect(sidebar).toBeVisible();
    const sidebarClass = await sidebar.getAttribute('class');
    expect(sidebarClass).toContain('grid-col-3');
    expect(sidebarClass).not.toContain('grid-col-2');

    // Content panel must have grid-col-6
    const content = page.locator('[data-testid="workspace-section-content"]');
    const contentClass = await content.getAttribute('class');
    expect(contentClass).toContain('grid-col-6');
    expect(contentClass).not.toContain('grid-col-5');

    // Readiness panel must have grid-col-3
    const readiness = page.locator('[data-testid="workspace-readiness-panel"]');
    const readinessClass = await readiness.getAttribute('class');
    expect(readinessClass).toContain('grid-col-3');
  });

  test('WorkspaceSectionPanel root div does not have usa-prose class', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    await page.goto('/applicant/applications');
    const cards = page.locator('[data-testid="workspace-card"]');
    const count = await cards.count();

    if (count === 0) {
      test.skip(true, 'No workspaces seeded');
      return;
    }

    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-section-panel"]');

    const panel = page.locator('[data-testid="workspace-section-panel"]');
    const panelClass = await panel.getAttribute('class');
    // usa-prose must NOT be on the root panel div (double-nesting breaks grid)
    expect(panelClass ?? '').not.toContain('usa-prose');
  });
});
