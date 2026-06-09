import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { API_URL } from './playwright.config';

const SESSION_FILE = path.join(__dirname, '.auth', 'test-session.json');

/**
 * Global setup — runs once before all test workers.
 *
 * Creates a test onboarding session via the admin API (no auth required) and
 * writes the token + session info to .auth/test-session.json so individual
 * tests can load it without hitting the API on every run.
 */
setup('create test session', async ({ request }) => {
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });

  const response = await request.post(`${API_URL}/api/admin/sessions`, {
    data: {
      nhsnOrgId: 'TEST-ORG-001',
      healthSystemName: 'Playwright Test Health System'
    }
  });

  expect(response.ok(), `Admin session creation failed: ${response.status()} ${await response.text()}`).toBeTruthy();

  const session = await response.json();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));

  console.log(`✓ Test session created — token: ${session.token}`);
});
