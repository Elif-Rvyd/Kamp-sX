const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
const { selectLargeVideo } = require('./video-fixture.cjs');

test('a real video over 50 MiB is compressed with its sound and duration before URL publication', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const state = await openSocial(page, 'tr', 'dark', '/compose', 390);
  const original = await selectLargeVideo(page);
  expect(original.bytes).toBeGreaterThan(50 * 1024 * 1024);
  await expect(page.locator('.attachment-preview video')).toBeVisible({ timeout: 60000 });
  const prepared = await page.locator('.attachment-preview video').evaluate(async (video) => {
    if (!video.videoWidth)
      await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }));
    const blob = await (await fetch(video.src)).blob();
    const context = new AudioContext();
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    const samples = decoded.getChannelData(0);
    const energy = samples.reduce((sum, value) => sum + value * value, 0) / samples.length;
    await context.close();
    return {
      size: blob.size,
      type: blob.type,
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      audioDuration: decoded.duration,
      energy,
    };
  });
  expect(prepared.size).toBeLessThan(50_000_000);
  expect(prepared.type).toMatch(/^video\/(mp4|webm)$/);
  expect(prepared.width).toBe(96);
  expect(prepared.height).toBe(64);
  expect(prepared.duration).toBeGreaterThan(0.7);
  expect(prepared.duration).toBeLessThan(1.5);
  expect(original.audioDuration).toBeGreaterThan(0.1);
  expect(Math.abs(prepared.audioDuration - original.audioDuration)).toBeLessThan(0.07);
  expect(prepared.energy).toBeGreaterThan(0.01);
  expect(state.requests.filter((request) => request.storage && request.method === 'POST')).toHaveLength(0);
  await page.screenshot({ path: info.outputPath('compressed-video-mobile.png'), fullPage: true });
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const post = state.requests.find((request) => request.table === 'posts' && request.method === 'POST');
  expect(post.payload.media_type).toBe('video');
  expect(post.payload.media_url).toMatch(/\.(mp4|webm)$/);
  expect(Object.keys(post.payload).sort()).toEqual(['content', 'media_type', 'media_url', 'user_id']);
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator('kx-social-post-card video')
        .first()
        .evaluate((video) => video.videoWidth),
    )
    .toBe(96);
  expect(errors).toEqual([]);
});

test('compression can be canceled immediately without losing the text draft or making writes', async ({
  page,
}) => {
  const state = await openSocial(page, 'en', 'light', '/compose');
  await page.locator('#post-content').fill('Keep this draft');
  // Hold only the local worker script; the browser still uses the real preparation path.
  let release;
  const gate = new Promise((resolve) => (release = resolve));
  await page.route(/(?:worker|post-video)[^/]*\.js(?:\?.*)?$/, async (route) => {
    await gate;
    await route.continue();
  });
  await selectLargeVideo(page);
  const cancel = page.getByRole('button', { name: 'Cancel preparation', exact: true });
  await expect(cancel).toBeEnabled();
  await expect(page.locator('.upload-status')).toContainText('Compressing video');
  await cancel.click();
  release();
  await expect(page.locator('#post-content')).toHaveValue('Keep this draft');
  await expect(page.locator('.upload-status')).toBeEmpty();
  await expect(page.locator('.attachment-preview')).toHaveCount(0);
  expect(
    state.requests.filter((request) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)),
  ).toHaveLength(0);
});
