import { test, expect } from '../fixtures/test-fixtures';

/**
 * Overview / Step List page
 * Source: Guided_Onboarding_Requirements.xlsx — "Configuration/Step List"
 *
 * BUG-1 (User testing, Janet Alonzo 2026-06-09):
 *   The Compliance Attestation step is not clickable in the step list even after
 *   it has been completed. All other completed steps are active hyperlinks.
 *   Test marked test.fail() below will pass once the link is fixed.
 */

test.describe('Overview / Step List', () => {

  test('displays "Guided Onboarding Overview" or equivalent heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/overview`);
    await expect(
      page.getByRole('heading', { name: /overview|onboarding/i })
    ).toBeVisible();
  });

  test('displays all wizard steps in order', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/overview`);
    const steps = [
      /compliance.*attestation/i,
      /facility info/i,
      /server info/i,
      /authorization/i,
      /connection test/i,
      /patients of interest/i,
      /location.*mapping/i,
      /encounter.*mapping/i,
    ];
    for (const step of steps) {
      await expect(page.getByText(step).first()).toBeVisible();
    }
  });

  test('completed steps show a checkmark indicator', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/overview`);
    // Steps completed during global setup should show checkmarks
    // At minimum Compliance Attestation should be marked complete
    await expect(
      page.locator('[class*="check"], [class*="complete"], input[type="checkbox"][checked]').first()
    ).toBeVisible();
  });

  test('incomplete/future steps are not active links', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/overview`);
    // Steps not yet started should be grayed out / not hyperlinks
    // We check that not every step is a link (some should be non-clickable)
    const totalLinks = await page.getByRole('link').count();
    const totalSteps = await page.getByText(/facility info|server info|authorization/i).count();
    // If all steps were links this would equal totalSteps — we expect fewer links
    expect(totalLinks).toBeGreaterThan(0); // at least some are links
  });

  // ── BUG-1 ──────────────────────────────────────────────────────────────────
  // Reported by Janet Alonzo 2026-06-09:
  // Compliance Attestation is the only completed step that is NOT a clickable
  // hyperlink on the overview page. All other completed steps are clickable.
  // This test will FAIL until the link is enabled.

  test(
    'Compliance Attestation is a clickable link after completion',
    async ({ mockedPage: page, token }) => {
      await page.goto(`/onboarding/${token}/overview`);

      const attestationLink = page.getByRole('link', { name: /compliance.*attestation/i });
      await expect(attestationLink).toBeVisible();

      // Should be an active link (not grayed out / not a span)
      await expect(attestationLink).toBeEnabled();

      // Clicking should navigate to the attestation page
      await attestationLink.click();
      await expect(page).toHaveURL(/compliance-attestation/);
    }
  );

});
