import { test, expect } from '../fixtures/test-fixtures';

/**
 * Operations / completion page
 * Source: Guided_Onboarding_Requirements.xlsx — "Operations"
 *
 * AC: User sees "NHSNLink has been Configured successfully!" with a badge-check icon.
 * All prior steps are shown as blue hyperlinks. A "Submission Dashboard" button is displayed.
 */

test.describe('Operations — onboarding complete', () => {

  test('displays completion success message', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/operations`);
    await expect(
      page.getByText(/configured successfully|onboarding complete/i)
    ).toBeVisible();
  });

  test('displays all prior steps as active links', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/operations`);
    // Each completed step should be a clickable link
    await expect(page.getByRole('link', { name: /facility info/i })
      .or(page.getByRole('link', { name: /facility/i })).first()).toBeVisible();
  });

  test('displays a button to access the Submission Dashboard', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/operations`);
    await expect(
      page.getByRole('button', { name: /submission dashboard|dashboard/i })
        .or(page.getByRole('link', { name: /submission dashboard|dashboard/i }))
    ).toBeVisible();
  });

  test('Contact Support link is still available on the completion page', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/operations`);
    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible();
  });

});
