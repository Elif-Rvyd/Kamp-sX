const { test, expect } = require('@playwright/test');
const { openSocial } = require('./social-fixture.cjs');
const fs = require('node:fs');
const path = require('node:path');
const {
  Input,
  BlobSource,
  MP4,
  WEBM,
  Output,
  BufferTarget,
  WebMOutputFormat,
  Conversion,
} = require('mediabunny');
const MARKER = 'PRIVATE_LOCATION_39.000_34.000_DEVICE_TEST';
class PrivateSourceOutput extends Output {
  addVideoTrack(source, metadata = {}) {
    return super.addVideoTrack(source, { ...metadata, name: MARKER });
  }
  addAudioTrack(source, metadata = {}) {
    return super.addAudioTrack(source, { ...metadata, name: MARKER });
  }
}
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNQDH2BFTEMLQkA/vdXgZPglicAAAAASUVORK5CYII=',
  'base64',
);
function privatePng() {
  const type = Buffer.from('tEXt'),
    data = Buffer.from('GPS\0' + MARKER);
  const header = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  header.writeUInt32BE(data.length);
  let value = 0xffffffff;
  for (const byte of Buffer.concat([type, data])) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  crc.writeUInt32BE((value ^ 0xffffffff) >>> 0);
  return Buffer.concat([PNG.subarray(0, 33), header, type, data, crc, PNG.subarray(33)]);
}
for (const purpose of ['post', 'avatar', 'banner']) {
  test(`small ${purpose} images do not publish private source metadata`, async ({ page }) => {
    const state = await openSocial(page, 'en', 'light', purpose === 'post' ? '/compose' : '/profile/edit');
    const original = privatePng();
    expect(original.includes(MARKER)).toBe(true);
    const selector =
      purpose === 'post'
        ? '#post-file'
        : purpose === 'avatar'
          ? '#profile-avatar-file'
          : '#profile-cover-file';
    await page
      .locator(selector)
      .setInputFiles({ name: 'private.png', mimeType: 'image/png', buffer: original });
    const preview = page.locator(
      purpose === 'post'
        ? '.attachment-preview img'
        : purpose === 'avatar'
          ? '.avatar-picker img'
          : '.cover-preview',
    );
    await expect.poll(() => preview.evaluate((img) => img.naturalWidth)).toBe(8);
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(purpose === 'post' ? /\/dashboard$/ : /\/profile$/);
    expect(state.objects.size).toBe(1);
    const uploaded = [...state.objects.values()][0];
    expect(uploaded.bytes.includes(MARKER)).toBe(false);
    expect(uploaded.type).toBe('image/webp');
    await page.reload();
    const saved = page
      .locator(
        purpose === 'post'
          ? 'img.post-media'
          : purpose === 'avatar'
            ? 'kx-profile-header .large-avatar img'
            : '.profile-cover img',
      )
      .first();
    await expect.poll(() => saved.evaluate((img) => img.naturalWidth)).toBe(8);
  });
}
for (const oversized of [false, true])
  test(`${oversized ? 'oversized' : 'small'} videos remove descriptive metadata while retaining audio/video tracks`, async ({
    page,
  }) => {
    test.setTimeout(120000);
    const state = await openSocial(page, 'en', 'dark', '/compose');
    await page.locator('#post-content').click();
    const source = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      const audio = new AudioContext();
      await audio.resume();
      const tone = audio.createOscillator(),
        destination = audio.createMediaStreamDestination();
      tone.connect(destination);
      tone.start();
      const stream = canvas.captureStream(20);
      destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      const chunks = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });
      recorder.start(100);
      let frame = 0;
      const timer = setInterval(() => {
        context.fillStyle = frame++ % 2 ? '#2155e8' : '#007e98';
        context.fillRect(0, 0, 96, 64);
      }, 50);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      recorder.stop();
      await stopped;
      clearInterval(timer);
      stream.getTracks().forEach((track) => track.stop());
      tone.stop();
      await audio.close();
      return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    });
    const input = new Input({ source: new BlobSource(new Blob([new Uint8Array(source)])), formats: [WEBM] });
    const target = new BufferTarget();
    const output = new PrivateSourceOutput({ target, format: new WebMOutputFormat() });
    const conversion = await Conversion.init({
      input,
      output,
      tracks: 'primary',
      copy: { mode: 'forced', shiftTolerance: Infinity },
      tags: { title: MARKER, comment: MARKER },
      showWarnings: false,
    });
    expect(conversion.isValid, JSON.stringify(conversion.discardedTracks.map((item) => item.reason))).toBe(
      true,
    );
    await conversion.execute();
    let original = Buffer.from(target.buffer);
    input.dispose();
    expect(original.includes(MARKER)).toBe(true);
    const baseline = new Input({ source: new BlobSource(new Blob([original])), formats: [WEBM] });
    const originalDuration = await baseline.computeDuration();
    expect(await baseline.getPrimaryVideoTrack()).not.toBeNull();
    expect(await baseline.getPrimaryAudioTrack()).not.toBeNull();
    expect(await (await baseline.getPrimaryVideoTrack()).getName()).toBe(MARKER);
    expect(await (await baseline.getPrimaryAudioTrack()).getName()).toBe(MARKER);
    baseline.dispose();
    if (oversized) {
      const padding = 51 * 1024 * 1024;
      const header = Buffer.from([
        0xec,
        0x10 | (padding >>> 24),
        (padding >>> 16) & 255,
        (padding >>> 8) & 255,
        padding & 255,
      ]);
      original = Buffer.concat([original, header, Buffer.alloc(padding)]);
    }
    if (oversized) {
      const filePath = test.info().outputPath('private-large.webm');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, original);
      await page.locator('#post-file').setInputFiles(filePath);
    } else
      await page
        .locator('#post-file')
        .setInputFiles({ name: 'private.webm', mimeType: 'video/webm', buffer: original });
    await expect(page.locator('.attachment-preview video')).toBeVisible();
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    expect(state.objects.size).toBe(1);
    const bytes = [...state.objects.values()][0].bytes;
    expect(bytes.length).toBeLessThanOrEqual(50 * 1024 * 1024);
    expect(bytes.includes(MARKER)).toBe(false);
    const clean = new Input({ source: new BlobSource(new Blob([bytes])), formats: [MP4, WEBM] });
    try {
      expect(await clean.getPrimaryVideoTrack()).not.toBeNull();
      expect(await clean.getPrimaryAudioTrack()).not.toBeNull();
      expect(await (await clean.getPrimaryVideoTrack()).getName()).toBeNull();
      expect(await (await clean.getPrimaryAudioTrack()).getName()).toBeNull();
      // Transcoding can round the final frame/audio packet; remux must preserve the timeline.
      expect(Math.abs((await clean.computeDuration()) - originalDuration)).toBeLessThan(
        oversized ? 0.12 : 0.001,
      );
      const tags = await clean.getMetadataTags();
      expect(tags.title).toBeUndefined();
      expect(tags.comment).toBeUndefined();
    } finally {
      clean.dispose();
    }
  });
