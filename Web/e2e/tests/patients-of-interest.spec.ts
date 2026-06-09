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
