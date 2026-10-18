import {
  POST_VIDEO_MAX_BYTES,
  POST_VIDEO_SOURCE_MAX_BYTES,
  PostVideoError,
  type PostVideoOptions,
  type VideoWorkerReply,
} from './post-video-contract';
export * from './post-video-contract';
const ERROR_KEYS = new Set([
  'media.errors.videoUnsupported',
  'media.errors.videoCompression',
  'media.errors.videoDuration',
  'media.errors.videoSize',
  'media.errors.invalidVideo',
]);

/** Strip source metadata for every video; oversized inputs are also compressed locally. */
export async function preparePostVideo(file: File, options: PostVideoOptions = {}): Promise<File> {
  options.signal?.throwIfAborted();
  if (!['video/mp4', 'video/webm'].includes(file.type) || !file.size)
    throw new PostVideoError('media.errors.invalidVideo');
  if (file.size > POST_VIDEO_SOURCE_MAX_BYTES) throw new PostVideoError('media.errors.videoSourceSize');
  if (typeof Worker === 'undefined') throw new PostVideoError('media.errors.videoUnsupported');
  const compressing = file.size > POST_VIDEO_MAX_BYTES;
  return new Promise<File>((resolve, reject) => {
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let finished = false;
    const finish = (error?: unknown, result?: File) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      worker?.terminate();
      error ? reject(error) : resolve(result!);
    };
    const abort = () => finish(new DOMException('Video preparation canceled', 'AbortError'));
    options.signal?.addEventListener('abort', abort, { once: true });
    // A stuck decoder cannot keep resources indefinitely; cancellation also terminates immediately.
    timer = setTimeout(() => finish(new PostVideoError('media.errors.videoCompression')), 10 * 60 * 1000);
    try {
      worker = new Worker(new URL('./post-video.worker', import.meta.url), { type: 'module' });
      worker.onerror = () => finish(new PostVideoError('media.errors.videoCompression'));
      worker.onmessageerror = () => finish(new PostVideoError('media.errors.videoCompression'));
      worker.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (finished) return;
        if (!data || typeof data !== 'object' || !('kind' in data)) {
          finish(new PostVideoError('media.errors.videoCompression'));
          return;
        }
        const reply = data as Partial<VideoWorkerReply>;
        if (
          reply.kind === 'progress' &&
          typeof reply.percent === 'number' &&
          Number.isFinite(reply.percent)
        ) {
          if (compressing) options.onProgress?.(Math.max(0, Math.min(99, Math.floor(reply.percent))));
        } else if (reply.kind === 'done') {
          const result = reply.file;
          if (
            !(result instanceof File) ||
            !result.size ||
            result.size > POST_VIDEO_MAX_BYTES ||
            !['video/mp4', 'video/webm'].includes(result.type)
          )
            finish(new PostVideoError('media.errors.videoCompression'));
          else finish(undefined, result);
        } else if (reply.kind === 'error' && typeof reply.key === 'string') {
          finish(new PostVideoError(ERROR_KEYS.has(reply.key) ? reply.key : 'media.errors.videoCompression'));
        } else finish(new PostVideoError('media.errors.videoCompression'));
      };
      if (compressing) options.onProgress?.(0);
      worker.postMessage(file);
      if (options.signal?.aborted) abort();
    } catch {
      finish(new PostVideoError('media.errors.videoUnsupported'));
    }
  });
}
