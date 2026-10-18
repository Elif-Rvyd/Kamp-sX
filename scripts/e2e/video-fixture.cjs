// A real, playable WebM with an audio tone and a valid EBML Void element.
// Padding makes the valid input exceed 50 MiB without storing a large binary fixture.
async function selectLargeVideo(page) {
  await page.locator('#post-content').click();
  return page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    const audio = new AudioContext();
    await audio.resume();
    const tone = audio.createOscillator(),
      destination = audio.createMediaStreamDestination();
    tone.frequency.value = 440;
    tone.connect(destination);
    tone.start();
    const stream = canvas.captureStream(20);
    for (const track of destination.stream.getAudioTracks()) stream.addTrack(track);
    const chunks = [],
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = reject;
    });
    recorder.start();
    let frame = 0;
    const timer = setInterval(() => {
      context.fillStyle = frame++ % 2 ? '#2155e8' : '#007e98';
      context.fillRect(0, 0, 96, 64);
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    recorder.stop();
    await stopped;
    clearInterval(timer);
    stream.getTracks().forEach((track) => track.stop());
    tone.stop();
    const originalAudio = await audio.decodeAudioData(
      await new Blob(chunks, { type: 'video/webm' }).arrayBuffer(),
    );
    await audio.close();
    const padding = 51 * 1024 * 1024;
    const header = new Uint8Array([
      0xec,
      0x10 | (padding >>> 24),
      (padding >>> 16) & 255,
      (padding >>> 8) & 255,
      padding & 255,
    ]);
    const file = new File([...chunks, header, new Uint8Array(padding)], 'large-campus.webm', {
      type: 'video/webm',
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    const input = document.getElementById('post-file');
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return { bytes: file.size, audioDuration: originalAudio.duration };
  });
}
module.exports = { selectLargeVideo };
