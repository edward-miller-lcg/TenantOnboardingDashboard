import { defineConfig, devices } from '@playwright/test';

/**
 * BASE_URL:
 *   Local dev  → http://localhost:4200  (Angular dev server + backend on 5000)
 *   CI / nightly integration → set BASE_URL env var to point at a deployed env
 *
 * API_URL:
 *   The backend API base. Defaults to BASE_URL/api, but can be overridden when
 *   the API and the SPA are on different origins (e.g. local dev with proxy).
 */
const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4200';
const API_URL  = process.env['API_URL']  ?? 'http://localhost:5096';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: process.env['CI'] ? 2 : undefined,

  reporter: [
    ['list'],
    // JUnit output consumed by Azure DevOps "Publish Test Results" task
    ['junit', { outputFile: './test-results/junit.xml' }],
    ['html', { open: 'never', outputFolder: './test-results/html-report' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Global setup runs once before all tests to create a shared session
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});

// Export for use in global-setup and fixtures
export { API_URL };
