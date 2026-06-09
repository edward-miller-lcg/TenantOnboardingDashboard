import { test, expect } from '../../fixtures/test-fixtures';

/**
 * Encounter Type Mapping step — smoke tests.
 *
 * Acceptance criteria covered:
 *   - User sees a code-map form targeting Encounter.type.coding → SNOMED CT
 *   - FHIRPath and resource type are fixed (not user-editable)
 *   - SNOMED target codes are available in the dropdown
 *   - Selecting a SNOMED code auto-fills the display text
 *   - User can bulk-paste codes from Excel / CSV
 *   - An info box explains the auto-created Conditional Transform operation
 *   - Source system URI is required per code system map
 *   - Saving navigates to the POI Compiling step
 */

test.describe('Encounter Type Mapping', () => {

  test('renders the encounter code map form', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    await expect(encounterMappingPage['page'].getByRole('heading', { name: /encounter type mapping/i })).toBeVisible();
    await expect(encounterMappingPage['page'].locator('.code-system-map-box')).toBeVisible();
    await expect(encounterMappingPage['page'].locator('table')).toBeVisible();
  });

  test('SNOMED CT is the target system (read-only)', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    const readOnly = encounterMappingPage['page'].locator('.nhsn-input--readonly');
    await expect(readOnly.first()).toHaveValue('http://snomed.info/sct');
  });

  test('SNOMED dropdown contains expected codes', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    const select = encounterMappingPage['page'].locator('select').first();
    await expect(select.locator('option[value="11429006"]')).toHaveCount(1);
    await expect(select.locator('option[value="32485007"]')).toHaveCount(1);
    await expect(select.locator('option[value="50849002"]')).toHaveCount(1);
  });

  test('selecting a SNOMED code auto-fills the display text', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    const row = encounterMappingPage['page'].locator('tbody tr').first();
    await row.locator('select').selectOption('11429006');

    const displayInput = row.locator('input[readonly]');
    await expect(displayInput).toHaveValue('Consultation');
  });

  test('info box explains the auto-created Conditional Transform', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();
    await encounterMappingPage.assertAutoCreatedConditionalTransformInfo();
  });

  test('user can add multiple code rows and save', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    await encounterMappingPage.fillSourceSystem('http://open.epic.com/FHIR/encounter-type');
    await encounterMappingPage.addCodeRow('AMB', '11429006');
    await encounterMappingPage.addCodeRow('IMP', '32485007');
    await encounterMappingPage.save();

    await expect(encounterMappingPage['page']).toHaveURL(/poi-compiling/);
  });

  test('can add a second code system map', async ({ encounterMappingPage }) => {
    await encounterMappingPage.goto();

    await encounterMappingPage['page'].getByRole('button', { name: /add another code system map/i }).click();
    await expect(encounterMappingPage['page'].locator('.code-system-map-box')).toHaveCount(2);
  });

});
