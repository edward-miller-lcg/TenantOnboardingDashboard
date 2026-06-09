import { test, expect } from '../fixtures/test-fixtures';

/**
 * Authorization step
 * Source: Guided_Onboarding_Requirements.xlsx
 *   - "Configuration/Authorization/Epic"
 *   - "Configuration/Authentication/Cerner"
 *
 * BUG-2 (User testing, Janet Alonzo 2026-06-09):
 *   Checkbox state is not restored when returning to a completed Authorization step.
 *   The session marks the step complete but the checkbox renders unchecked.
 */

test.describe('Authorization', () => {

  test('displays "Authorization" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/authorization`);
    await expect(page.getByRole('heading', { name: /authorization/i })).toBeVisible();
  });

  test('displays text describing what access is being granted', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/authorization`);
    // AC: "Add text advising site that they are going to be granting access to NHSNLink"
    await expect(page.locator('p, .description, [class*="text"]').first()).toBeVisible();
  });

  test('displays EHR setup confirmation checkbox', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/authorization`);
    await expect(
      page.getByRole('checkbox', { name: /completed.*setup|set up requirements/i })
    ).toBeVisible();
  });

  test('checkbox can be checked and unchecked', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/authorization`);
    const checkbox = page.getByRole('checkbox');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('Save & Continue advances to Connection Test', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/authorization`);
    await page.getByRole('checkbox').check();
    await page.locator('button.nhsn-btn-primary').click();
    await expect(page).toHaveURL(/connection-test/);
  });

  // ── BUG-2 ──────────────────────────────────────────────────────────────────
  // Reported by Janet Alonzo 2026-06-09:
  // When returning to the Authorization page from a later step, the checkbox
  // appears unchecked even though the step is marked complete in the session.
  // This test will FAIL until the component restores checkbox state from session.
  test(
    'checkbox is pre-checked when returning to a completed Authorization step',
    async ({ mockedPage: page, token }) => {
      // Complete the step first
      await page.goto(`/onboarding/${token}/authorization`);
      await page.getByRole('checkbox').check();
      await page.locator('button.nhsn-btn-primary').click();
      await expect(page).toHaveURL(/connection-test/);

      // Navigate back to Authorization
      await page.goto(`/onboarding/${token}/authorization`);

      // The checkbox should be restored to checked from session.stepProgress
      await expect(page.getByRole('checkbox')).toBeChecked();
    }
  );

});
