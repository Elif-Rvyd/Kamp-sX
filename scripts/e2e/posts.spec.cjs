const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { openSocial } = require('./social-fixture.cjs');
const { mockSocial, OWNER } = require('./mock-social.cjs');
const png = () => ({
  name: 'photo.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
    'base64',
  ),
});

test('a failed initial profile read cannot erase an unknown saved banner', async ({ page }) => {
  const options = { failProfileRead: true };
  const state = await openSocial(page, 'tr', 'light', '/profile/edit', 390, options);
  state.profile.banner_url = `https://auth.kampusx.test/storage/v1/object/public/uploads/${OWNER}/banner/existing.png`;
  await expect(page.locator('.save-error[role=alert]')).toContainText('Profil fotoğrafların yüklenemedi');
  await page.locator('#profile-avatar-file').setInputFiles(png());
  await expect(page.locator('.avatar-picker img')).toBeVisible();
  const save = page.getByRole('button', { name: 'Kaydet', exact: true });
  await expect(save).toBeDisabled();
  expect(state.requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toHaveLength(0);
  options.failProfileRead = false;
  await page.getByRole('button', { name: 'Tekrar dene', exact: true }).click();
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(/\/profile$/);
  const write = state.requests.find((r) => r.table === 'profiles' && r.method === 'PATCH');
  expect(write.payload.banner_url).toBe(state.profile.banner_url);
  expect(write.payload.banner_url).toContain('/banner/existing.png');
});
for (const language of ['tr', 'en'])
  for (const theme of ['light', 'dark']) {
    test(`composer and real SDK upload/database sequence ${language}/${theme}`, async ({ page }, info) => {
      const state = await openSocial(page, language, theme, '/compose');
      await page.locator('#post-content').fill('A real SDK request, isolated test data.');
      await page.locator('#post-file').setInputFiles(png());
      await expect(page.locator('.attachment-preview img')).toBeVisible();
      const publish = page.locator('button[type=submit]');
      await expect(publish).toBeEnabled();
      expect(state.requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toHaveLength(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(axe.violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`compose-${language}-${theme}.png`), fullPage: true });
      await publish.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.locator('kx-social-post-card').first()).toContainText(
        'A real SDK request, isolated test data.',
      );
      const writes = state.requests.filter((r) => !['GET', 'HEAD'].includes(r.method));
      expect(writes).toHaveLength(2);
      expect(writes[0].storage).toBe(true);
      expect(writes[0].url).toContain(`/uploads/${OWNER}/post/`);
      expect(writes[1].payload).toEqual({
        user_id: OWNER,
        content: 'A real SDK request, isolated test data.',
        media_url: expect.stringContaining(`/uploads/${OWNER}/post/`),
        media_type: 'image',
      });
      await page.reload();
      await expect(page.locator('kx-social-post-card').first()).toContainText(
        'A real SDK request, isolated test data.',
      );
    });
  }
test('failed database writes preserve the draft and reuse the confirmed upload on retry', async ({
  page,
}) => {
  await openSocial(page, 'tr', 'light', '/compose');
  const options = { failDatabase: true },
    state = await mockSocial(page, options);
  await page.locator('#post-content').fill('Keep this draft');
  await page.locator('#post-file').setInputFiles(png());
  const publish = page.locator('button[type=submit]');
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(page.locator('[role=alert]')).toContainText('Gönderi kaydedilemedi');
  await expect(page.locator('#post-content')).toHaveValue('Keep this draft');
  await expect(page.locator('.attachment-preview img')).toBeVisible();
  options.failDatabase = false;
  await publish.click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.requests.filter((r) => r.storage && r.method === 'POST')).toHaveLength(1);
  expect(state.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(2);
});
test('an ambiguous database result prevents blind duplicate publication', async ({ page }) => {
  await openSocial(page, 'tr', 'dark', '/compose');
  const state = await mockSocial(page, { uncertainDatabase: true });
  await page.locator('#post-content').fill('Check before repeating');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[role=alert]')).toContainText('sonucu doğrulanamadı');
  await expect(page.locator('button[type=submit]')).toBeDisabled();
  expect(state.requests.filter((r) => r.method === 'POST' && r.table === 'posts')).toHaveLength(1);
});
test('invalid files and discarded drafts produce no storage or database mutations', async ({ page }) => {
  const state = await openSocial(page, 'tr', 'light', '/compose');
  await page
    .locator('#post-file')
    .setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('text') });
  await expect(page.locator('[role=alert]')).toContainText('Bu görsel okunamadı');
  await page.locator('#post-content').fill('Unsaved');
  await page.getByRole('button', { name: 'İptal', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Değişiklikleri sil', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(state.requests.filter((r) => !['GET', 'HEAD'].includes(r.method))).toHaveLength(0);
});
test('storage denial never inserts a post', async ({ page }) => {
  await openSocial(page, 'tr', 'light', '/compose');
  const state = await mockSocial(page, { failStorage: true });
  await page.locator('#post-file').setInputFiles(png());
  await expect(page.locator('button[type=submit]')).toBeEnabled();
  await page.locator('button[type=submit]').click();
  await expect(page.locator('[role=alert]')).toContainText('Dosya yükleme izni reddedildi');
  await expect(page.locator('.attachment-preview')).toBeVisible();
  expect(state.requests.filter((r) => r.table === 'posts' && r.method === 'POST')).toHaveLength(0);
});
for (const extension of ['webm', 'mp4']) {
  test(
    'browser-decodable ' + extension.toUpperCase() + ' files are uploaded as video with a persistent URL',
    async ({ page }) => {
      const mimeType = 'video/' + extension;
      const supported = await page.evaluate((type) => MediaRecorder.isTypeSupported(type), mimeType);
      test.skip(!supported, 'This browser cannot record a ' + extension + ' test fixture.');
      const state = await openSocial(page, 'en', 'dark', '/compose');
      const bytes = await page.evaluate(async (mimeType) => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const stream = canvas.captureStream(10),
          chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType });
        const done = new Promise((resolve) => (recorder.onstop = resolve));
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.start();
        canvas.getContext('2d').fillRect(0, 0, 32, 32);
        await new Promise((resolve) => setTimeout(resolve, 250));
        recorder.stop();
        await done;
        stream.getTracks().forEach((track) => track.stop());
        return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
      }, mimeType);
      await page
        .locator('#post-file')
        .setInputFiles({ name: 'campus.' + extension, mimeType, buffer: Buffer.from(bytes) });
      await expect(page.locator('.attachment-preview video')).toBeVisible();
      await expect(page.locator('button[type=submit]')).toBeEnabled();
      await page.locator('button[type=submit]').click();
      await expect(page).toHaveURL(/\/dashboard$/);
      const post = state.requests.find((r) => r.table === 'posts' && r.method === 'POST');
      expect(post.payload.media_type).toBe('video');
      expect(post.payload.media_url).toContain('/post/');
      expect(post.payload.media_url.endsWith('.' + extension)).toBe(true);
      await expect(page.locator('kx-social-post-card video').first()).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator('kx-social-post-card video')
            .first()
            .evaluate((video) => video.videoWidth),
        )
        .toBe(32);
      await page.reload();
      await expect
        .poll(() =>
          page
            .locator('kx-social-post-card video')
            .first()
            .evaluate((video) => video.videoWidth),
        )
        .toBe(32);
    },
  );
}
