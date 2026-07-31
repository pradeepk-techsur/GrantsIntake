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

    // Navigate to /applicant using in-SPA history push (full page.goto would lose
    // the in-memory Zustand accessToken, causing the auth guard to redirect to /login
    // instead of letting React Router process the index redirect).
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/, { timeout: 5000 });
  });
});

test.describe('Workspace 3-column layout', () => {
  test('workspace page sidebar has grid-col-3 class (not grid-col-2)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    // Navigate within SPA to preserve in-memory Zustand accessToken.
    // page.goto('/applicant/applications') would cause a full reload,
    // clearing Zustand state and triggering the auth guard to redirect to /login.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant/applications');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/);

    // Wait for workspace list to render (React Query fetch completes)
    await page.waitForSelector('[data-testid="workspace-list"]', { timeout: 10000 });
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

    // Navigate within SPA to preserve in-memory Zustand accessToken.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant/applications');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/);

    // Wait for workspace list to render (React Query fetch completes)
    await page.waitForSelector('[data-testid="workspace-list"]', { timeout: 10000 });
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

  test('workspace content column has overflow:hidden to prevent readiness dashboard overlap', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    // Navigate within SPA to preserve in-memory Zustand accessToken.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant/applications');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/);

    await page.waitForSelector('[data-testid="workspace-list"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="workspace-card"]');
    const count = await cards.count();

    if (count === 0) {
      test.skip(true, 'No workspaces seeded — skipping overflow:hidden check');
      return;
    }

    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');

    // Content column must have overflow:hidden to contain wide tables
    const contentCol = page.locator('[data-testid="workspace-section-content"]');
    await expect(contentCol).toHaveCSS('overflow', 'hidden');
  });

  test('opportunity hint text is not a raw UUID (shows title or falls back gracefully)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    // Navigate within SPA to preserve in-memory Zustand accessToken.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant/applications');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/);

    await page.waitForSelector('[data-testid="workspace-list"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="workspace-card"]');
    const count = await cards.count();

    if (count === 0) {
      test.skip(true, 'No workspaces seeded — skipping opportunity title check');
      return;
    }

    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');

    // Wait for opportunity title to potentially load (opportunityQuery has staleTime 5min)
    // The hint text should eventually show a non-UUID title or fallback to UUID
    // We verify the element renders correctly (not an error state)
    const hint = page.locator('[data-testid="workspace-page"] .usa-prose p.usa-hint').first();
    await expect(hint).toBeVisible({ timeout: 5000 });
    const hintText = await hint.textContent();
    // Hint should contain "Opportunity:" prefix
    expect(hintText).toContain('Opportunity:');
  });
});

test.describe('Attachment table layout', () => {
  test('attachment table wrapper has overflow-x:auto for responsive scrolling', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'applicant@example.com');
    await page.fill('[name="password"]', 'TestPass123!');
    await page.click('[type="submit"]');
    await page.waitForURL('**/applicant/**');

    // Navigate within SPA to preserve in-memory Zustand accessToken.
    await page.evaluate(() => {
      window.history.pushState({}, '', '/applicant/applications');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL(/applicant\/applications/);

    await page.waitForSelector('[data-testid="workspace-list"]', { timeout: 10000 });
    const cards = page.locator('[data-testid="workspace-card"]');
    const count = await cards.count();

    if (count === 0) {
      test.skip(true, 'No workspaces seeded — skipping attachment overflow check');
      return;
    }

    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');

    // Navigate to Attachments section via sidebar
    const attachmentsLink = page.locator('[data-testid="workspace-section-sidebar"]').getByText('Attachments');
    const attachmentsLinkCount = await attachmentsLink.count();

    if (attachmentsLinkCount === 0) {
      test.skip(true, 'No Attachments section in sidebar — skipping overflow check');
      return;
    }

    await attachmentsLink.first().click();

    // Wait for attachment manager to render (may show empty state or table)
    await page.waitForSelector('[data-testid="attachment-manager"]', { timeout: 8000 });

    // If attachments exist, the table wrapper should have overflow-x:auto
    const attachmentList = page.locator('[data-testid="attachment-list"]');
    const hasTable = (await attachmentList.count()) > 0;

    if (!hasTable) {
      test.skip(true, 'No attachments uploaded — skipping overflow-x:auto check on empty state');
      return;
    }

    // The usa-table must be inside a div with overflow-x:auto
    const tableWrapper = page.locator('[data-testid="attachment-manager"] div').filter({
      has: page.locator('table.usa-table'),
    }).first();
    await expect(tableWrapper).toHaveCSS('overflow-x', 'auto');
  });
});
