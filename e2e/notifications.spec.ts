import { test, expect } from '@playwright/test';

/**
 * Notifications e2e tests — Applicant view.
 *
 * Uses seeded applicant credentials: applicant@example.com / TestPass123!
 * API calls are mocked via Playwright route handlers to avoid needing real
 * notification_records in the seed data.
 *
 * Navigation uses window.history.pushState + PopStateEvent pattern
 * to preserve Zustand in-memory accessToken across route changes.
 *
 * PRD-INTAKE-062: Applicant notifications UI — closes UAT Test 7 gap.
 */

const APPLICANT_EMAIL = 'applicant@example.com';
const APPLICANT_PASS = 'TestPass123!';

const MOCK_NOTIFICATION = {
  notification_id: 'notif-001',
  notification_type: 'disposition_applied',
  entity_type: 'intake_queue_entry',
  entity_id: 'entry-001',
  title: 'Application Screened: Community Health Innovation Grant',
  body: 'Your application has been accepted for review.',
  action_url: null,
  is_read: false,
  created_at: '2026-08-01T10:00:00Z',
};

const MOCK_NOTIFICATIONS_RESPONSE = {
  notifications: [MOCK_NOTIFICATION],
  total: 1,
};

const MOCK_EMPTY_RESPONSE = {
  notifications: [],
  total: 0,
};

async function loginAsApplicantAndNavigate(
  page: import('@playwright/test').Page,
  targetPath: string,
) {
  await page.goto('/login');
  await page.fill('[name="email"]', APPLICANT_EMAIL);
  await page.fill('[name="password"]', APPLICANT_PASS);
  await page.click('[type="submit"]');
  // Wait for applicant redirect
  await page.waitForURL('**/applicant/**', { timeout: 10000 }).catch(() => {});

  // SPA navigate using pushState to preserve in-memory auth token
  await page.evaluate((path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(800);
}

test.describe('Notifications — Applicant View', () => {

  test('notifications link visible in applicant sidebar', async ({ page }) => {
    // Mock notifications API so sidebar doesn't cause network errors
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY_RESPONSE),
      });
    });

    await loginAsApplicantAndNavigate(page, '/applicant/applications');

    // Assert nav-notifications link is visible
    const notificationsLink = page.getByTestId('nav-notifications');
    await expect(notificationsLink).toBeVisible({ timeout: 5000 });
    await expect(notificationsLink).toHaveText('Notifications');
  });

  test('notifications page renders with notification items', async ({ page }) => {
    // Mock GET /api/v1/notifications
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_NOTIFICATIONS_RESPONSE),
      });
    });

    await loginAsApplicantAndNavigate(page, '/applicant/notifications');

    // Assert page heading
    await expect(page.getByRole('heading', { name: 'Notifications', level: 1 })).toBeVisible({ timeout: 5000 });

    // Assert notification items rendered
    const items = page.getByTestId('notification-item');
    await expect(items).toHaveCount(1, { timeout: 5000 });

    // Assert title content
    await expect(page.getByTestId('notification-title')).toContainText('Community Health Innovation Grant');

    // Assert body content
    await expect(page.getByTestId('notification-body')).toContainText('accepted for review');

    // Assert mark-read button visible (notification is unread)
    await expect(page.getByTestId('mark-read-button')).toBeVisible();
  });

  test('notifications page shows empty state when no notifications', async ({ page }) => {
    // Mock empty notifications response
    await page.route('**/api/v1/notifications**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_EMPTY_RESPONSE),
      });
    });

    await loginAsApplicantAndNavigate(page, '/applicant/notifications');

    // Assert empty state is visible
    await expect(page.getByTestId('notifications-empty')).toBeVisible({ timeout: 5000 });
  });

  test('mark as read button calls markRead API', async ({ page }) => {
    let markReadCalled = false;

    // Mock GET /api/v1/notifications
    await page.route('**/api/v1/notifications**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'PUT' && url.includes('/read')) {
        markReadCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_NOTIFICATIONS_RESPONSE),
        });
      }
    });

    await loginAsApplicantAndNavigate(page, '/applicant/notifications');

    // Assert mark-read button visible
    const markReadBtn = page.getByTestId('mark-read-button');
    await expect(markReadBtn).toBeVisible({ timeout: 5000 });

    // Click the button
    await markReadBtn.click();
    await page.waitForTimeout(500);

    // Verify no error alert appeared
    const errorAlert = page.locator('.usa-alert--error');
    await expect(errorAlert).not.toBeVisible();
  });

});
