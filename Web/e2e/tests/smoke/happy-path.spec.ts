import { test, expect } from '../../fixtures/test-fixtures';
import { applyAllMocks } from '../../mocks/api-mocks';

/**
 * Onboarding wizard — full happy-path smoke test.
 *
 * This test walks the entire wizard in sequence with the minimum required input,
 * verifying that each step navigates to the next. It is intentionally broad —
 * deep validation of each step lives in the step-specific spec files.
 *
 * Acceptance criteria covered:
 *   - A new session can be created and the wizard is accessible via its token URL
 *   - All 10 guided steps are completable end-to-end
 *   - The Location and Encounter mapping steps accept valid input and advance
 *   - The Normalizations list is reachable after completing the wizard
 */

test.describe('Onboarding wizard — happy path smoke', () => {

  test('completes full wizard flow end-to-end', async ({ page, session }) => {
    await applyAllMocks(page);
    const token = session.token;

    // ── Step 1: Compliance Attestation ───────────────────────────────────────
    await page.goto(`/onboarding/${token}/compliance-attestation`);
    await page.getByRole('heading', { name: /compliance|attestation/i }).waitFor();
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 2: Facility Info ─────────────────────────────────────────────────
    await page.waitForURL(/facility-info/);
    await page.getByLabel(/organization name/i).fill('Playwright Test Hospital');
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 3: Server Info ───────────────────────────────────────────────────
    await page.waitForURL(/server-info/);
    await page.getByLabel(/fhir.*base.*url/i).fill('https://fhir.test-hospital.org/api/FHIR/R4');
    const vendorSelect = page.getByLabel(/ehr.*vendor/i);
    await vendorSelect.selectOption('Epic').catch(() => vendorSelect.fill('Epic'));
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 4: Authorization ─────────────────────────────────────────────────
    await page.waitForURL(/authorization/);
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 5: Connection Test ───────────────────────────────────────────────
    await page.waitForURL(/connection-test/);
    await page.locator('button.nhsn-btn-primary').click();
    // Mock returns success, wait for navigation
    await page.waitForURL(/patients-of-interest/);

    // ── Step 6: Patients of Interest ─────────────────────────────────────────
    await page.getByLabel(/patient list/i).fill('12345');
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 7: Location Type Mapping (HSLOC code map) ────────────────────────
    await page.waitForURL(/location-type-mapping/);
    await expect(page.getByRole('heading', { name: /location code mapping/i })).toBeVisible();

    await page.getByLabel(/source system uri/i).fill('urn:test:epic:location');
    // Fill first code row
    const rows = page.locator('tbody tr');
    await rows.first().locator('input').nth(0).fill('EDCS');
    await rows.first().locator('input').nth(1).fill('1029-8');
    await rows.first().locator('input').nth(2).fill('Emergency Department');

    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 8: Encounter Type Mapping ────────────────────────────────────────
    await page.waitForURL(/encounter-type-mapping/);
    await expect(page.getByRole('heading', { name: /encounter type mapping/i })).toBeVisible();

    await page.getByLabel(/source system uri/i).first().fill('http://open.epic.com/FHIR/encounter-type');
    const encounterRows = page.locator('tbody tr');
    await encounterRows.first().locator('input').first().fill('AMB');
    await encounterRows.first().locator('select').selectOption('11429006');

    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 9: POI Compiling ─────────────────────────────────────────────────
    await page.waitForURL(/poi-compiling/);
    await page.locator('button.nhsn-btn-primary').click();

    // ── Step 10: Verify POI ───────────────────────────────────────────────────
    await page.waitForURL(/verify-poi/);
    await page.locator('button.nhsn-btn-primary').click();

    // ── Test Reports ──────────────────────────────────────────────────────────
    await page.waitForURL(/test-reports/);
    await expect(page.getByRole('heading', { name: /test report/i })).toBeVisible();

    // ── Normalizations page is reachable ──────────────────────────────────────
    await page.goto(`/onboarding/${token}/normalizations`);
    await expect(page.getByRole('heading', { name: /normalization/i })).toBeVisible();
    await expect(page.locator('.norm-item')).toHaveCount(4);
  });

});
