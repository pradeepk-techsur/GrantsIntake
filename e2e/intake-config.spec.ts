import { test, expect } from '@playwright/test';

/**
 * E2E tests for Conditional Sections, Attachment Requirements, and Screening Criteria UI.
 *
 * NOTE: These tests are written for the verify phase.
 * They require the app to be running at http://localhost:3000
 * with migrations applied and seed data present.
 *
 * Test coverage:
 * 1. Add attachment requirement → new row appears in full_application stage table
 * 2. Auto criteria are locked (no delete button, lock icon with aria-label)
 * 3. Add manual screening criterion → appears in manual criteria list
 * 4. Conditional section config → section card appears with section_key and condition count
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
 */
async function createTestOpportunity(page: import('@playwright/test').Page): Promise<string> {
  const loginRes = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { access_token } = await loginRes.json() as { access_token: string };

  // Get all programs to find one we can use
  const progsRes = await page.request.get(`${BASE_URL}/api/v1/programs`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const programs = await progsRes.json() as Array<{ program_id: string }>;

  if (!programs.length) {
    throw new Error('No programs found. Ensure seed data is present.');
  }

  const programId = programs[0].program_id;
  const timestamp = Date.now();

  const createRes = await page.request.post(
    `${BASE_URL}/api/v1/programs/${programId}/opportunities`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        title: `Intake Config E2E Test ${timestamp}`,
        funding_source: 'Federal Test Agency',
        announcement_type: 'Initial',
        opportunity_number: `IC-E2E-${timestamp}`,
        eligibility_summary: 'Test eligibility',
        executive_summary: 'E2E intake config test opportunity',
        contact_name: 'Test Contact',
        contact_email: 'test@example.gov',
        program_area: 'Health',
      },
    },
  );

  const opp = await createRes.json() as { opportunity_id: string };
  return opp.opportunity_id;
}

// ─── Test: Add attachment requirement ─────────────────────────────────────────

test('Add attachment requirement → new row appears in full_application stage table', async ({ page }) => {
  await login(page);
  const opportunityId = await createTestOpportunity(page);

  // Navigate to builder with attachments tab
  await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
  await page.waitForSelector('[data-testid="opportunity-builder"]', { timeout: 10000 });

  // Click the Attachments tab
  await page.getByTestId('tab-attachments').click();
  await page.waitForSelector('[data-testid="add-requirement-btn"]', { timeout: 5000 });

  // Click "Add Document Requirement"
  await page.getByTestId('add-requirement-btn').click();
  await page.waitForSelector('[data-testid="attachment-form"]', { timeout: 3000 });

  // Select document_type = financial_statements
  await page.getByTestId('document-type-select').selectOption('financial_statements');

  // Select stage = full_application
  await page.getByTestId('stage-scope-select').selectOption('full_application');

  // Check Nonprofit applicant type
  await page.getByTestId('applicant-type-nonprofit').check();

  // Ensure is_required is set to true (default)
  await page.getByTestId('is-required-yes').check();

  // Set max file size to 25 MB
  await page.getByTestId('max-file-size-input').fill('25');

  // Click Save
  await page.getByTestId('save-requirement-btn').click();

  // Assert: new row appears in full_application stage table
  await page.waitForSelector('[data-testid="stage-group-full_application"]', { timeout: 5000 });
  const stageGroup = page.getByTestId('stage-group-full_application');
  await expect(stageGroup).toBeVisible();

  // The table should contain "Financial Statements"
  const fullAppSection = page.locator('[data-testid="stage-group-full_application"]').locator('..');
  await expect(fullAppSection).toContainText('Financial Statements');
  await expect(fullAppSection).toContainText('Nonprofit');
  await expect(fullAppSection).toContainText('Required');
});

// ─── Test: Auto criteria are locked ──────────────────────────────────────────

test('Auto criteria are locked — lock icon present, no delete button', async ({ page }) => {
  await login(page);
  const opportunityId = await createTestOpportunity(page);

  // Seed an auto criterion via API
  const loginRes = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const { access_token } = await loginRes.json() as { access_token: string };

  await page.request.post(
    `${BASE_URL}/api/v1/opportunities/${opportunityId}/screening-criteria`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        criterion_text: 'Verify application completeness',
        criterion_type: 'auto',
        auto_criterion_key: 'completeness_check',
        is_required: true,
        display_order: 0,
      },
    },
  );

  // Navigate to builder with screening tab
  await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
  await page.waitForSelector('[data-testid="opportunity-builder"]', { timeout: 10000 });

  // Click the Screening Criteria tab
  await page.getByTestId('tab-screening').click();
  await page.waitForSelector('[data-testid="auto-criteria-list"]', { timeout: 5000 });

  // Assert: "Completeness Check" row has a lock icon
  const autoCard = page.getByTestId('auto-criterion-completeness_check');
  await expect(autoCard).toBeVisible();

  // Assert: lock icon has aria-label="System criterion — cannot be deleted"
  const lockIcon = autoCard.locator('[aria-label="System criterion — cannot be deleted"]');
  await expect(lockIcon).toBeVisible();

  // Assert: no delete button inside the auto criterion card
  const deleteBtn = autoCard.getByTestId(`delete-criterion-${await autoCard.getAttribute('data-testid') ?? ''}`);
  // More reliable: check no delete button exists in the auto-criteria-list
  const autoCriteriaList = page.getByTestId('auto-criteria-list');
  const deleteButtons = autoCriteriaList.locator('button', { hasText: 'Delete' });
  await expect(deleteButtons).toHaveCount(0);
});

// ─── Test: Add manual screening criterion ─────────────────────────────────────

test('Add manual screening criterion → appears in manual criteria list', async ({ page }) => {
  await login(page);
  const opportunityId = await createTestOpportunity(page);

  // Navigate to builder with screening tab
  await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
  await page.waitForSelector('[data-testid="opportunity-builder"]', { timeout: 10000 });

  // Click the Screening Criteria tab
  await page.getByTestId('tab-screening').click();
  await page.waitForSelector('[data-testid="add-criterion-btn"]', { timeout: 5000 });

  // Click "Add Criterion"
  await page.getByTestId('add-criterion-btn').click();
  await page.waitForSelector('[data-testid="criterion-form"]', { timeout: 3000 });

  // Fill criterion_text
  await page.getByTestId('criterion-text-input').fill(
    'Verify authorized representative signature',
  );

  // Ensure is_required is checked (default)
  await expect(page.getByTestId('criterion-required-checkbox')).toBeChecked();

  // Click Save
  await page.getByTestId('save-criterion-btn').click();

  // Assert: criterion appears in manual criteria list
  await page.waitForSelector('[data-testid="manual-criteria-list"]', { timeout: 5000 });
  const manualList = page.getByTestId('manual-criteria-list');
  await expect(manualList).toContainText('Verify authorized representative signature');
});

// ─── Test: Conditional section config ─────────────────────────────────────────

test('Conditional section config → section card appears with section_key and condition count', async ({ page }) => {
  await login(page);
  const opportunityId = await createTestOpportunity(page);

  // Navigate to builder with conditional-sections tab
  await page.goto(`${BASE_URL}/grantor/opportunities/${opportunityId}`);
  await page.waitForSelector('[data-testid="opportunity-builder"]', { timeout: 10000 });

  // Click the Conditional Sections tab
  await page.getByTestId('tab-conditional-sections').click();
  await page.waitForSelector('[data-testid="section-condition-form"]', { timeout: 5000 });

  // Enter section_key
  await page.getByTestId('section-key-input').fill('budget_section');

  // Fill condition row
  await page.getByTestId('condition-type-0').selectOption('applicant_type');
  await page.getByTestId('condition-field-0').fill('entity_type');
  await page.getByTestId('condition-operator-0').selectOption('equals');
  await page.getByTestId('condition-value-0').fill('nonprofit');

  // Click Save Conditions
  await page.getByTestId('save-conditions-btn').click();

  // Assert: section card appears
  await page.waitForSelector('[data-testid="section-card-budget_section"]', { timeout: 5000 });
  const sectionCard = page.getByTestId('section-card-budget_section');
  await expect(sectionCard).toBeVisible();
  await expect(sectionCard).toContainText('budget_section');
  await expect(sectionCard).toContainText('1 condition');
});
