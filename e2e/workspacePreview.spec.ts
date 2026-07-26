import { test, expect } from '@playwright/test';

test('preview page shows DRAFT PREVIEW banner and does not submit', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@test.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**');

  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    const workspaceHref = await cards.first().locator('a').first().getAttribute('href');
    const workspaceId = workspaceHref?.split('/').pop();

    if (workspaceId) {
      await page.goto(`/applicant/workspaces/${workspaceId}/preview`);
      await expect(page.locator('[data-testid="preview-page"]')).toBeVisible();
      // CRITICAL: draft preview banner must be prominent
      await expect(page.locator('[data-testid="draft-preview-banner"]')).toBeVisible();
      await expect(page.locator('text=DRAFT PREVIEW — NOT SUBMITTED')).toBeVisible();
      await expect(page.locator('text=This preview does not initiate submission')).toBeVisible();
    }
  } else {
    test.skip(true, 'No workspaces available');
  }
});

test('preview page does not contain internal comments', async ({ page }) => {
  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    const workspaceHref = await cards.first().locator('a').first().getAttribute('href');
    const workspaceId = workspaceHref?.split('/').pop();
    if (workspaceId) {
      await page.goto(`/applicant/workspaces/${workspaceId}/preview`);
      // Internal comments section should NOT exist in preview
      await expect(page.locator('text=Internal Comments')).not.toBeVisible();
      await expect(page.locator('text=Private Notes')).not.toBeVisible();
    }
  } else {
    test.skip(true, 'No workspaces available');
  }
});

test('preview back button returns to workspace', async ({ page }) => {
  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    const workspaceHref = await cards.first().locator('a').first().getAttribute('href');
    const workspaceId = workspaceHref?.split('/').pop();
    if (workspaceId) {
      await page.goto(`/applicant/workspaces/${workspaceId}/preview`);
      await page.click('text=← Back to Application');
      await expect(page).not.toHaveURL(/preview/);
    }
  } else {
    test.skip(true, 'No workspaces available');
  }
});
