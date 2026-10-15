export interface ImageDimensions {
  width: number;
  height: number;
}

/** Read dimensions before decoding; a browser decoder still verifies the image. */
export function imageDimensions(bytes: Uint8Array, mime: string): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start: number, length = 4) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (mime === 'image/png') {
    if (
      bytes.length < 33 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value) ||
      view.getUint32(8) !== 13 ||
      text(12) !== 'IHDR'
    )
      return null;
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (mime === 'image/jpeg') {
    if (bytes[0] !== 255 || bytes[1] !== 216) return null;
    let offset = 2;
    while (offset + 1 < bytes.length) {
      if (bytes[offset++] !== 255) return null;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === undefined || marker === 0 || marker === 218 || marker === 217) return null;
      if (marker === 1 || (marker >= 208 && marker <= 216)) continue;
      if (offset + 2 > bytes.length) return null;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return null;
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
        if (length < 8) return null;
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
      }
      offset += length;
    }
    return null;
  }
  if (mime === 'image/webp') {
    if (
      bytes.length < 20 ||
      text(0) !== 'RIFF' ||
      text(8) !== 'WEBP' ||
      view.getUint32(4, true) + 8 !== bytes.length
    )
      return null;
    const size = view.getUint32(16, true);
    if (20 + size + (size % 2) > bytes.length) return null;
    switch (text(12)) {
      case 'VP8X':
        if (size !== 10) return null;
        return {
          width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
          height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
        };
      case 'VP8L': {
        if (size < 5 || bytes[20] !== 47) return null;
        const bits = view.getUint32(21, true);
        if (bits >>> 29) return null;
        return { width: 1 + (bits & 16383), height: 1 + ((bits >>> 14) & 16383) };
      }
      case 'VP8 ':
        if (size < 10 || bytes[20] & 1 || text(23, 3) !== '\x9d\x01\x2a') return null;
        return { width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 };
      default:
        return null;
    }
  }
  return null;
}
