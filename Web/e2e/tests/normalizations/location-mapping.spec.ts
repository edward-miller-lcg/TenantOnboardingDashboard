import { test, expect } from '../../fixtures/test-fixtures';

/**
 * Location Type Mapping step — smoke tests.
 *
 * Acceptance criteria covered:
 *   - User sees the guided HSLOC mapping form (not the old checkbox)
 *   - Source system URI field is required — save is blocked without it
 *   - User can enter code rows manually
 *   - Paste from Excel (TSV) populates the table correctly
 *   - HSLOC target system URI is read-only and pre-filled
 *   - Saving navigates to the Encounter Type Mapping step
 *   - Descriptive text explains what the two created operations will do
 */

test.describe('Location Type Mapping — HSLOC code map (Option A)', () => {

  test('renders the guided HSLOC mapping form', async ({ locationMappingPage }) => {
    await locationMappingPage.goto();

    await expect(locationMappingPage['page'].getByRole('heading', { name: /location code mapping/i })).toBeVisible();
    await expect(locationMappingPage['page'].getByLabel(/source system uri/i)).toBeVisible();
    await expect(locationMappingPage['page'].locator('table')).toBeVisible();
  });

  test('HSLOC target system is read-only and shows CDC NHSN URI', async ({ locationMappingPage }) => {
    await locationMappingPage.goto();

    const targetInput = locationMappingPage['page'].locator('input[disabled]').filter({ hasText: '' }).nth(0);
    const readOnlyInput = locationMappingPage['page'].locator('.nhsn-input--readonly').first();
    await expect(readOnlyInput).toBeVisible();
    await expect(readOnlyInput).toHaveValue(/hsloc/);
  });

  test('save is blocked when source system URI is empty', async ({ locationMappingPage }) => {
    await locationMappingPage.goto();
    await locationMappingPage.assertSourceSystemRequired();
    await expect(locationMappingPage.errorMessage.first()).toBeVisible();
  });

  test('user can add code rows manually and save', async ({ locationMappingPage }) => {
    await locationMappingPage.goto();

    await locationMappingPage.fillMappings([
      { sourceCode: 'EDCS', targetCode: '1029-8', display: 'Emergency Department' },
      { sourceCode: 'ICU',  targetCode: '1060-3', display: 'Medical Critical Care' },
    ]);

    // Mock the POST to succeed
    await locationMappingPage.save();

    await expect(locationMappingPage['page']).toHaveURL(/encounter-type-mapping/);
  });

  test('paste from Excel (TSV) populates the table', async ({ locationMappingPage, page }) => {
    await locationMappingPage.goto();

    // Simulate clipboard paste via page.evaluate
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', 'EDCS\t1029-8\tEmergency Department\nICU\t1060-3\tMedical Critical Care');
      const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true });
      document.querySelector('[tabindex="0"]')?.dispatchEvent(pasteEvent);
    });

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.first().locator('input').nth(0)).toHaveValue('EDCS');
    await expect(rows.first().locator('input').nth(1)).toHaveValue('1029-8');
  });

  test('explains the two operations that will be created', async ({ locationMappingPage }) => {
    await locationMappingPage.goto();

    const body = locationMappingPage['page'].locator('p');
    await expect(body.filter({ hasText: /code map/i }).first()).toBeVisible();
    await expect(body.filter({ hasText: /copy location/i }).first()).toBeVisible();
  });

});
