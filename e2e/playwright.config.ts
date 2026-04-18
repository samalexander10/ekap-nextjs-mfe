import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
});

export default defineConfig({
  testDir,

  use: {
    baseURL: 'http://localhost:5000',
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  timeout: 90_000,
  expect: { timeout: 60_000 },

  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
});
