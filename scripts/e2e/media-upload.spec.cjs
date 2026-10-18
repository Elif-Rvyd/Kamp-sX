const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');

test('a large photo-only post is resized, uploaded and persisted as a public URL with truthful stages', async ({
  page,
}, info) => {
  const state = await openSocial(page, 'tr', 'dark', '/compose');
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2200;
    canvas.height = 1400;
    const context = canvas.getContext('2d'),
      pixels = context.createImageData(canvas.width, canvas.height);
    let random = 17;
    for (let i = 0; i < pixels.data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        random ^= random << 13;
        random ^= random >>> 17;
        random ^= random << 5;
        pixels.data[i + j] = random & 255;
      }
      pixels.data[i + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const original = Buffer.from(encoded, 'base64');
  expect(original.length).toBeGreaterThan(5 * 1024 * 1024);
  await page
    .locator('#post-file')
    .setInputFiles({ name: 'large-photo.png', mimeType: 'image/png', buffer: original });
  await expect(page.locator('.attachment-preview img')).toBeVisible();
  const preview = await page.locator('.attachment-preview img').evaluate(async (img) => {
    const blob = await (await fetch(img.src)).blob();
    return { width: img.naturalWidth, height: img.naturalHeight, bytes: blob.size, type: blob.type };
  });
  expect(preview.width).toBeLessThanOrEqual(2048);
  expect(preview.height).toBeLessThanOrEqual(2048);
  expect(preview.bytes).toBeLessThanOrEqual(2 * 1024 * 1024);
  expect(preview.type).toBe('image/webp');
  expect(state.requests.filter((r) => r.storage && r.method === 'POST')).toHaveLength(0);
  let releaseUpload, releaseSave;
  const uploadGate = new Promise((resolve) => (releaseUpload = resolve)),
    saveGate = new Promise((resolve) => (releaseSave = resolve));
  await page.route('**/storage/v1/object/uploads/**', async (route) => {
    if (route.request().method() === 'POST') await uploadGate;
    await route.fallback();
  });
  await page.route('**/rest/v1/posts*', async (route) => {
    if (route.request().method() === 'POST') await saveGate;
    await route.fallback();
  });
  const publish = page.locator('button[type=submit]'),
    before = await publish.boundingBox();
  await publish.click();
  await expect(page.locator('.upload-status')).toHaveText('Dosya yükleniyor…');
  await expect(publish).toBeDisabled();
  const during = await publish.boundingBox();
  expect(Math.abs(during.y - before.y)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath('media-uploading-tr-dark.png'), fullPage: true });
  releaseUpload();
  await expect(page.locator('.upload-status')).toHaveText('Gönderi kaydediliyor…');
  releaseSave();
  await expect(page).toHaveURL(/\/dashboard$/);
  const write = state.requests.find((r) => r.table === 'posts' && r.method === 'POST');
  expect(write.payload.content).toBe('');
  expect(write.payload.media_type).toBe('image');
  expect(write.payload.media_url).toMatch(
    /^https:\/\/auth\.kampusx\.test\/storage\/v1\/object\/public\/uploads\/[^/]+\/post\/[^/]+\.webp$/,
  );
  expect(Object.keys(write.payload).sort()).toEqual(['content', 'media_type', 'media_url', 'user_id']);
  await expect(page.locator('kx-social-post-card img.post-media').first()).toHaveAttribute(
    'src',
    write.payload.media_url,
  );
  await page.reload();
  await expect(page.locator('kx-social-post-card img.post-media').first()).toHaveAttribute(
    'src',
    write.payload.media_url,
  );
});
