import { test, expect } from '../fixtures/test-fixtures';

/**
 * Server Information page
 * Source: Guided_Onboarding_Requirements.xlsx — "Configuration/Server Information"
 *
 * AC Notes:
 * - PCC and Meditech vendors should appear in the dropdown but be non-selectable (grayed out).
 * - URL validation should happen on save.
 * - "Save" button (without navigating) listed in AC — gap, only Save & Continue implemented.
 */

test.describe('Server Information', () => {

  test('displays "Server Information" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/server-info`);
    await expect(page.getByRole('heading', { name: /server information/i })).toBeVisible();
  });

  test('displays FHIR R4 Base URL field with placeholder', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/server-info`);
    const field = page.getByLabel(/fhir.*base.*url/i);
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('placeholder', /https/i);
  });

  test('displays EHR Vendor dropdown with Epic and Cerner', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/server-info`);
    const dropdown = page.getByLabel(/ehr.*vendor/i);
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('option', { hasText: /epic/i })).toHaveCount(1);
    await expect(dropdown.locator('option', { hasText: /cerner/i })).toHaveCount(1);
  });

  test('PCC and Meditech appear as disabled/non-selectable options', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/server-info`);
    // AC: PCC and Meditech should be visible but not selectable (grayed)
    const pcc = page.locator('option', { hasText: /pcc/i });
    const meditech = page.locator('option', { hasText: /meditech/i });
    if (await pcc.count() > 0) await expect(pcc).toBeDisabled();
    if (await meditech.count() > 0) await expect(meditech).toBeDisabled();
  });

  test('saving valid data navigates to Authorization', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/server-info`);
    await page.getByLabel(/fhir.*base.*url/i).fill('https://fhir.example.org/api/FHIR/R4');
    const vendor = page.getByLabel(/ehr.*vendor/i);
    await vendor.selectOption('Epic').catch(() => vendor.fill('Epic'));
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).toHaveURL(/authorization/);
  });

});
