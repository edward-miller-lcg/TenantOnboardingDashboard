import { test, expect } from '../../fixtures/test-fixtures';

/**
 * Code Map editor
 * Source: Guided_Onboarding_Requirements.xlsx — "Validation/Normalizations/Code Map"
 *
 * Tool tip text (from Tool Tips sheet):
 *   Name        — "Name for the facility to identify this code map"
 *   Description — "Description of what this code map is used for"
 *   Resource Type — "Resource type that this code map will apply to"
 *   FHIR Path   — "Path to the property that will be mapped"
 *   Source System — "Local code system that will be mapped"
 *   Target System — "Target code system for this code map"
 */

test.describe('Code Map editor', () => {

  test('displays "Code Map" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await expect(page.getByRole('heading', { name: /code map/i })).toBeVisible();
  });

  test('has Name field (alphanumeric)', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await expect(page.getByLabel(/^name/i)).toBeVisible();
  });

  test('has Description field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('has Resource Type dropdown populated from FHIR resource list', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    const rt = page.getByLabel(/resource type/i);
    await expect(rt).toBeVisible();
    // Should have options for common resource types
    await expect(rt.locator('option', { hasText: /encounter/i })).toHaveCount(1);
    await expect(rt.locator('option', { hasText: /location/i })).toHaveCount(1);
  });

  test('has FHIR Path text field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await expect(page.getByLabel(/fhir path/i)).toBeVisible();
  });

  test('Code System Maps section has Source System and Target System fields', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await expect(page.getByLabel(/source system/i)).toBeVisible();
    await expect(page.getByLabel(/target system/i)).toBeVisible();
  });

  test('code table defaults to 3 empty rows', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);
  });

  test('Delete row link removes a code row', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    const rows = page.locator('tbody tr');
    const initial = await rows.count();
    await rows.first().getByRole('link', { name: /delete/i }).click();
    await expect(rows).toHaveCount(initial - 1);
  });

  test('trash icon on code system map prompts confirmation', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    // AC: clicking trash shows "Clicking ok will delete all Code System map detail."
    page.once('dialog', d => {
      expect(d.message()).toMatch(/delete all code system map/i);
      d.dismiss();
    });
    await page.getByRole('button', { name: /remove|trash|delete map/i }).first().click();
  });

  test('"Add code system map" button adds another Code System Map block', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    const initial = await page.locator('.code-system-map-box, [class*="csm"]').count();
    await page.getByRole('button', { name: /add.*code system map/i }).click();
    await expect(page.locator('.code-system-map-box, [class*="csm"]')).toHaveCount(initial + 1);
  });

  test('save navigates back to Normalizations list', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await page.getByLabel(/^name/i).fill('Test Code Map');
    await page.getByLabel(/resource type/i).selectOption('Encounter');
    await page.getByLabel(/fhir path/i).fill('Encounter.type.coding');
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).toHaveURL(/\/normalizations$/);
  });

  test('Cancel navigates back to Normalizations list', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/code-map`);
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/normalizations$/);
  });

});
