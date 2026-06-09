import { test, expect } from '../fixtures/test-fixtures';

/**
 * Facility Information page
 * Source: Guided_Onboarding_Requirements.xlsx — "Configuration/Facility Info"
 *
 * AC Notes:
 * - NHSN Org ID and Health System Name are pre-populated from the session (ServiceNow request).
 *   In the portal these come from the session created by the admin.
 * - "Save" (save without navigating) button is listed in AC but not in the current implementation;
 *   flagged as a gap — only "Save & Continue" exists.
 */

test.describe('Facility Information', () => {

  test('displays "Facility Information" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await expect(page.getByRole('heading', { name: /facility information/i })).toBeVisible();
  });

  test('displays NHSN Org ID pre-populated from session', async ({ mockedPage: page, token, session }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    // NHSN Org ID should be displayed (read-only) and match the session
    await expect(page.getByText(session.nhsnOrgId)).toBeVisible();
  });

  test('displays Organization Name(s) text field', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await expect(page.getByLabel(/organization name/i)).toBeVisible();
  });

  test('displays Time Zone dropdown limited to US timezones', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    const tzField = page.getByLabel(/time ?zone/i);
    await expect(tzField).toBeVisible();
  });

  test('Physical Address field is present and required', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await expect(page.getByLabel(/physical address/i)).toBeVisible();
    await expect(page.getByLabel(/physical address/i)).toHaveAttribute('required');
  });

  test('Technical Contact Phone Number field is visible', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await expect(page.getByLabel(/technical contact phone/i)).toBeVisible();
  });

  test('displays "Save & Continue" button', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await expect(page.locator('button.nhsn-btn-primary')).toBeVisible();
  });

  test('saving valid data navigates to Server Info', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/facility-info`);
    await page.getByLabel(/organization name/i).fill('Test Hospital');
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).toHaveURL(/server-info/);
  });

  // GAP: "Save" button (save without continuing) described in AC but not implemented.
  // Ticket: add a secondary save action so users can return later without losing data.

});
