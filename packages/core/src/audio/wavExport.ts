import { buildSchedule, calculateFarnsworthTiming, MorseTimingConfig } from './timingEngine';
import type { ScheduleOptions } from './morseScheduler';
import { scheduleText } from './morseScheduler';

type AudioContextLike = Parameters<typeof scheduleText>[0];

export function estimateScheduleDuration(
  text: string,
  config: MorseTimingConfig,
  opts: ScheduleOptions = {},
): number {
  const {
    startDelay = 0,
    prePaddingSeconds = 0,
    extraTrailingDitUnits = 0,
    trimLastWordSpace = false,
  } = opts;
  const elements = buildSchedule(text, config);
  const timing = calculateFarnsworthTiming(config);
  const trailingSeconds = trimLastWordSpace
    ? 0
    : timing.interWord + extraTrailingDitUnits * timing.dit;
  const toneDuration = elements.reduce((sum, el) => sum + el.duration, 0);
  return startDelay + prePaddingSeconds + toneDuration + trailingSeconds;
}

export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const channel = buffer.getChannelData(0);
  const samples = new Int16Array(channel.length);
  for (let i = 0; i < channel.length; i++) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = buffer.sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const headerSize = 44;
  const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = headerSize;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }

  return arrayBuffer;
}

export async function renderMorseWav(
  text: string,
  config: MorseTimingConfig,
  opts: ScheduleOptions = {},
  sampleRate = 44100,
): Promise<ArrayBuffer> {
  const renderOpts = { ...opts, startDelay: 0 };
  const duration = estimateScheduleDuration(text, config, renderOpts);
  const offline = new OfflineAudioContext(
    1,
    Math.max(1, Math.ceil(sampleRate * (duration + 0.05))),
    sampleRate,
  );
  scheduleText(offline as unknown as AudioContextLike, text, config, renderOpts);
  const rendered = await offline.startRendering();
  return encodeWav(rendered);
}
