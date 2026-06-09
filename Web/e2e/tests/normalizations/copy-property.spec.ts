import { test, expect } from '../../fixtures/test-fixtures';

/**
 * Copy Property editor
 * Source: Guided_Onboarding_Requirements.xlsx
 *   Row labelled "Validation/Normalizations/Conditional Transformation" but
 *   the story description and AC clearly describe Copy Property — this is a
 *   labelling error in the spreadsheet.
 *
 * Tool tip text (from Tool Tips sheet):
 *   Name            — "Name that the facility will use to identify this normalization"
 *   Description     — "Description of what this normalization is used for"
 *   Resource Type   — "Resource type that this normalization will apply to"
 *   Source FHIR Path — "Path to the property that will be copied from"
 *   Target FHIR Path — "Path that the property will be copied to"
 *   Enabled         — "Whether the normalization will run or not during a report creation"
 */

test.describe('Copy Property editor', () => {

  test('displays "Copy Property" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByRole('heading', { name: /copy property/i })).toBeVisible();
  });

  test('has Name field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByLabel(/^name/i)).toBeVisible();
  });

  test('has Description field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('has Resource Type dropdown', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByLabel(/resource type/i)).toBeVisible();
  });

  test('has Source FHIR Path field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByLabel(/source.*fhir path/i)).toBeVisible();
  });

  test('has Target FHIR Path field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(page.getByLabel(/target.*fhir path/i)).toBeVisible();
  });

  test('has Enabled toggle or checkbox', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await expect(
      page.getByLabel(/enabled/i).or(page.getByRole('checkbox', { name: /enabled/i }))
    ).toBeVisible();
  });

  test('save navigates back to Normalizations list', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await page.getByLabel(/^name/i).fill('Copy Location ID');
    await page.getByLabel(/resource type/i).selectOption('Location');
    await page.getByLabel(/source.*fhir path/i).fill('Location.identifier');
    await page.getByLabel(/target.*fhir path/i).fill('Location.type');
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).toHaveURL(/\/normalizations$/);
  });

  test('Cancel navigates back to Normalizations list', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/normalizations/copy-property`);
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL(/\/normalizations$/);
  });

});
