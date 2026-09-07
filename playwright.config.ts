import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || './test-results/playwright',
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:4399',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.env.CI ? undefined : 'msedge'),
    trace: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'node scripts/serve-test-build.mjs',
    url: 'http://127.0.0.1:4399',
    reuseExistingServer: false,
  },
});
