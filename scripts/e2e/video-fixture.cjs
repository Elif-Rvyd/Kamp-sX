const fs = require('node:fs');
const path = require('node:path');
// Generated 96x64 VP8/Opus clip, exactly 1 second of color frames and a 440 Hz tone.
// A fixed source avoids MediaRecorder startup races; tests still decode audio and compress real media.
const clip = Array.from(fs.readFileSync(path.join(__dirname, '../fixtures/campus-tone.webm')));
// A valid EBML Void element makes the input exceed 50 MiB without storing a large binary fixture.
async function selectLargeVideo(page) {
  await page.locator('#post-content').click();
  return page.evaluate(async (encoded) => {
    const bytes = new Uint8Array(encoded);
    const audio = new AudioContext();
    let originalAudio;
    try {
      originalAudio = await audio.decodeAudioData(bytes.slice().buffer);
    } finally {
      await audio.close();
    }
    const padding = 51 * 1024 * 1024;
    const header = new Uint8Array([
      0xec,
      0x10 | (padding >>> 24),
      (padding >>> 16) & 255,
      (padding >>> 8) & 255,
      padding & 255,
    ]);
    const file = new File([bytes, header, new Uint8Array(padding)], 'large-campus.webm', {
      type: 'video/webm',
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.getElementById('post-file');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { bytes: file.size, audioDuration: originalAudio.duration };
  }, clip);
}
module.exports = { selectLargeVideo };
