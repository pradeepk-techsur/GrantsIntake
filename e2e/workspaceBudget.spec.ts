import { test, expect } from '@playwright/test';

test('budget builder renders in budget section', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**');
  await page.goto('/applicant/applications');

  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');
    // Click Budget section in sidebar
    await page.click('text=Budget');
    await expect(page.locator('[data-testid="budget-builder"]')).toBeVisible();
    await expect(page.locator('[data-testid="budget-total-federal"]')).toBeVisible();
    await expect(page.locator('[data-testid="validate-budget-btn"]')).toBeVisible();
  } else {
    test.skip(true, 'No workspaces available');
  }
});

test('attachment manager renders in attachments section', async ({ page }) => {
  await page.goto('/applicant/applications');
  const cards = page.locator('[data-testid="workspace-card"]');
  const count = await cards.count();
  if (count > 0) {
    await cards.first().locator('a, button').first().click();
    await page.waitForSelector('[data-testid="workspace-page"]');
    // Click Attachments section in sidebar
    await page.click('text=Attachments');
    await expect(page.locator('[data-testid="attachment-manager"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-attachment-btn"]')).toBeVisible();
  } else {
    test.skip(true, 'No workspaces available');
  }
});
