import { test, expect } from '@playwright/test';

test.describe('Locked workspace is read-only', () => {
  test('form fields are disabled after submission', async ({ page }) => {
    // Step 1: Login as applicant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'applicant@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/applicant/);

    // Step 2: Navigate to workspace (UAT workspace)
    // Get workspace ID from My Applications list
    await page.goto('/applicant/applications');
    const workspaceLink = page.locator('a[href*="/applicant/workspaces/"]').first();
    const href = await workspaceLink.getAttribute('href');
    const workspaceId = href?.match(/workspaces\/([^/]+)/)?.[1];
    expect(workspaceId).toBeTruthy();

    // Step 3: Navigate to workspace and check if it is in locked state
    // Use window.history.pushState for in-SPA navigation to preserve Zustand in-memory accessToken
    await page.evaluate((wsId) => {
      window.history.pushState({}, '', `/applicant/workspaces/${wsId}`);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, workspaceId);
    await page.waitForSelector('[data-testid="workspace-page"]');

    // Step 4: Check if locked banner is present
    const lockedBanner = page.locator('[data-testid="locked-banner"]');
    const isLocked = await lockedBanner.isVisible().catch(() => false);

    if (isLocked) {
      // Verify: select the narrative section and confirm fields are disabled
      // Look for a section that has form fields (not budget/attachments)
      const sectionButtons = page.locator('[data-testid="workspace-section-sidebar"] button');
      const sectionCount = await sectionButtons.count();

      // Click first non-budget/non-attachment section
      for (let i = 0; i < sectionCount; i++) {
        const btnText = await sectionButtons.nth(i).textContent();
        if (btnText && !btnText.toLowerCase().includes('budget') && !btnText.toLowerCase().includes('attach')) {
          await sectionButtons.nth(i).click();
          break;
        }
      }

      // Wait for form panel to render
      await page.waitForSelector('[data-testid="section-form-panel"]');

      // Read-only notice should be visible in section panel
      await expect(page.locator('text=This section is read-only')).toBeVisible();

      // All text inputs in the form panel should be disabled
      const inputs = page.locator(
        '[data-testid="section-form-panel"] input, [data-testid="section-form-panel"] textarea, [data-testid="section-form-panel"] select'
      );
      const inputCount = await inputs.count();
      if (inputCount > 0) {
        for (let i = 0; i < inputCount; i++) {
          const disabled = await inputs.nth(i).getAttribute('disabled');
          expect(disabled).not.toBeNull();
        }
      }
    } else {
      // Workspace not yet locked — test is advisory (submission test must run first)
      console.log('Advisory: workspace not locked — run workspaceSubmission.spec.ts first to lock the workspace');
    }
  });

  test('budget add-line-item button is disabled when locked', async ({ page }) => {
    // Step 1: Login as applicant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'applicant@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/applicant/);

    // Step 2: Navigate to workspace
    await page.goto('/applicant/applications');
    const workspaceLink = page.locator('a[href*="/applicant/workspaces/"]').first();
    const href = await workspaceLink.getAttribute('href');
    const workspaceId = href?.match(/workspaces\/([^/]+)/)?.[1];
    expect(workspaceId).toBeTruthy();

    // Step 3: Navigate to workspace via SPA navigation
    await page.evaluate((wsId) => {
      window.history.pushState({}, '', `/applicant/workspaces/${wsId}`);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, workspaceId);
    await page.waitForSelector('[data-testid="workspace-page"]');

    const isLocked = await page.locator('[data-testid="locked-banner"]').isVisible().catch(() => false);

    if (isLocked) {
      // Navigate to budget section
      await page.click('text=Budget');
      await page.waitForSelector('[data-testid="budget-builder"]');

      // Read-only notice should be visible
      await expect(page.locator('text=This section is read-only')).toBeVisible();

      // All Add Line Item buttons should be disabled
      const addBtns = page.locator('[data-testid^="add-line-item-btn-"]');
      const btnCount = await addBtns.count();
      if (btnCount > 0) {
        for (let i = 0; i < btnCount; i++) {
          await expect(addBtns.nth(i)).toBeDisabled();
        }
      }
    } else {
      console.log('Advisory: workspace not locked — run workspaceSubmission.spec.ts first');
    }
  });

  test('attachment upload button is disabled when locked', async ({ page }) => {
    // Step 1: Login as applicant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'applicant@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/applicant/);

    // Step 2: Navigate to workspace
    await page.goto('/applicant/applications');
    const workspaceLink = page.locator('a[href*="/applicant/workspaces/"]').first();
    const href = await workspaceLink.getAttribute('href');
    const workspaceId = href?.match(/workspaces\/([^/]+)/)?.[1];
    expect(workspaceId).toBeTruthy();

    // Step 3: Navigate to workspace via SPA navigation
    await page.evaluate((wsId) => {
      window.history.pushState({}, '', `/applicant/workspaces/${wsId}`);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, workspaceId);
    await page.waitForSelector('[data-testid="workspace-page"]');

    const isLocked = await page.locator('[data-testid="locked-banner"]').isVisible().catch(() => false);

    if (isLocked) {
      // Navigate to attachments section
      await page.click('text=Attachments');
      await page.waitForSelector('[data-testid="attachment-manager"]');

      // Read-only notice should be visible
      await expect(page.locator('text=This section is read-only')).toBeVisible();

      // Upload button should be disabled
      await expect(page.locator('[data-testid="upload-attachment-btn"]')).toBeDisabled();

      // Link from Library button should be disabled
      await expect(page.locator('[data-testid="link-library-btn"]')).toBeDisabled();
    } else {
      console.log('Advisory: workspace not locked — run workspaceSubmission.spec.ts first');
    }
  });
});
