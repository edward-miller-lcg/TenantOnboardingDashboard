import { test, expect } from '../fixtures/test-fixtures';

/**
 * Test Reports pages
 * Source: Guided_Onboarding_Requirements.xlsx
 *   - "Validation/Run New Test Report"
 *   - "Validation/Run New Test Report/Prequal report"
 *   - "Validation/Run New Test Report/Prequal report/Category details"
 *   - "Validation/Test Report/Report Generation"
 */

test.describe('Test Reports list', () => {

  test('displays "Test Reports" heading', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.getByRole('heading', { name: /test report/i })).toBeVisible();
  });

  test('displays table of completed reports', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.locator('table')).toBeVisible();
  });

  test('table shows reporting period, result, unacceptable issues, total patients', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/test-reports`);
    const table = page.locator('table');
    await expect(table.getByText(/reporting period/i)).toBeVisible();
    await expect(table.getByText(/result/i)).toBeVisible();
    await expect(table.getByText(/unacceptable/i)).toBeVisible();
    await expect(table.getByText(/total patients/i)).toBeVisible();
  });

  test('shows "Generate Report" or "Run New Report" button', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.getByRole('button', { name: /generate|run.*report/i })).toBeVisible();
  });

  test('shows "Go to Normalizations" or equivalent navigation button', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.getByRole('button', { name: /normalization/i })
      .or(page.getByRole('link', { name: /normalization/i }))).toBeVisible();
  });

  test('shows "Complete Onboarding" button when a successful report exists', async ({ page, token }) => {
    // Mock returns a report with SUCCESS and 0 unacceptable issues
    await page.route('**/api/onboarding/*/reports', route =>
      route.fulfill({ json: [{
        id: 'r1', reportingPeriod: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31',
        result: 'SUCCESS', unacceptableIssues: 0, totalPatients: 150
      }] })
    );
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.getByRole('button', { name: /complete onboarding/i })).toBeVisible();
  });

  test('does NOT show "Complete Onboarding" when latest report has unacceptable issues', async ({ page, token }) => {
    await page.route('**/api/onboarding/*/reports', route =>
      route.fulfill({ json: [{
        id: 'r1', reportingPeriod: '2026-01', startDate: '2026-01-01', endDate: '2026-01-31',
        result: 'FAILED', unacceptableIssues: 3, totalPatients: 150
      }] })
    );
    await page.goto(`/onboarding/${token}/test-reports`);
    await expect(page.getByRole('button', { name: /complete onboarding/i })).toHaveCount(0);
  });

});

test.describe('Prequalification Report', () => {

  test('displays Reporting Period, Status, Unacceptable Issues, Total Patients', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/reports/report-001`);
    await expect(page.getByText(/reporting period/i)).toBeVisible();
    await expect(page.getByText(/status/i)).toBeVisible();
    await expect(page.getByText(/unacceptable issues/i)).toBeVisible();
    await expect(page.getByText(/total patients/i)).toBeVisible();
  });

  test('displays Unacceptable Categories table', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/reports/report-001`);
    await expect(page.getByText(/unacceptable categories/i)).toBeVisible();
  });

  test('displays Acceptable Categories table', async ({ mockedPage: page, token }) => {
    await page.goto(`/onboarding/${token}/reports/report-001`);
    await expect(page.getByText(/acceptable categories/i)).toBeVisible();
  });

  test('category rows are clickable hyperlinks to Category Details', async ({ page, token }) => {
    await page.route('**/api/onboarding/*/reports/report-001', route =>
      route.fulfill({ json: {
        reportingPeriod: '2026-01', status: 'FAILED', unacceptableIssues: 1, totalPatients: 100,
        issuesSummary: [],
        unacceptableCategories: [{
          id: 'cat-1', category: 'Missing Encounter Type', numberOfIssues: 5,
          guidance: 'Map Encounter.type codes', acceptable: false
        }],
        acceptableCategories: []
      }})
    );
    await page.goto(`/onboarding/${token}/reports/report-001`);
    await expect(page.getByRole('link', { name: /missing encounter type/i })).toBeVisible();
  });

});
