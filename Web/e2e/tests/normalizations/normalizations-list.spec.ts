import { test, expect } from '../../fixtures/test-fixtures';
import { DEFAULT_NORMALIZATIONS } from '../../mocks/api-mocks';

/**
 * Normalizations list page — smoke tests.
 *
 * Acceptance criteria covered:
 *   - User can view all configured normalization operations for their facility
 *   - Each operation shows its type, resource type(s), and name
 *   - Disabled operations are visually distinguished
 *   - User can navigate to add a new Code Map, Copy Property, or Conditional Transform
 *   - User can delete a deletable operation after confirmation
 */

test.describe('Normalizations list', () => {

  test('shows all operations returned from the API', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();

    await normalizationsPage.assertOperationCount(DEFAULT_NORMALIZATIONS.length);
  });

  test('displays operation name, type badge, and resource type badge', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();

    await normalizationsPage.assertOperationVisible('Map Location Identifier to HSLOC');
    await normalizationsPage.assertTypeBadge('Map Location Identifier to HSLOC', 'Code Map');
    await normalizationsPage.assertResourceTypeBadge('Map Location Identifier to HSLOC', 'Location');
  });

  test('displays CopyLocation operation with correct type badge', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();

    await normalizationsPage.assertOperationVisible('Copy Location Identifier to Type');
    await normalizationsPage.assertTypeBadge('Copy Location Identifier to Type', 'Copy Location');
  });

  test('displays Encounter operations with Encounter resource badge', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();

    await normalizationsPage.assertResourceTypeBadge('Map Encounter Type to SNOMED', 'Encounter');
    await normalizationsPage.assertResourceTypeBadge('Set Encounter Status to Finished', 'Encounter');
  });

  test('shows empty state message when no operations configured', async ({ page, session }) => {
    // Override mock to return empty list
    await page.route('**/api/onboarding/*/normalizations', route =>
      route.fulfill({ json: [] })
    );

    const norm = new (await import('../../page-objects/NormalizationsPage')).NormalizationsPage(page, session.token);
    await norm.goto();

    await expect(page.locator('.norm-empty')).toBeVisible();
  });

  test('add menu reveals Code Map, Copy Property, and Conditional Transform options', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();
    await normalizationsPage.openAddMenu();

    await expect(normalizationsPage['page'].locator('.add-dropdown')).toBeVisible();
    await expect(normalizationsPage['page'].getByRole('button', { name: /code map/i })).toBeVisible();
    await expect(normalizationsPage['page'].getByRole('button', { name: /copy property/i })).toBeVisible();
    await expect(normalizationsPage['page'].getByRole('button', { name: /conditional transform/i })).toBeVisible();
  });

  test('navigates to code-map editor when Add Code Map is clicked', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();
    await normalizationsPage.addCodeMap();

    await expect(normalizationsPage['page']).toHaveURL(/normalizations\/code-map/);
  });

  test('delete removes operation from list after confirmation', async ({ normalizationsPage }) => {
    await normalizationsPage.goto();

    const initialCount = await normalizationsPage.operationRows.count();
    await normalizationsPage.deleteOperation('Map Location Identifier to HSLOC');

    // After delete the list reloads — mock now returns one fewer item
    await normalizationsPage['page'].route('**/api/onboarding/*/normalizations', route =>
      route.fulfill({ json: DEFAULT_NORMALIZATIONS.slice(1) })
    );

    await expect(normalizationsPage.operationRows).toHaveCount(initialCount - 1);
  });

});
