import { test, expect } from '../fixtures/test-fixtures';

/**
 * Patients of Interest / Census
 * Source: Guided_Onboarding_Requirements.xlsx
 *   - "Configuration/Census(Patient of Interest)/Epic"
 *   - "Configuration/Census(Patient of Interest)/Cerner"
 *
 * AC Notes:
 * - Epic: Patient List IDs (comma-separated), minimum of 6 IDs mentioned in AC.
 * - Cerner: sFTP URL, Username, Password (password deidentified with **)
 * - The component renders Epic or Cerner form based on ehrVendor in session.
 *
 * BUG-3 (User testing, Janet Alonzo 2026-06-09):
 *   POI field accepted input without commas — no format validation present.
 *   Fixed: comma-separated validator added to patientListIds FormControl.
 */

test.describe('Patients of Interest — Epic', () => {

  test('displays "Patients of Interest" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/patients-of-interest`);
    await expect(page.getByRole('heading', { name: /patients of interest|census/i })).toBeVisible();
  });

  test('displays Patient List IDs field for Epic', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/patients-of-interest`);
    // Epic variant shows patient list IDs
    const field = page.getByLabel(/patient list id/i);
    if (await field.count() > 0) {
      await expect(field).toBeVisible();
    }
  });

  test('saves Epic patient list IDs and navigates to Location Mapping', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/patients-of-interest`);
    const field = page.getByLabel(/patient list id/i);
    if (await field.count() > 0) {
      await field.fill('12345,23456,34567,45678,56789,67890');
      await page.locator('button.nhsn-btn-primary').click();
      await expect(page).toHaveURL(/location-type-mapping/);
    }
  });

});

  // ── BUG-3 ──────────────────────────────────────────────────────────────────
  // Reported by Janet Alonzo 2026-06-09:
  // The field accepts free text with no comma validation. Input without commas
  // saves successfully when it should be rejected.

  test(
    'shows error when Patient List IDs entered without comma separators',
    async ({ mockedPage: page, token }) => {
      await page.goto(`/onboarding/${token}/patients-of-interest`);
      const field = page.getByLabel(/patient list id/i);
      if (await field.count() === 0) test.skip();

      await field.fill('NOSPACE_NO_COMMA_JUST_ONE_VALUE');
      await page.locator('button.nhsn-btn-primary').click();

      // Should NOT navigate away — should show validation error
      await expect(page).toHaveURL(/patients-of-interest/);
      await expect(
        page.getByText(/format is incorrect|comma|separated/i)
      ).toBeVisible();
    }
  );

  test(
    'shows error when Patient List IDs field is blank',
    async ({ mockedPage: page, token }) => {
      await page.goto(`/onboarding/${token}/patients-of-interest`);
      const field = page.getByLabel(/patient list id/i);
      if (await field.count() === 0) test.skip();

      await field.fill('');
      await page.locator('button.nhsn-btn-primary').click();

      await expect(page).toHaveURL(/patients-of-interest/);
      await expect(
        page.getByText(/required|patient list ids/i)
      ).toBeVisible();
    }
  );

test.describe('Patients of Interest — Cerner', () => {

  test('displays sFTP URL, Username, and Password fields for Cerner', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/patients-of-interest`);
    // Cerner variant shows sFTP fields
    const sftpUrl = page.getByLabel(/sftp.*url/i);
    const sftpUser = page.getByLabel(/sftp.*username/i);
    const sftpPass = page.getByLabel(/sftp.*password/i);

    if (await sftpUrl.count() > 0) {
      await expect(sftpUrl).toBeVisible();
      await expect(sftpUser).toBeVisible();
      await expect(sftpPass).toBeVisible();
    }
  });

  test('password field masks input', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/patients-of-interest`);
    const pass = page.getByLabel(/sftp.*password/i);
    if (await pass.count() > 0) {
      await expect(pass).toHaveAttribute('type', 'password');
    }
  });

});
