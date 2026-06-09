import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { applyAllMocks } from '../mocks/api-mocks';
import { LocationTypeMappingPage } from '../page-objects/LocationTypeMappingPage';
import { EncounterTypeMappingPage } from '../page-objects/EncounterTypeMappingPage';
import { NormalizationsPage } from '../page-objects/NormalizationsPage';

const SESSION_FILE = path.join(__dirname, '..', '.auth', 'test-session.json');

interface TestSession {
  token: string;
  sessionId: string;
  nhsnOrgId: string;
  onboardingUrl: string;
}

interface OnboardingFixtures {
  /** The test session (token, nhsnOrgId, etc.) created during global setup. */
  session: TestSession;
  /** The session token string — shorthand for session.token. */
  token: string;
  /** All downstream API calls mocked; page is ready to navigate. */
  mockedPage: typeof base extends { page: infer P } ? P : never;
  /** Page objects pre-constructed with the test token. */
  locationMappingPage: LocationTypeMappingPage;
  encounterMappingPage: EncounterTypeMappingPage;
  normalizationsPage: NormalizationsPage;
}

export const test = base.extend<OnboardingFixtures>({

  session: async ({}, use) => {
    if (!fs.existsSync(SESSION_FILE)) {
      throw new Error(
        `Test session file not found at ${SESSION_FILE}. ` +
        `Run Playwright with the 'setup' project first (npx playwright test --project=setup).`
      );
    }
    const session: TestSession = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    await use(session);
  },

  token: async ({ session }, use) => {
    await use(session.token);
  },

  mockedPage: async ({ page, session }, use) => {
    // Apply all API mocks before navigation so route handlers are registered early.
    await applyAllMocks(page);
    await use(page as any);
  },

  locationMappingPage: async ({ page, session }, use) => {
    await applyAllMocks(page);
    await use(new LocationTypeMappingPage(page, session.token));
  },

  encounterMappingPage: async ({ page, session }, use) => {
    await applyAllMocks(page);
    await use(new EncounterTypeMappingPage(page, session.token));
  },

  normalizationsPage: async ({ page, session }, use) => {
    await applyAllMocks(page);
    await use(new NormalizationsPage(page, session.token));
  },
});

export { expect };
