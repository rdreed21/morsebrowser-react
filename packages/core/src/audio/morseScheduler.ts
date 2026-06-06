/**
 * morseScheduler.ts
 * Pre-schedules morse audio on the audio clock.
 * Works with browser AudioContext AND react-native-audio-api.
 * NEVER uses setTimeout for timing.
 */
import {
  buildSchedule, calculateFarnsworthTiming, MorseTimingConfig, toneFrequency,
} from './timingEngine';

interface AudioContextLike {
  currentTime: number;
  destination: AudioNodeLike;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
}
interface AudioNodeLike { connect(t: AudioNodeLike): void; }
interface OscillatorNodeLike extends AudioNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
}
interface GainNodeLike extends AudioNodeLike { gain: AudioParamLike; }
interface AudioParamLike {
  value: number;
  setValueAtTime(v: number, t: number): void;
  linearRampToValueAtTime(v: number, t: number): void;
}

export interface ScheduleOptions {
  startDelay?: number;
  /** Leading silence before tones (KO preSpace, seconds). */
  prePaddingSeconds?: number;
  /** Extra trailing silence in dit units (KO xtraWordSpaceDits). */
  extraTrailingDitUnits?: number;
  /** Omit standard trailing word space (KO trimLastWordSpace). */
  trimLastWordSpace?: boolean;
  onComplete?: () => void;
}
export interface ScheduledSession {
  cancel: () => void;
  durationSeconds: number;
}

/**
 * Schedule full morse sequence using the audio clock.
 * Web:    scheduleText(new AudioContext(), text, config)
 * Mobile: scheduleText(new AudioContext() from react-native-audio-api, text, config)
 */
export function scheduleText(
  ctx: AudioContextLike,
  text: string,
  config: MorseTimingConfig,
  opts: ScheduleOptions = {}
): ScheduledSession {
  const {
    startDelay = 0.1,
    prePaddingSeconds = 0,
    extraTrailingDitUnits = 0,
    trimLastWordSpace = false,
    onComplete,
  } = opts;
  const elements = buildSchedule(text, config);
  const { rampTime, volume } = config;
  const oscillators: OscillatorNodeLike[] = [];
  const timing = calculateFarnsworthTiming(config);
  const trailingSeconds = trimLastWordSpace
    ? 0
    : timing.interWord + extraTrailingDitUnits * timing.dit;

  let t = ctx.currentTime + startDelay + prePaddingSeconds;
  let total = prePaddingSeconds + trailingSeconds;

  for (const el of elements) {
    if (el.isTone) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = toneFrequency(config, el.type === 'dah' ? 'dah' : 'dit');

      // 5ms ramp — click-free CW envelope
      const s = t, e = t + el.duration;
      gain.gain.setValueAtTime(0, s);
      gain.gain.linearRampToValueAtTime(volume, s + rampTime);
      gain.gain.setValueAtTime(volume, Math.max(s + rampTime, e - rampTime));
      gain.gain.linearRampToValueAtTime(0, e);
      osc.start(s);
      osc.stop(e);
      oscillators.push(osc);
    }
    t += el.duration;
    total += el.duration;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  if (onComplete) {
    timer = setTimeout(onComplete, (total + startDelay) * 1000);
  }

  return {
    durationSeconds: total,
    cancel: () => {
      if (timer) clearTimeout(timer);
      oscillators.forEach(o => { try { o.stop(ctx.currentTime); } catch {} });
    },
  };
}

export function scheduleChar(
  ctx: AudioContextLike, char: string,
  config: MorseTimingConfig, opts: ScheduleOptions = {}
): ScheduledSession { return scheduleText(ctx, char, config, opts); }

/** Sustained test tone for Zero Beat — KO testToneDuration default 10s. */
export function scheduleTestTone(
  ctx: AudioContextLike,
  config: MorseTimingConfig,
  durationSeconds = 10,
  opts: ScheduleOptions = {},
): ScheduledSession {
  const { startDelay = 0.1, onComplete } = opts;
  const { rampTime, volume } = config;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = toneFrequency(config, 'dit');

  const s = ctx.currentTime + startDelay;
  const e = s + durationSeconds;
  gain.gain.setValueAtTime(0, s);
  gain.gain.linearRampToValueAtTime(volume, s + rampTime);
  gain.gain.setValueAtTime(volume, Math.max(s + rampTime, e - rampTime));
  gain.gain.linearRampToValueAtTime(0, e);
  osc.start(s);
  osc.stop(e);

  let timer: ReturnType<typeof setTimeout> | null = null;
  if (onComplete) {
    timer = setTimeout(onComplete, (durationSeconds + startDelay) * 1000);
  }

  return {
    durationSeconds,
    cancel: () => {
      if (timer) clearTimeout(timer);
      try { osc.stop(ctx.currentTime); } catch { /* already stopped */ }
    },
  };
}
