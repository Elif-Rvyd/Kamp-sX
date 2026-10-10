const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './scripts/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4300', browserName: 'chromium', trace: 'retain-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: {
    command: 'npx nx serve shell --configuration=e2e --port=4300',
    url: 'http://127.0.0.1:4300',
    // Never attach auth tests to a server configured with a real Supabase project.
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NX_DAEMON: 'false',
      NX_TUI: 'false',
      NX_ISOLATE_PLUGINS: 'false',
    },
  },
});
