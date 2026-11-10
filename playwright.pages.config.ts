import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/pages.spec.ts',
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://localhost:4174/islamic/', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 4174',
    env: { VITE_BASE_PATH: '/islamic/' },
    url: 'http://localhost:4174/islamic/',
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
