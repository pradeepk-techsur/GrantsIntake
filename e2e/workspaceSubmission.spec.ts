import { test, expect } from '@playwright/test';

/**
 * Workspace Submission e2e tests.
 *
 * Uses the seeded UAT credentials:
 * - Applicant: applicant@example.com / TestPass123!
 *
 * Navigation uses window.history.pushState + PopStateEvent pattern
 * to preserve Zustand in-memory accessToken across route changes.
 *
 * POST /submit and GET /receipt are mocked via Playwright route handlers
 * to avoid requiring a fully certified, complete workspace with no blocking errors.
 */

const APPLICANT_EMAIL = 'applicant@example.com';
const APPLICANT_PASS = 'TestPass123!';
const MOCK_WORKSPACE_ID = 'test-ws-id';

const MOCK_CONFIRMATION = {
  snapshot_id: 'test-snap-id',
  confirmation_number: 'GI-2026-00000001',
  submitted_at: '2026-07-31T14:32:00.000Z',
  opportunity_title: 'Test Grant Opportunity',
  applicant_org_name: 'Test Applicant Organization',
  receipt_download_url: `/api/v1/workspaces/${MOCK_WORKSPACE_ID}/receipt`,
};

const MOCK_RECEIPT = {
  snapshot_id: 'test-snap-id',
  confirmation_number: 'GI-2026-00000001',
  submitted_at: '2026-07-31T14:32:00.000Z',
  opportunity_title: 'Test Grant Opportunity',
  applicant_org_name: 'Test Applicant Organization',
  human_readable_pdf_path: '/submissions/human-readable/GI-2026-00000001.html',
  machine_readable_json_path: '/submissions/machine-readable/GI-2026-00000001.json',
};

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

  // SPA navigate using pushState to preserve in-memory auth token
  await page.evaluate((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, targetPath);
  await page.waitForTimeout(1000);
}

// Test 1: CertifySubmitPage renders with checklist items
test('CertifySubmitPage renders pre-submission checklist', async ({ page }) => {
  // Mock readiness API
  await page.route('**/api/v1/workspaces/*/readiness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overall_completion_pct: 100,
        is_ready_to_submit: true,
        authorized_rep_assigned: true,
        blocking_errors: [],
        warnings: [],
        attachment_status: [],
      }),
    });
  });

  // Mock certification API
  await page.route('**/api/v1/workspaces/*/certification', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ certified: true, certification: { cert_id: 'test-cert' } }),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}/certify-submit`,
  );

  // Verify page renders
  await expect(page.getByTestId('certify-submit-page')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Submit Your Application')).toBeVisible();

  // Verify checklist items
  const checklist = page.getByTestId('checklist-items');
  await expect(checklist.getByText('All sections complete')).toBeVisible();
  await expect(checklist.getByText('Authorized representative assigned')).toBeVisible();
  await expect(checklist.getByText('Application certified')).toBeVisible();
  await expect(checklist.getByText('No blocking errors')).toBeVisible();
});

// Test 2: Blocked state — submit button disabled when checklist has ✗ items
test('CertifySubmitPage submit button disabled when not ready', async ({ page }) => {
  // Mock readiness — NOT ready (blocking errors present)
  await page.route('**/api/v1/workspaces/*/readiness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overall_completion_pct: 50,
        is_ready_to_submit: false,
        authorized_rep_assigned: false,
        blocking_errors: [
          { section_id: 's1', section_name: 'Org Profile', error_code: 'INCOMPLETE', message: 'Incomplete section', link: '#' },
        ],
        warnings: [],
        attachment_status: [],
      }),
    });
  });

  // Mock certification — NOT certified
  await page.route('**/api/v1/workspaces/*/certification', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ certified: false, certification: null }),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}/certify-submit`,
  );

  await expect(page.getByTestId('certify-submit-page')).toBeVisible({ timeout: 5000 });

  // Submit button should be disabled
  const submitBtn = page.getByTestId('confirm-submit-btn');
  await expect(submitBtn).toBeVisible();
  await expect(submitBtn).toHaveAttribute('aria-disabled', 'true');
});

// Test 3: SubmissionReceiptPage renders with confirmation number
test('SubmissionReceiptPage renders confirmation number and details', async ({ page }) => {
  // Mock receipt API
  await page.route('**/api/v1/workspaces/*/receipt', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RECEIPT),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}/receipt`,
  );

  // Verify receipt page renders
  await expect(page.getByTestId('submission-receipt-page')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Application Submitted Successfully')).toBeVisible();

  // Verify confirmation number displayed
  const confirmationEl = page.getByTestId('confirmation-number');
  await expect(confirmationEl).toBeVisible();
  await expect(confirmationEl).toContainText('GI-2026-00000001');

  // Verify details
  await expect(page.getByTestId('opportunity-title')).toContainText('Test Grant Opportunity');
  await expect(page.getByTestId('org-name')).toContainText('Test Applicant Organization');
});

// Test 4: Locked state banner on WorkspacePage
test('WorkspacePage shows locked banner when workspace is_locked=true', async ({ page }) => {
  // Mock workspace with is_locked=true
  await page.route('**/api/v1/workspaces/' + MOCK_WORKSPACE_ID, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: MOCK_WORKSPACE_ID,
          opportunity_id: 'test-opp-id',
          org_id: 'test-org-id',
          status: 'submitted',
          is_locked: true,
          visibility: 'shared',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock sections
  await page.route('**/api/v1/workspaces/*/sections', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { section_id: 's1', section_type: 'org_profile', section_name: 'Organization Profile', display_order: 1, status: 'complete', is_visible: true },
      ]),
    });
  });

  // Mock readiness
  await page.route('**/api/v1/workspaces/*/readiness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overall_completion_pct: 100, is_ready_to_submit: false,
        authorized_rep_assigned: true, blocking_errors: [], warnings: [], attachment_status: [],
      }),
    });
  });

  // Mock opportunity
  await page.route('**/api/v1/opportunities/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ title: 'Test Opportunity' }),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}`,
  );

  // Wait for workspace page
  await expect(page.getByTestId('workspace-page')).toBeVisible({ timeout: 5000 });

  // Verify locked banner
  const lockedBanner = page.getByTestId('locked-banner');
  await expect(lockedBanner).toBeVisible();
  await expect(lockedBanner).toContainText('Application Submitted and Locked');
  await expect(lockedBanner).toContainText('View submission receipt');
});

// Test 5: Receipt link from locked workspace navigates to /receipt
test('Locked workspace banner has link to receipt page', async ({ page }) => {
  // Mock workspace with is_locked=true
  await page.route('**/api/v1/workspaces/' + MOCK_WORKSPACE_ID, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: MOCK_WORKSPACE_ID,
          opportunity_id: 'test-opp-id',
          org_id: 'test-org-id',
          status: 'submitted',
          is_locked: true,
          visibility: 'shared',
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/v1/workspaces/*/sections', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { section_id: 's1', section_type: 'org_profile', section_name: 'Organization Profile', display_order: 1, status: 'complete', is_visible: true },
      ]),
    });
  });

  await page.route('**/api/v1/workspaces/*/readiness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overall_completion_pct: 100, is_ready_to_submit: false,
        authorized_rep_assigned: true, blocking_errors: [], warnings: [], attachment_status: [],
      }),
    });
  });

  await page.route('**/api/v1/opportunities/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ title: 'Test Opportunity' }),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}`,
  );

  await expect(page.getByTestId('workspace-page')).toBeVisible({ timeout: 5000 });

  // Find and check the receipt link
  const receiptLink = page.getByTestId('locked-banner').getByRole('link', { name: 'View submission receipt' });
  await expect(receiptLink).toBeVisible();
  await expect(receiptLink).toHaveAttribute('href', `/applicant/workspaces/${MOCK_WORKSPACE_ID}/receipt`);
});

// Test 6: Return to My Applications link on receipt page
test('SubmissionReceiptPage has Return to My Applications link', async ({ page }) => {
  // Mock receipt API
  await page.route('**/api/v1/workspaces/*/receipt', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_RECEIPT),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}/receipt`,
  );

  await expect(page.getByTestId('submission-receipt-page')).toBeVisible({ timeout: 5000 });

  // Verify return link
  const returnLink = page.getByTestId('return-to-applications');
  await expect(returnLink).toBeVisible();
  await expect(returnLink).toHaveAttribute('href', '/applicant/applications');
});

// Test 7: ReadinessDashboard Submit button navigates to certify-submit
test('ReadinessDashboard Submit button navigates to certify-submit page', async ({ page }) => {
  // Mock workspace
  await page.route('**/api/v1/workspaces/' + MOCK_WORKSPACE_ID, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          workspace_id: MOCK_WORKSPACE_ID,
          opportunity_id: 'test-opp-id',
          org_id: 'test-org-id',
          status: 'in_progress',
          is_locked: false,
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/v1/workspaces/*/sections', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { section_id: 's1', section_type: 'org_profile', section_name: 'Organization Profile', display_order: 1, status: 'complete', is_visible: true },
      ]),
    });
  });

  // Mock readiness — ready to submit
  await page.route('**/api/v1/workspaces/*/readiness', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        overall_completion_pct: 100,
        is_ready_to_submit: true,
        authorized_rep_assigned: true,
        blocking_errors: [],
        warnings: [],
        attachment_status: [],
      }),
    });
  });

  await page.route('**/api/v1/opportunities/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ title: 'Test Opportunity' }),
    });
  });

  await loginAndNavigate(
    page,
    APPLICANT_EMAIL,
    APPLICANT_PASS,
    `/applicant/workspaces/${MOCK_WORKSPACE_ID}`,
  );

  await expect(page.getByTestId('workspace-page')).toBeVisible({ timeout: 5000 });

  // Find submit button in ReadinessDashboard
  const submitBtn = page.getByTestId('submit-application-btn');
  await expect(submitBtn).toBeVisible({ timeout: 5000 });
  await expect(submitBtn).toBeEnabled();

  // Click submit button — should navigate to certify-submit
  await submitBtn.click();
  await page.waitForTimeout(1500);

  // Verify URL changed to certify-submit
  expect(page.url()).toContain('/certify-submit');
});
