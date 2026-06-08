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
  sampleRate: number;
  destination: AudioNodeLike;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
}
interface AudioNodeLike {
  connect(t: AudioNodeLike): void;
  disconnect(t?: AudioNodeLike): void;
}
interface OscillatorNodeLike extends AudioNodeLike {
  type: OscillatorType;
  frequency: AudioParamLike;
  start(when?: number): void;
  stop(when?: number): void;
  onEnded?: (event: unknown) => void;
}
interface GainNodeLike extends AudioNodeLike { gain: AudioParamLike; }
interface AudioParamLike {
  value: number;
  setValueAtTime(v: number, t: number): void;
  linearRampToValueAtTime(v: number, t: number): void;
  setValueCurveAtTime(values: Float32Array, startTime: number, duration: number): void;
}

const RENDER_QUANTUM_FRAMES = 128;

/**
 * Snap a clock time forward to the start of the next 128-frame render quantum.
 *
 * react-native-audio-api's native OscillatorNode mishandles starts that land
 * partway through a render quantum: it computes nonSilentFramesToProcess from
 * startOffset, then reuses startOffset as the loop's starting index over that
 * count — applying the offset twice — which truncates/discontinuities the
 * very first samples and is heard as a brief high-pitched chirp. A start that
 * lands exactly on a quantum boundary has startOffset 0 and never takes that
 * path. The snap is at most ~2.9ms (128 frames @ 44.1kHz) — far smaller than
 * any inter-element Morse gap (the shortest, interElement, is a full dit unit,
 * 20ms+ even at very high WPM) — so consecutive tones can't be pushed into
 * overlapping each other.
 */
function snapToRenderQuantum(ctx: AudioContextLike, time: number): number {
  const { sampleRate } = ctx;
  if (!sampleRate) return time;
  const frame = Math.ceil(time * sampleRate);
  const snappedFrame = Math.ceil(frame / RENDER_QUANTUM_FRAMES) * RENDER_QUANTUM_FRAMES;
  return snappedFrame / sampleRate;
}

/**
 * Single-shot trapezoid envelope (rise / sustain / fall) as a sample curve —
 * one setValueCurveAtTime call instead of four setValueAtTime/linearRamp
 * calls, simply to minimize automation events scheduled per tone.
 */
function buildEnvelopeCurve(durationSeconds: number, rampSeconds: number, peak: number): Float32Array {
  const fade = Math.max(0, Math.min(rampSeconds, durationSeconds / 2));
  // Scale resolution to the ramp so short CW elements stay smooth; the cap
  // only matters for the long sustained test tone (duration >> rampTime),
  // where 4x the duration/ramp ratio would otherwise balloon (10s / 5ms * 4
  // = 8000) — 2048 still keeps ~5ms-equivalent sample spacing for that case.
  const sampleCount = Math.max(8, Math.min(2048, Math.ceil((durationSeconds / Math.max(fade, 0.001)) * 4)));
  const curve = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const time = (i / (sampleCount - 1)) * durationSeconds;
    if (fade <= 0) {
      curve[i] = peak;
    } else if (time < fade) {
      curve[i] = peak * (time / fade);
    } else if (time > durationSeconds - fade) {
      curve[i] = peak * ((durationSeconds - time) / fade);
    } else {
      curve[i] = peak;
    }
  }
  return curve;
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
      gain.gain.value = 0;

      // Snap only the actual native start time forward to the next render
      // quantum (see snapToRenderQuantum) — t itself keeps accumulating from
      // the precise Morse-timing schedule so per-tone snaps (sub-3ms each)
      // can't compound into audible drift across a long word.
      const s = snapToRenderQuantum(ctx, t);
      const e = s + el.duration;
      // 5ms ramp — click-free CW envelope, scheduled as a single curve.
      gain.gain.setValueCurveAtTime(buildEnvelopeCurve(el.duration, rampTime, volume), s, el.duration);
      osc.start(s);
      osc.stop(e);
      // Without this, finished oscillator/gain pairs stay connected to the
      // graph for the rest of the session — across many chunks that piles up
      // and is a likely source of the audible glitches reported on real
      // devices (clean at first, degrading after the first word or two).
      osc.onEnded = () => {
        try { osc.disconnect(); } catch {}
        try { gain.disconnect(); } catch {}
      };
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
  gain.gain.value = 0;

  const s = snapToRenderQuantum(ctx, ctx.currentTime + startDelay);
  const e = s + durationSeconds;
  gain.gain.setValueCurveAtTime(buildEnvelopeCurve(durationSeconds, rampTime, volume), s, durationSeconds);
  osc.start(s);
  osc.stop(e);
  osc.onEnded = () => {
    try { osc.disconnect(); } catch {}
    try { gain.disconnect(); } catch {}
  };

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
