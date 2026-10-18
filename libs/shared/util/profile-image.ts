import { imageDimensions } from './image-header';

export class ProfileImageError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}

/** Rebuild decoded pixels so source EXIF/XMP/location tags never accompany public uploads. */
export async function prepareProfileImage(
  file: File,
  purpose: 'avatar' | 'banner',
  document: Document,
): Promise<File> {
  return prepareImage(file, purpose, document);
}

export async function preparePostImage(file: File, document: Document): Promise<File> {
  return prepareImage(file, 'post', document);
}

async function prepareImage(
  file: File,
  purpose: 'avatar' | 'banner' | 'post',
  document: Document,
): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new ProfileImageError('profile.errors.type');
  if (!file.size || file.size > 20 * 1024 * 1024) throw new ProfileImageError('profile.errors.inputSize');
  const dimensions = imageDimensions(new Uint8Array(await file.arrayBuffer()), file.type);
  if (!dimensions?.width || !dimensions.height) throw new ProfileImageError('profile.errors.image');
  if (dimensions.width * dimensions.height > 32_000_000)
    throw new ProfileImageError('profile.errors.resolution');
  const window = document.defaultView;
  if (!window) throw new ProfileImageError('profile.errors.upload');
  let bitmap: ImageBitmap;
  try {
    bitmap = await window.createImageBitmap(file);
  } catch {
    throw new ProfileImageError('profile.errors.image');
  }
  let canvas: HTMLCanvasElement | undefined;
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 32_000_000)
      throw new ProfileImageError('profile.errors.resolution');
    const maxWidth = purpose === 'avatar' ? 640 : purpose === 'post' ? 2048 : 1920;
    const maxHeight = purpose === 'avatar' ? 640 : purpose === 'post' ? 2048 : 1080;
    const targetBytes = (purpose === 'post' ? 2 : 1) * 1024 * 1024;
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    canvas = document.createElement('canvas');
    let width = Math.max(1, Math.round(bitmap.width * scale));
    let height = Math.max(1, Math.round(bitmap.height * scale));
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new ProfileImageError('profile.errors.compression');
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new ProfileImageError('profile.errors.compression')), 15000);
        try {
          canvas!.toBlob(
            (value) => {
              clearTimeout(timeout);
              value ? resolve(value) : reject(new ProfileImageError('profile.errors.compression'));
            },
            'image/webp',
            Math.max(0.5, 0.86 - attempt * 0.08),
          );
        } catch {
          clearTimeout(timeout);
          reject(new ProfileImageError('profile.errors.compression'));
        }
      });
      if (blob.type !== 'image/webp') throw new ProfileImageError('profile.errors.compression');
      if (blob.size <= targetBytes)
        return new File([blob], purpose === 'post' ? 'post.webp' : 'profile.webp', {
          type: blob.type,
          lastModified: file.lastModified,
        });
      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
    throw new ProfileImageError('profile.errors.compression');
  } finally {
    bitmap.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
