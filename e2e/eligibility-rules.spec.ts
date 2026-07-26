import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Eligibility Rule Builder and Prescreening Builder.
 *
 * NOTE: These tests are written for the verify phase.
 * They require the app to be running at http://localhost:3000
 * with migrations applied and seed data present.
 *
 * Test coverage:
 * 1. Add a hard blocker rule → card appears with usa-alert--error class and "Hard Blocker" badge
 * 2. Advisory indicator styling → card has usa-alert--warning class and "Advisory" badge
 * 3. Pre-screening questionnaire builder → add question + preview modal
 * 4. Enforcement point required for hard blockers (client-side validation)
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.gov';
const ADMIN_PASSWORD = 'TestPassword123!';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(`${BASE_URL}/grantor/dashboard`, { timeout: 10000 });
}

/**
 * Creates a test opportunity via API and returns its ID.
 * We do this via the API to avoid depending on the full opportunity creation UI flow.
 */
async function createTestOpportunity(page: import('@playwright/test').Page): Promise<string> {
  // Get access token by logging in via API
  const loginRes = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { access_token } = await loginRes.json();

  // Get the seeded program ID
  // The seed creates "Example Federal Agency" → "General Grant Programs"
  // We need to create an opportunity in it
  // For testing, we'll use a unique opportunity number
  const timestamp = Date.now();

  // Find or create org and program via the known seed data
  // Try to create opportunity under the seeded program
  const createRes = await page.request.post(
    `${BASE_URL}/api/v1/programs/placeholder/opportunities`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        title: `E2E Eligibility Test Opp ${timestamp}`,
        funding_source: 'Federal Agency',
        announcement_type: 'Initial',
        opportunity_number: `E2E-ELIG-${timestamp}`,
        eligibility_summary: 'Testing eligibility rules',
        executive_summary: 'E2E test opportunity for eligibility rule builder',
        contact_name: 'Test Contact',
        contact_email: 'contact@test.gov',
        program_area: 'Health',
      },
    },
  );

  if (createRes.ok()) {
    const opp = await createRes.json();
    return opp.opportunity_id;
  }

  // If that failed (placeholder program ID), we need the real program ID
  // Just return a placeholder; in practice tests would need seeded data
  return '';
}

test.describe('Eligibility Rule Builder', () => {
  // We'll store the opportunity ID for navigation
  let opportunityId = '';

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Add a hard blocker rule - card appears with usa-alert--error and Hard Blocker badge', async ({ page }) => {
    // Navigate to the grantor opportunities list to find an existing opportunity
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');

    // If an opportunity is listed, click on it; otherwise skip this test
    const oppLinks = page.locator('[data-testid="opportunity-link"], .opportunity-title, a[href*="/grantor/opportunities/"]');
    const count = await oppLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await oppLinks.first().click();
    await page.waitForLoadState('networkidle');

    // Get the opportunity ID from the URL
    const url = page.url();
    opportunityId = url.split('/grantor/opportunities/')[1]?.split('?')[0] ?? '';

    if (!opportunityId) {
      test.skip();
      return;
    }

    // Navigate directly to the builder with eligibility-rules tab
    await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
    await page.waitForLoadState('networkidle');

    // Click Eligibility Rules tab
    const eligibilityTab = page.getByTestId('tab-eligibility-rules');
    await expect(eligibilityTab).toBeVisible();
    await eligibilityTab.click();

    // Wait for the eligibility rule builder to load
    await expect(page.getByTestId('eligibility-rule-builder')).toBeVisible();

    // Click Add Rule
    const addRuleBtn = page.getByTestId('add-rule-button');
    await expect(addRuleBtn).toBeVisible();
    await addRuleBtn.click();

    // Wait for form
    await expect(page.getByTestId('rule-form')).toBeVisible();

    // Fill in the rule fields
    await page.getByTestId('field-rule-type').selectOption('applicant_type');
    await page.getByTestId('field-criterion-field').fill('entity_type');
    await page.getByTestId('field-operator').selectOption('equals');
    await page.getByTestId('field-criterion-value').fill('LLC');

    // Select hard_blocker severity
    await page.getByTestId('severity-hard-blocker').click();

    // Wait for enforcement point to appear
    await expect(page.getByTestId('field-enforcement-point')).toBeVisible();
    await page.getByTestId('field-enforcement-point').selectOption('pre_workspace');

    // Fill explanation text
    await page.getByTestId('field-explanation-text').fill('Must be LLC');

    // Save rule
    await page.getByTestId('save-rule-button').click();

    // Wait for the form to disappear and rule to appear
    await expect(page.getByTestId('rule-form')).not.toBeVisible({ timeout: 10000 });

    // Find the new rule card — look for usa-alert--error
    const errorCards = page.locator('.usa-alert--error');
    await expect(errorCards.first()).toBeVisible({ timeout: 5000 });

    // Verify "Hard Blocker" badge text
    const hardBlockerBadge = page.locator('.usa-tag').filter({ hasText: 'Hard Blocker' });
    await expect(hardBlockerBadge.first()).toBeVisible();

    // Verify criterion_field is shown in the card
    const ruleCard = page.locator('[data-severity="hard_blocker"]').first();
    await expect(ruleCard).toContainText('entity_type');
  });

  test('2. Advisory indicator styling - card has usa-alert--warning and Advisory badge', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');

    const oppLinks = page.locator('[data-testid="opportunity-link"], .opportunity-title, a[href*="/grantor/opportunities/"]');
    const count = await oppLinks.count();
    if (count === 0) test.skip();

    await oppLinks.first().click();
    await page.waitForLoadState('networkidle');

    const url = page.url();
    opportunityId = url.split('/grantor/opportunities/')[1]?.split('?')[0] ?? '';
    if (!opportunityId) test.skip();

    await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-eligibility-rules').click();
    await expect(page.getByTestId('eligibility-rule-builder')).toBeVisible();

    const addRuleBtn = page.getByTestId('add-rule-button');
    if (await addRuleBtn.isVisible()) {
      await addRuleBtn.click();
    }
    await expect(page.getByTestId('rule-form')).toBeVisible();

    await page.getByTestId('field-criterion-field').fill('entity_class');
    await page.getByTestId('field-criterion-value').fill('nonprofit');
    // advisory is the default
    await page.getByTestId('severity-advisory').click();
    await page.getByTestId('field-explanation-text').fill('Applicant should be a nonprofit for best fit');
    await page.getByTestId('save-rule-button').click();

    await expect(page.getByTestId('rule-form')).not.toBeVisible({ timeout: 10000 });

    // Verify advisory card styling
    const warningCards = page.locator('.usa-alert--warning');
    await expect(warningCards.first()).toBeVisible({ timeout: 5000 });

    const advisoryBadge = page.locator('.usa-tag').filter({ hasText: 'Advisory' });
    await expect(advisoryBadge.first()).toBeVisible();
  });

  test('3. Pre-screening questionnaire builder - add question and preview modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');

    const oppLinks = page.locator('[data-testid="opportunity-link"], .opportunity-title, a[href*="/grantor/opportunities/"]');
    const count = await oppLinks.count();
    if (count === 0) test.skip();

    await oppLinks.first().click();
    await page.waitForLoadState('networkidle');

    const url = page.url();
    opportunityId = url.split('/grantor/opportunities/')[1]?.split('?')[0] ?? '';
    if (!opportunityId) test.skip();

    await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
    await page.waitForLoadState('networkidle');

    // Navigate to Pre-Screening tab
    await page.getByTestId('tab-prescreening').click();
    await expect(page.getByTestId('prescreening-builder')).toBeVisible();

    // Click Add Question
    await page.getByTestId('add-question-button').click();
    await expect(page.getByTestId('question-form')).toBeVisible();

    // Fill question text
    await page.getByTestId('field-question-text').fill('Is your org a 501(c)(3)?');

    // Select yes_no type
    await page.getByTestId('q-type-yes_no').click();

    // Check required
    await page.getByTestId('field-is-required').check();

    // Save
    await page.getByTestId('save-question-button').click();
    await expect(page.getByTestId('question-form')).not.toBeVisible({ timeout: 5000 });

    // Verify question appears in list
    const questionsList = page.getByTestId('questions-list');
    await expect(questionsList).toContainText('Is your org a 501(c)(3)?');
    await expect(questionsList).toContainText('Yes/No');

    // Save All
    await page.getByTestId('save-all-button').click();
    await page.waitForTimeout(500); // brief wait for save

    // Click Preview
    await page.getByTestId('preview-button').click();

    // Verify preview modal opens
    const previewModal = page.getByTestId('preview-modal');
    await expect(previewModal).toBeVisible({ timeout: 10000 });

    // Verify question is rendered in modal
    await expect(previewModal).toContainText('Is your org a 501(c)(3)?');
  });

  test('4. Enforcement point required for hard blockers - client-side validation', async ({ page }) => {
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');

    const oppLinks = page.locator('[data-testid="opportunity-link"], .opportunity-title, a[href*="/grantor/opportunities/"]');
    const count = await oppLinks.count();
    if (count === 0) test.skip();

    await oppLinks.first().click();
    await page.waitForLoadState('networkidle');

    const url = page.url();
    opportunityId = url.split('/grantor/opportunities/')[1]?.split('?')[0] ?? '';
    if (!opportunityId) test.skip();

    await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('tab-eligibility-rules').click();
    await expect(page.getByTestId('eligibility-rule-builder')).toBeVisible();

    const addRuleBtn = page.getByTestId('add-rule-button');
    if (await addRuleBtn.isVisible()) {
      await addRuleBtn.click();
    }
    await expect(page.getByTestId('rule-form')).toBeVisible();

    // Fill required fields
    await page.getByTestId('field-criterion-field').fill('entity_type');
    await page.getByTestId('field-criterion-value').fill('LLC');
    await page.getByTestId('field-explanation-text').fill('Must be LLC');

    // Select hard_blocker WITHOUT selecting enforcement_point
    await page.getByTestId('severity-hard-blocker').click();

    // The enforcement_point field appears but we do NOT select a value
    await expect(page.getByTestId('field-enforcement-point')).toBeVisible();
    // Leave it at the default empty option

    // Try to save
    await page.getByTestId('save-rule-button').click();

    // Assert error message for enforcement_point
    const errorMsg = page.getByTestId('enforcement-point-error');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
    await expect(errorMsg).toContainText('Enforcement point is required for hard blocker rules');
  });
});
