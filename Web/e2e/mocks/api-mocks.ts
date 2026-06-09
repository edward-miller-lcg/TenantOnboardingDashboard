import { Page, Route } from '@playwright/test';

/**
 * API mocks for smoke tests.
 *
 * The onboarding wizard itself needs no auth (session-token-based), but calls
 * downstream services that require IsLinkAdmin. We intercept those at the
 * network level so tests run without a real normalization or report service.
 *
 * Pattern:
 *   - All mocks use page.route() so they are per-test and cleaned up automatically.
 *   - Routes are matched against the backend proxy URL (the Angular app talks to
 *     its own origin via the Angular proxy / BFF, so we match on /api/onboarding).
 */

// ---- Normalization operations -----------------------------------------------

export async function mockNormalizationList(page: Page, items: MockNormalizationItem[] = DEFAULT_NORMALIZATIONS) {
  await page.route('**/api/onboarding/*/normalizations', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: items });
    } else {
      await route.continue();
    }
  });
}

export async function mockCreateNormalization(page: Page) {
  await page.route('**/api/onboarding/*/normalizations/**', async (route: Route) => {
    const method = route.request().method();
    if (method === 'POST' || method === 'PUT') {
      await route.fulfill({
        status: 201,
        json: { id: crypto.randomUUID(), message: 'Operation created' }
      });
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });
}

export async function mockLocationTypeMapping(page: Page) {
  // GET returns empty (first visit)
  await page.route('**/api/onboarding/*/location-type-mapping', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { sourceSystem: '', codes: [] } });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, json: {} });
    } else {
      await route.continue();
    }
  });
}

export async function mockEncounterTypeMapping(page: Page) {
  await page.route('**/api/onboarding/*/encounter-type-mapping', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { resourceType: 'Encounter', fhirPath: 'Encounter.type.coding', codeSystemMaps: [] } });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, json: {} });
    } else {
      await route.continue();
    }
  });
}

// ---- Reports ----------------------------------------------------------------

export async function mockReports(page: Page) {
  await page.route('**/api/onboarding/*/reports', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: [SAMPLE_REPORT] });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, json: SAMPLE_REPORT });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/onboarding/*/reports/*', async (route: Route) => {
    await route.fulfill({ json: SAMPLE_PREQUALIFICATION_REPORT });
  });
}

// ---- Connection test --------------------------------------------------------

export async function mockConnectionTest(page: Page) {
  await page.route('**/api/onboarding/*/connection-test', async (route: Route) => {
    await route.fulfill({ json: { success: true } });
  });
}

// ---- Convenience: apply all mocks at once -----------------------------------

export async function applyAllMocks(page: Page) {
  await mockNormalizationList(page);
  await mockCreateNormalization(page);
  await mockLocationTypeMapping(page);
  await mockEncounterTypeMapping(page);
  await mockReports(page);
  await mockConnectionTest(page);
}

// ---- Types & fixtures -------------------------------------------------------

export interface MockNormalizationItem {
  id: string;
  name: string;
  description: string;
  operationType: string;
  resourceTypes: string[];
  isDisabled: boolean;
  canDelete: boolean;
}

export const DEFAULT_NORMALIZATIONS: MockNormalizationItem[] = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'Map Location Identifier to HSLOC',
    description: 'Translates Epic location identifier codes to CDC NHSN HSLOC codes.',
    operationType: 'CodeMap',
    resourceTypes: ['Location'],
    isDisabled: false,
    canDelete: true
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Copy Location Identifier to Type',
    description: 'Promotes mapped HSLOC identifiers into Location.type as a CodeableConcept.',
    operationType: 'CopyLocation',
    resourceTypes: ['Location'],
    isDisabled: false,
    canDelete: true
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Map Encounter Type to SNOMED',
    description: 'Translates Epic encounter type codes to SNOMED CT.',
    operationType: 'CodeMap',
    resourceTypes: ['Encounter'],
    isDisabled: false,
    canDelete: true
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Set Encounter Status to Finished',
    description: "Sets Encounter.status to 'finished' when a period end date is present.",
    operationType: 'ConditionalTransform',
    resourceTypes: ['Encounter'],
    isDisabled: false,
    canDelete: true
  }
];

const SAMPLE_REPORT = {
  id: 'report-001',
  reportingPeriod: '2026-01',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  result: 'SUCCESS',
  unacceptableIssues: 0,
  acceptableIssues: 2,
  totalPatients: 150
};

const SAMPLE_PREQUALIFICATION_REPORT = {
  reportingPeriod: '2026-01',
  status: 'SUCCESS',
  unacceptableIssues: 0,
  totalPatients: 150,
  issuesSummary: [],
  unacceptableCategories: [],
  acceptableCategories: []
};
