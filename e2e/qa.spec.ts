import { test, expect } from '@playwright/test';

/**
 * Q&A e2e tests.
 *
 * Uses the seeded UAT credentials:
 * - Admin/grantor: admin@example.gov / TestPassword123!
 * - Applicant: applicant@example.com / TestPass123!
 *
 * Navigation uses window.history.pushState + PopStateEvent pattern
 * to preserve Zustand in-memory accessToken across route changes.
 */

// Helper: login and navigate using SPA-safe pushState
async function loginAndNavigate(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  targetPath: string,
) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  // Wait for redirect after login
  await page.waitForURL('**/applicant/**', { timeout: 10000 }).catch(() => {});
  await page.waitForURL('**/grantor/**', { timeout: 5000 }).catch(() => {});

  // SPA navigate using pushState to preserve in-memory auth token
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(1000);
}

// Test 1: Public Q&A section visible on OpportunityDetailPage
test('OpportunityDetailPage shows Q&A section', async ({ page }) => {
  // Navigate to a public opportunity page (no login needed)
  await page.goto('/opportunities');
  // Wait for the opportunity list to load
  await page.waitForTimeout(2000);

  // Find any opportunity link and click it
  const links = page.locator('a[href*="/opportunities/"]');
  const count = await links.count();
  if (count > 0) {
    await links.first().click();
    await page.waitForTimeout(2000);

    // The Q&A section should be present
    const qaSection = page.locator('[data-testid="qa-section"]');
    await expect(qaSection).toBeVisible({ timeout: 10000 });

    // Should show the "No public questions" message or Q&A items
    const noQA = page.locator('text=No public questions have been answered yet');
    const qaItems = page.locator('[data-testid="qa-detail-item"]');
    const hasNoQAMessage = await noQA.isVisible().catch(() => false);
    const hasItems = (await qaItems.count()) > 0;
    expect(hasNoQAMessage || hasItems).toBe(true);
  }
});

// Test 2: Authenticated applicant sees "Submit a Question" link
test('authenticated applicant sees Submit a Question link on OpportunityDetailPage', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@example.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**', { timeout: 10000 });

  // Navigate to opportunity list and open one
  await page.evaluate(() => {
    window.history.pushState({}, '', '/opportunities');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForTimeout(2000);

  const links = page.locator('a[href*="/opportunities/"]');
  const count = await links.count();
  if (count > 0) {
    // Navigate to the opportunity detail using SPA pushState
    const href = await links.first().getAttribute('href');
    if (href) {
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, href);
      await page.waitForTimeout(2000);

      // "Submit a Question" link should be visible for authenticated user
      const submitLink = page.locator('[data-testid="submit-question-link"]');
      await expect(submitLink).toBeVisible({ timeout: 10000 });
    }
  }
});

// Test 3: QASubmitPage renders with form
test('QASubmitPage renders question form for authenticated applicant', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@example.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**', { timeout: 10000 });

  // Navigate to QASubmitPage for any opportunity
  // First find an opportunity ID
  const oppRes = await page.evaluate(async () => {
    const res = await fetch('/api/v1/opportunities');
    if (!res.ok) return null;
    const data = await res.json();
    return data.opportunities?.[0]?.opportunity_id ?? null;
  });

  if (oppRes) {
    await page.evaluate((oppId) => {
      window.history.pushState({}, '', `/applicant/opportunities/${oppId}/qa`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oppRes);
    await page.waitForTimeout(1500);

    // Check that the page header renders
    await expect(page.locator('h1').filter({ hasText: 'Submit a Question' })).toBeVisible({ timeout: 10000 });

    // Check textarea is present
    const textarea = page.locator('[data-testid="qa-question-textarea"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Check submit button is present
    const submitBtn = page.locator('[data-testid="qa-submit-btn"]');
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
  }
});

// Test 4: Grantor can reach QAManagementPage
test('grantor can navigate to QAManagementPage', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@example.gov');
  await page.fill('[name="password"]', 'TestPassword123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/grantor/**', { timeout: 10000 });

  // Find an opportunity ID via API
  const oppRes = await page.evaluate(async () => {
    const res = await fetch('/api/v1/opportunities');
    if (!res.ok) return null;
    const data = await res.json();
    return data.opportunities?.[0]?.opportunity_id ?? null;
  });

  if (oppRes) {
    await page.evaluate((oppId) => {
      window.history.pushState({}, '', `/grantor/opportunities/${oppId}/qa`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oppRes);
    await page.waitForTimeout(1500);

    // QAManagementPage should render
    await expect(page.locator('text=Q&A Management')).toBeVisible({ timeout: 10000 });
  }
});

// Test 5: Navigation wiring — QASubmitPage linked from OpportunityDetailPage
test('navigation wiring: QASubmitPage accessible from OpportunityDetailPage', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'applicant@example.com');
  await page.fill('[name="password"]', 'TestPass123!');
  await page.click('[type="submit"]');
  await page.waitForURL('**/applicant/**', { timeout: 10000 });

  // Navigate to an opportunity detail page
  const oppRes = await page.evaluate(async () => {
    const res = await fetch('/api/v1/opportunities');
    if (!res.ok) return null;
    const data = await res.json();
    // Get an opportunity with a public_slug for browsing
    const opp = data.opportunities?.[0];
    return opp ? { id: opp.opportunity_id, slug: opp.public_slug || opp.opportunity_id } : null;
  });

  if (oppRes) {
    await page.evaluate((slug) => {
      window.history.pushState({}, '', `/opportunities/${slug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, oppRes.slug);
    await page.waitForTimeout(2000);

    // Submit a Question link should be present
    const link = page.locator('[data-testid="submit-question-link"]');
    await expect(link).toBeVisible({ timeout: 10000 });

    // Verify it links to the right path
    const href = await link.getAttribute('href');
    expect(href).toContain(`/applicant/opportunities/${oppRes.id}/qa`);
  }
});
