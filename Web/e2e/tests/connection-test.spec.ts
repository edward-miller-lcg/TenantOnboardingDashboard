import { test, expect } from '../fixtures/test-fixtures';

/**
 * Connection Test page (success + failure)
 * Source: Guided_Onboarding_Requirements.xlsx
 *   - "Configuration/Connection Test"
 *   - "Configuration/Connection Test/Verification"
 *   - "Configuration/Connection Test/failure"
 */

test.describe('Connection Test — success', () => {

  test('displays "Connection Test" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/connection-test`);
    await expect(page.getByRole('heading', { name: /connection test/i })).toBeVisible();
  });

  test('displays a "Test Connection" or "Save & Continue" action button', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/connection-test`);
    const btn = page.locator('button.nhsn-btn-primary');
    await expect(btn).toBeVisible();
  });

  test('successful connection test shows success message', async ({ mockedPage: page, token }) => {
    // Mock returns { success: true } by default via applyAllMocks
    await page.goto(`/onboarding/${token}/connection-test`);
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page.getByText(/successfully connected|connection.*success/i)).toBeVisible();
  });

  test('success state advances to Patients of Interest on Continue', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/connection-test`);
    await page.locator('button.nhsn-btn-primary').click();
    // After success, either auto-navigates or shows a Continue button
    await page.waitForURL(/patients-of-interest/, { timeout: 5000 }).catch(async () => {
      await page.getByRole('button', { name: /continue/i }).click();
      await expect(page).toHaveURL(/patients-of-interest/);
    });
  });

});

test.describe('Connection Test — failure', () => {

  test('failed connection shows error details section', async ({ page, token }) => {
    // Override mock to return failure
    await page.route('**/api/onboarding/*/connection-test', route =>
      route.fulfill({ json: { success: false, errorDetails: 'Unable to reach FHIR server at https://fhir.example.org' } })
    );

    await page.goto(`/onboarding/${token}/connection-test`);
    await page.locator('button.nhsn-btn-primary').click();

    await expect(page.getByText(/unable to connect|error/i)).toBeVisible();
  });

  test('failure state shows error detail text', async ({ page, token }) => {
    await page.route('**/api/onboarding/*/connection-test', route =>
      route.fulfill({ json: { success: false, errorDetails: 'Connection timed out after 30 seconds.' } })
    );

    await page.goto(`/onboarding/${token}/connection-test`);
    await page.locator('button.nhsn-btn-primary').click();

    await expect(page.getByText(/timed out|error details/i)).toBeVisible();
  });

  test('failure state shows Contact Support link', async ({ page, token }) => {
    await page.route('**/api/onboarding/*/connection-test', route =>
      route.fulfill({ json: { success: false, errorDetails: 'Network error' } })
    );

    await page.goto(`/onboarding/${token}/connection-test`);
    await page.locator('button.nhsn-btn-primary').click();

    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible();
  });

});
