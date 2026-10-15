const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');

async function signOutInAnotherTab(page) {
  await page.evaluate(async () => {
    sessionStorage.removeItem('sb-auth-auth-token');
    localStorage.removeItem('sb-auth-auth-token');
    const channel = new BroadcastChannel('sb-auth-auth-token');
    channel.postMessage({ event: 'SIGNED_OUT', session: null });
    await new Promise((resolve) => setTimeout(resolve, 25));
    channel.close();
  });
}

test('cross-tab sign-out leaves a dirty composer without a blocking draft dialog', async ({ page }) => {
  const backend = await openSocial(page, 'tr', 'dark', '/compose');
  await page.locator('#post-content').fill('Private unsaved campus draft');
  await signOutInAnotherTab(page);
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('#post-content')).toHaveCount(0);
  expect(backend.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
});

test('an upload finishing after logout cannot insert a post', async ({ page }) => {
  const backend = await openSocial(page, 'en', 'light', '/compose');
  let finishUpload, started;
  const uploadStarted = new Promise((resolve) => (started = resolve));
  await page.route('**/storage/v1/object/uploads/**', async (route) => {
    const wait = new Promise((resolve) => (finishUpload = resolve));
    started();
    await wait;
    await route
      .fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Id: 'delayed', Key: 'uploads/delayed.png' }),
      })
      .catch(() => {});
  });
  await page.locator('#post-file').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  await page.locator('button[type=submit]').click();
  await uploadStarted;
  await signOutInAnotherTab(page);
  await expect(page).toHaveURL(/\/auth\/login$/);
  finishUpload();
  // Let the in-flight HTTP response reach the service's post-upload ownership check.
  await page.waitForTimeout(150);
  expect(backend.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(0);
});
