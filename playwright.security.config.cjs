const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './scripts/security',
  testMatch: '*.spec.cjs',
  outputDir: 'test-results-security',
  workers: 1,
  timeout: 30000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4400', browserName: 'chromium' },
  webServer: {
    command: 'node scripts/security/serve-production.cjs',
    url: 'http://127.0.0.1:4400',
    reuseExistingServer: false,
  },
});
