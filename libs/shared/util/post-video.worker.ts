/// <reference lib="webworker" />
import {
  Input,
  BlobSource,
  MP4,
  WEBM,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  WebMOutputFormat,
  Conversion,
  Quality,
  canEncodeVideo,
  canEncodeAudio,
  type VideoSource,
  type AudioSource,
  type VideoTrackMetadata,
  type AudioTrackMetadata,
} from 'mediabunny';
import {
  POST_VIDEO_MAX_BYTES,
  POST_VIDEO_SOURCE_MAX_BYTES,
  PostVideoError,
  type VideoWorkerReply,
} from './post-video-contract';

const scope = self as DedicatedWorkerGlobalScope;
const send = (reply: VideoWorkerReply) => scope.postMessage(reply);
// Track names can also contain identifying text. Keep only the playback metadata
// supplied by Conversion, including rotation, codec configuration and timing.
class SanitizedOutput extends Output {
  override addVideoTrack(source: VideoSource, metadata: VideoTrackMetadata = {}) {
    return super.addVideoTrack(source, { ...metadata, name: undefined });
  }
  override addAudioTrack(source: AudioSource, metadata: AudioTrackMetadata = {}) {
    return super.addAudioTrack(source, { ...metadata, name: undefined });
  }
}
let running = false;
scope.onmessage = async ({ data }: MessageEvent<File>) => {
  if (running) return;
  running = true;
  try {
    if (
      !(data instanceof File) ||
      !data.size ||
      data.size > POST_VIDEO_SOURCE_MAX_BYTES ||
      !['video/mp4', 'video/webm'].includes(data.type)
    )
      throw new PostVideoError('media.errors.invalidVideo');
    send({ kind: 'done', file: await compress(data) });
  } catch (error) {
    send({
      kind: 'error',
      key: error instanceof PostVideoError ? error.key : 'media.errors.videoCompression',
    });
  }
};

async function compress(file: File): Promise<File> {
  const input = new Input({ source: new BlobSource(file), formats: [MP4, WEBM] });
  try {
    const video = await input.getPrimaryVideoTrack();
    const audio = await input.getPrimaryAudioTrack();
    if (
      !video ||
      !video.displayWidth ||
      !video.displayHeight ||
      video.displayWidth * video.displayHeight > 32_000_000
    )
      throw new PostVideoError('media.errors.invalidVideo');
    const duration = await input.computeDuration(audio ? [video, audio] : [video]);
    // A playable single-frame WebM can have zero inferred duration. It can be
    // remuxed losslessly, but a positive duration is required for bitrate calculation.
    if (!Number.isFinite(duration) || duration < 0) throw new PostVideoError('media.errors.invalidVideo');
    if (duration > 30 * 60) throw new PostVideoError('media.errors.videoDuration');
    if (file.size <= POST_VIDEO_MAX_BYTES) {
      // Rebuild the container without descriptive tags or attached files. Copy packets exactly;
      // rotation and timing information needed for correct playback remain technical metadata.
      const target = new BufferTarget();
      const mp4 = file.type === 'video/mp4';
      const output = new SanitizedOutput({
        target,
        format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(),
      });
      const conversion = await Conversion.init({
        input,
        output,
        tracks: 'primary',
        copy: { mode: 'forced', shiftTolerance: Infinity },
        tags: {},
        showWarnings: false,
      });
      if (
        conversion.isValid &&
        conversion.utilizedTracks.includes(video) &&
        (!audio || conversion.utilizedTracks.includes(audio))
      ) {
        const prepared = await boundedConversion(conversion, target, mp4);
        if (prepared) return prepared;
      } else await conversion.cancel();
      // A boundary-sized input may grow slightly on remux, or its tracks may need transcoding.
      // Fall back to bounded encoding, never to the uncleaned original.
    }
    if (duration === 0) throw new PostVideoError('media.errors.invalidVideo');
    const audioBitrate = audio ? 96_000 : 0;
    // Reserve room for audio, container overhead and encoder variance below the 50 MiB ceiling.
    let bitrate = Math.min(8_000_000, Math.floor((46_000_000 * 8) / duration) - audioBitrate);
    for (let attempt = 0; attempt < 3; attempt++) {
      const maxSide = [1280, 960, 640][attempt];
      const scale = Math.min(1, maxSide / Math.max(video.displayWidth, video.displayHeight));
      const width = Math.max(2, Math.floor((video.displayWidth * scale) / 2) * 2);
      const height = Math.max(2, Math.floor((video.displayHeight * scale) / 2) * 2);
      const quality = new Quality({ bitrate: Math.max(128_000, bitrate) });
      const audioQuality = new Quality({ bitrate: 96_000 });
      const mp4 =
        (await canEncodeVideo('avc', { width, height, quality })) &&
        (!audio ||
          (await canEncodeAudio('aac', { quality: audioQuality, numberOfChannels: 2, sampleRate: 48000 })));
      if (
        !mp4 &&
        !(
          (await canEncodeVideo('vp9', { width, height, quality })) &&
          (!audio ||
            (await canEncodeAudio('opus', { quality: audioQuality, numberOfChannels: 2, sampleRate: 48000 })))
        )
      )
        throw new PostVideoError('media.errors.videoUnsupported');
      const target = new BufferTarget();
      const output = new SanitizedOutput({
        target,
        format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(),
      });
      const conversion = await Conversion.init({
        input,
        output,
        tracks: 'primary',
        tags: {},
        showWarnings: false,
        video: {
          codec: mp4 ? 'avc' : 'vp9',
          quality,
          width,
          height,
          fit: 'contain',
          allowTransformationMetadata: false,
          forceTranscode: true,
        },
        audio: {
          codec: mp4 ? 'aac' : 'opus',
          quality: audioQuality,
          numberOfChannels: 2,
          sampleRate: 48000,
          forceTranscode: true,
        },
      });
      // Never silently produce a video with its original audio track dropped.
      if (
        !conversion.isValid ||
        !conversion.utilizedTracks.includes(video) ||
        (audio && !conversion.utilizedTracks.includes(audio))
      ) {
        await conversion.cancel();
        throw new PostVideoError('media.errors.videoUnsupported');
      }
      const prepared = await boundedConversion(conversion, target, mp4);
      if (prepared) return prepared;
      bitrate = Math.floor(bitrate * 0.65);
    }
    throw new PostVideoError('media.errors.videoSize');
  } finally {
    input.dispose();
  }
}

async function boundedConversion(
  conversion: Conversion,
  target: BufferTarget,
  mp4: boolean,
): Promise<File | undefined> {
  let oversized = false,
    lastPercent = -1;
  const stopListening = target.on('write', ({ end }) => {
    if (end > POST_VIDEO_MAX_BYTES && !oversized) {
      oversized = true;
      void conversion.cancel().catch(() => undefined);
    }
  });
  conversion.onProgress = (progress) => {
    const percent = Math.min(99, Math.floor(progress * 100));
    if (percent !== lastPercent) {
      lastPercent = percent;
      send({ kind: 'progress', percent });
    }
  };
  try {
    await conversion.execute();
    const bytes = target.buffer;
    if (!oversized && bytes && bytes.byteLength > 0 && bytes.byteLength <= POST_VIDEO_MAX_BYTES)
      return new File([bytes], mp4 ? 'post.mp4' : 'post.webm', { type: mp4 ? 'video/mp4' : 'video/webm' });
    return undefined;
  } catch (error) {
    if (!oversized) throw error;
    return undefined;
  } finally {
    stopListening();
    await conversion.cancel();
  }
}
