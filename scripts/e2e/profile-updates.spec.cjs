const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`ordered profile fields, centered one-line toolbar and overlay controls ${language}/${theme}`, async ({
      page,
    }, info) => {
      await openSocial(page, language, theme, '/profile/edit', 390);
      expect(
        await page
          .locator('.edit-fields kx-form-field input,.edit-fields kx-form-field textarea')
          .evaluateAll((elements) => elements.map((el) => el.id)),
      ).toEqual([
        'profile-name',
        'profile-username',
        'profile-bio',
        'profile-university',
        'profile-faculty',
        'profile-department',
      ]);
      await expect(page.locator('.account-heading')).toBeVisible();
      await expect(page.locator('.edit-page')).not.toContainText(
        /JPG, PNG|herkese açık|Publicly|school verification|değiştirilemez/,
      );
      for (const width of [320, 390]) {
        await page.setViewportSize({ width, height: 900 });
        const title = await page.locator('.edit-toolbar h1').boundingBox();
        const toolbar = await page.locator('.edit-toolbar').boundingBox();
        expect(Math.abs(title.x + title.width / 2 - toolbar.x - toolbar.width / 2)).toBeLessThanOrEqual(1);
        const metrics = await page.locator('.edit-toolbar h1').evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          line: parseFloat(getComputedStyle(el).lineHeight),
          scroll: el.scrollWidth,
          client: el.clientWidth,
        }));
        expect(metrics.height).toBeLessThanOrEqual(metrics.line + 1);
        expect(metrics.scroll).toBeLessThanOrEqual(metrics.client);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.setViewportSize({ width: 390, height: 900 });
      await page
        .locator('#profile-avatar-file')
        .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
      const remove = page.locator('.avatar-picker .remove-image');
      await expect(page.locator('.avatar-picker img')).toBeVisible();
      await page.mouse.move(380, 400);
      await expect(remove).toHaveCSS('opacity', '0');
      await page.locator('.avatar-picker').hover();
      await expect(remove).toHaveCSS('opacity', '1');
      const avatar = await page.locator('.avatar-picker').boundingBox(),
        x = await remove.boundingBox();
      expect(Math.abs(x.x + x.width / 2 - avatar.x - avatar.width / 2)).toBeLessThanOrEqual(2);
      await page.screenshot({ path: info.outputPath(`editor-${language}-${theme}.png`), fullPage: true });
      await remove.click();
      await expect(page.locator('.avatar-picker img')).toHaveCount(0);
    });
  }
test('large profile images resize locally before upload; display metadata survives reload', async ({
  page,
}) => {
  const state = await openSocial(page, 'tr', 'light', '/profile/edit');
  const bytes = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 3000;
    canvas.height = 1800;
    const c = canvas.getContext('2d');
    const g = c.createLinearGradient(0, 0, 3000, 1800);
    g.addColorStop(0, '#2155e8');
    g.addColorStop(1, '#ffffff');
    c.fillStyle = g;
    c.fillRect(0, 0, 3000, 1800);
    return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
  });
  await page
    .locator('#profile-avatar-file')
    .setInputFiles({ name: 'large.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes, 'base64') });
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  expect(
    await page
      .locator('.avatar-picker img')
      .evaluate((el) => ({ width: el.naturalWidth, height: el.naturalHeight })),
  ).toEqual({ width: 640, height: 384 });
  expect(state.requests.filter((r) => r.storage)).toHaveLength(0);
  await page
    .locator('#profile-cover-file')
    .setInputFiles({ name: 'large.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(bytes, 'base64') });
  await expect(page.locator('.cover-preview')).toBeVisible();
  expect(
    await page
      .locator('.cover-preview')
      .evaluate((el) => ({ width: el.naturalWidth, height: el.naturalHeight })),
  ).toEqual({ width: 1800, height: 1080 });
  await page.locator('#profile-name').fill('Kalıcı İsim');
  await page.locator('#profile-bio').fill('Kalıcı bio');
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  expect(
    state.requests.filter((r) => r.storage && r.method === 'POST').every((r) => r.url.endsWith('.webp')),
  ).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Kalıcı İsim', exact: true })).toBeVisible();
  await expect(page.locator('.profile-bio')).toHaveText('Kalıcı bio');
});
test('follow counts update through the private SDK broadcast in profile and drawer', async ({ page }) => {
  const state = await openSocial(page, 'tr', 'light', '/profile', 390, { following: 2, followers: 5 });
  await expect(page.locator('kx-follow-counts strong')).toHaveText(['2', '5']);
  await expect(page.locator('kx-follow-counts .counts-status')).toHaveCount(0);
  state.following = 3;
  state.followers = 8;
  state.broadcastFollows();
  await expect(page.locator('kx-follow-counts strong')).toHaveText(['3', '8']);
  await page.getByRole('button', { name: 'Ana sayfaya dön' }).click();
  await page.getByRole('button', { name: 'Profil menüsünü aç' }).click();
  await expect(page.getByRole('dialog').locator('kx-follow-counts strong')).toHaveText(['3', '8']);
  state.followers = 9;
  state.broadcastFollows();
  await expect(page.getByRole('dialog').locator('kx-follow-counts strong')).toHaveText(['3', '9']);
});
test('missing follow permissions show unknown counts and a safe retry, never hardcoded follower counts', async ({
  page,
}) => {
  await openSocial(page, 'tr', 'dark', '/profile', 390, { failFollows: true });
  await expect(page.locator('kx-follow-counts strong')).toHaveText(['—', '—']);
  await expect(page.locator('kx-follow-counts [role=status]')).toContainText('Takip sayıları yüklenemedi');
  await expect(page.locator('kx-follow-counts button')).toBeEnabled();
});
