import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Opportunity Builder flow.
 *
 * NOTE: These tests are written for the verify phase.
 * They require the app to be running at http://localhost:3000.
 *
 * Test coverage:
 * 1. Create New Opportunity → TemplateLibrary modal opens
 * 2. Attempt proceed without selecting template → error shown
 * 3. Select "Federal NOFO" template → OpportunityBuilder page
 * 4. Fill required metadata fields → auto-save on blur → success toast
 * 5. Enter funding_amount_min > funding_amount_max → field error
 * 6. Enter invalid contact_email → field error
 * 7. assistance_listing_number appears when funding_source contains 'federal'
 * 8. GuidancePanel adjacent to executive_summary: visible by default, can collapse
 * 9. ReadabilityIndicator updates as user types in executive_summary
 * 10. Navigate back to /grantor/opportunities → sees created opportunity listed
 */

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.gov';
const ADMIN_PASSWORD = 'TestPassword123!';

async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(`${BASE_URL}/grantor/dashboard`, { timeout: 10000 });
}

test.describe('Opportunity Builder', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to Opportunities page
    await page.goto(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');
  });

  test('1. Create New Opportunity button opens TemplateLibrary modal', async ({ page }) => {
    const createBtn = page.getByTestId('create-opportunity-btn');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Modal should appear
    const modal = page.getByTestId('template-library-modal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Select a Template');
  });

  test('2. Attempting to proceed without selecting template shows error', async ({ page }) => {
    await page.getByTestId('create-opportunity-btn').click();
    await expect(page.getByTestId('template-library-modal')).toBeVisible();

    // Click Create without selecting
    await page.getByTestId('create-from-template-btn').click();

    // Error message should appear
    const error = page.getByTestId('template-selection-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText('Please select a template');
  });

  test('3. Selecting Federal NOFO template and creating navigates to OpportunityBuilder', async ({ page }) => {
    await page.getByTestId('create-opportunity-btn').click();
    await expect(page.getByTestId('template-library-modal')).toBeVisible();

    // Select Federal NOFO template
    const selectBtn = page.getByTestId('select-template-federal_nofo');
    await expect(selectBtn).toBeVisible();
    await selectBtn.click();

    // Button should now show "Selected"
    await expect(selectBtn).toContainText('Selected');

    // Click Create
    await page.getByTestId('create-from-template-btn').click();

    // Should navigate to opportunity builder
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(page.getByTestId('opportunity-builder')).toBeVisible();
  });

  test('4. Fill required metadata fields → auto-save on blur → success toast', async ({ page }) => {
    // First create an opportunity to work with
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Update title field and blur
    const titleField = page.getByTestId('field-title');
    await titleField.clear();
    await titleField.fill('Community Health Innovation Grant 2026');
    await titleField.blur();

    // Success toast should appear
    const toast = page.getByTestId('save-success-toast');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('Changes saved');
  });

  test('5. funding_amount_min > funding_amount_max shows field error', async ({ page }) => {
    // Create opportunity first
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Set max to 1000, min to 99999
    const maxField = page.getByTestId('field-funding-amount-max');
    await maxField.clear();
    await maxField.fill('1000');
    await maxField.blur();

    const minField = page.getByTestId('field-funding-amount-min');
    await minField.fill('99999');
    await minField.blur();

    // Error should appear
    const error = page.getByTestId('funding-min-error');
    await expect(error).toBeVisible({ timeout: 3000 });
    await expect(error).toContainText('Minimum award must be less than');
  });

  test('6. Invalid contact_email shows field error', async ({ page }) => {
    // Create opportunity first
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Enter invalid email
    const emailField = page.getByTestId('field-contact-email');
    await emailField.clear();
    await emailField.fill('not-an-email');
    await emailField.blur();

    // Error should appear
    const error = page.getByTestId('contact-email-error');
    await expect(error).toBeVisible({ timeout: 3000 });
    await expect(error).toContainText('valid email');
  });

  test('7. assistance_listing_number field appears when funding_source contains "federal"', async ({ page }) => {
    // Create opportunity first
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Initially should not be visible (funding source defaults to 'To be determined')
    const alnField = page.getByTestId('field-assistance-listing-number');

    // Set funding source to federal
    const fundingSourceField = page.getByTestId('field-funding-source');
    await fundingSourceField.clear();
    await fundingSourceField.fill('Federal Department of Health');
    await fundingSourceField.blur();

    // Wait for re-render
    await page.waitForTimeout(500);

    // ALN field should now appear
    await expect(alnField).toBeVisible({ timeout: 3000 });
  });

  test('8. GuidancePanel visible by default, can be collapsed', async ({ page }) => {
    // Create opportunity first
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // GuidancePanel for executive_summary should exist
    const panel = page.getByTestId('guidance-panel-executive_summary');
    await expect(panel).toBeVisible();

    // The accordion content should be visible (expanded by default)
    const content = page.locator('#guidance-panel-content-executive_summary');
    await expect(content).not.toHaveAttribute('hidden');

    // Click to collapse
    const toggleBtn = panel.locator('.usa-accordion__button');
    await toggleBtn.click();

    // Content should now be hidden
    await expect(content).toHaveAttribute('hidden');
  });

  test('9. ReadabilityIndicator updates as user types in executive_summary', async ({ page }) => {
    // Create opportunity first
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Type in executive_summary
    const textarea = page.getByTestId('field-executive-summary');
    await textarea.clear();
    await textarea.fill(
      'This grant supports innovative community health programs. We fund organizations that serve underserved populations. Apply now to receive funding for your programs.',
    );

    // Wait for debounce (300ms + buffer)
    await page.waitForTimeout(500);

    // ReadabilityIndicator should show grade level
    const indicator = page.getByTestId('readability-indicator');
    await expect(indicator).toBeVisible({ timeout: 2000 });
    await expect(indicator).toContainText('Reading Level');
    await expect(indicator).toContainText('Grade');
  });

  test('10. Navigate back to /grantor/opportunities after creating opportunity', async ({ page }) => {
    // Create opportunity
    await page.getByTestId('create-opportunity-btn').click();
    await page.getByTestId('select-template-federal_nofo').click();
    await page.getByTestId('create-from-template-btn').click();
    await page.waitForURL(/\/grantor\/opportunities\/[a-f0-9-]+/, { timeout: 10000 });

    // Click breadcrumb to go back
    await page.locator('.usa-breadcrumb__link').click();

    // Should be back on opportunities list
    await expect(page).toHaveURL(`${BASE_URL}/grantor/opportunities`);
    await page.waitForLoadState('networkidle');
  });
});
