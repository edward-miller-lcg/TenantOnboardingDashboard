import { test, expect } from '../fixtures/test-fixtures';

/**
 * Compliance Attestation page
 * Source: Guided_Onboarding_Requirements.xlsx — "Engage/Compliance Attestation"
 * Priority: High
 *
 * AC Notes: Original story referenced a left-nav entry point within the NHSN app.
 * Our implementation is a standalone portal accessed via a session token URL.
 * Tests cover the attestation page behaviour; the NHSN nav integration is out of scope here.
 */

test.describe('Compliance Attestation', () => {

  test('displays the attestation heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await expect(page.getByRole('heading', { name: /compliance.*attestation/i })).toBeVisible();
  });

  test('displays the "I Agree" checkbox', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    const checkbox = page.getByRole('checkbox', { name: /agree|attest/i });
    await expect(checkbox).toBeVisible();
  });

  test('checkbox can be checked and unchecked', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    const checkbox = page.getByRole('checkbox', { name: /agree|attest/i });
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('displays guidance text about attestation requirement', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await expect(page.getByText(/must be agreed to before/i)).toBeVisible();
  });

  test('displays "Save & Continue" / primary action button', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await expect(page.locator('button.nhsn-btn-primary')).toBeVisible();
  });

  test('Contact Support link is visible', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible();
  });

  test('clicking Save & Continue advances to next step', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).not.toHaveURL(/compliance-attestation/);
  });

});
