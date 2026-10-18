// Unit-test canvas boundary. Actual browser encoding and metadata removal have separate E2E tests.
const WEBP = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64');
function imageCanvas(tag) {
  if (tag !== 'canvas') throw Error('Unexpected document element');
  return {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob: (callback) => callback(new Blob([WEBP], { type: 'image/webp' })),
  };
}
module.exports = { imageCanvas };
