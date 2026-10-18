export const POST_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const POST_VIDEO_SOURCE_MAX_BYTES = 512 * 1024 * 1024;

export class PostVideoError extends Error {
  constructor(readonly key: string) {
    super(key);
  }
}
export interface PostVideoOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}
export type VideoWorkerReply =
  { kind: 'progress'; percent: number } | { kind: 'done'; file: File } | { kind: 'error'; key: string };
