/**
 * timingEngine.ts — PARIS standard + Farnsworth timing
 * All Morse timing math lives here. Nowhere else.
 * No AudioContext refs. Pure math only.
 *
 * Farnsworth math matches KO app:
 *   src/morse/timing/UnitTimingsAndMultipliers.ts
 *   src/morse-pro/morse-pro-wpm.js
 */
import { charToMorse, tokenizeText } from '../engine/morseMap';

export interface MorseTimingConfig {
  charWPM:      number;
  effectiveWPM: number;
  frequency:    number;
  ditFrequency?: number;
  dahFrequency?: number;
  volume:       number;
  rampTime:     number;
}

/** KO SmoothedSoundsPlayer — separate dit/dah oscillator frequencies. */
export function toneFrequency(cfg: MorseTimingConfig, type: 'dit' | 'dah'): number {
  const dit = cfg.ditFrequency ?? cfg.frequency;
  const dah = cfg.dahFrequency ?? cfg.frequency;
  return type === 'dit' ? dit : dah;
}

export const DEFAULT_TIMING: MorseTimingConfig = {
  charWPM: 12, effectiveWPM: 12,
  frequency: 500, volume: 1.0, rampTime: 0.005,
};

/** 1 unit at N WPM — PARIS standard: 60 / (50 * wpm) = 1.2 / wpm seconds */
export function unitDuration(wpm: number): number {
  return 1.2 / wpm;
}

export interface MorseTiming {
  dit: number;
  dah: number;
  interElement: number;
  interChar: number;
  interWord: number;
}

/**
 * Farnsworth: dits/dahs at charWPM, inter-char and inter-word at effectiveWPM.
 * Matches KO UnitTimingsAndMultipliers:
 *   calculatedFWUnitSeconds = ((60 / fwpm) - 31 * cu) / 19
 */
export function calculateFarnsworthTiming(cfg: MorseTimingConfig): MorseTiming {
  const charWPM      = Math.max(1, cfg.charWPM);
  const effectiveWPM = Math.min(Math.max(1, cfg.effectiveWPM), charWPM);

  const cu = unitDuration(charWPM);
  const fwUnit = ((60 / effectiveWPM) - 31 * cu) / 19;

  return {
    dit: cu,
    dah: 3 * cu,
    interElement: cu,
    interChar: Math.max(3 * cu, 3 * fwUnit),
    interWord: Math.max(7 * cu, 7 * fwUnit),
  };
}

export type ElementType = 'dit' | 'dah' | 'interElement' | 'interChar' | 'interWord';

export interface ScheduledElement {
  type: ElementType;
  duration: number;
  isTone: boolean;
}

/** Build flat array of scheduled tone/silence elements from text */
export function buildSchedule(text: string, cfg: MorseTimingConfig): ScheduledElement[] {
  const t = calculateFarnsworthTiming(cfg);
  const els: ScheduledElement[] = [];
  const words = text.toUpperCase().trim().split(/\s+/);

  words.forEach((word, wi) => {
    const tokens = tokenizeText(word, true);
    tokens.forEach((token, ci) => {
      const morse = charToMorse(token);
      if (!morse) return;

      for (let si = 0; si < morse.length; si++) {
        const sym = morse[si];
        els.push({
          type: sym === '.' ? 'dit' : 'dah',
          duration: sym === '.' ? t.dit : t.dah,
          isTone: true,
        });
        if (si < morse.length - 1) {
          els.push({ type: 'interElement', duration: t.interElement, isTone: false });
        }
      }
      if (ci < tokens.length - 1) {
        els.push({ type: 'interChar', duration: t.interChar, isTone: false });
      }
    });
    if (wi < words.length - 1) {
      els.push({ type: 'interWord', duration: t.interWord, isTone: false });
    }
  });

  return els;
}

export function sequenceDuration(els: ScheduledElement[]): number {
  return els.reduce((s, e) => s + e.duration, 0);
}

/** Koch lesson character order (BC2 KMY progression) */
export const KOCH_ORDER: string[] = [
  'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O', 'W', 'I', '.', 'N', 'J', 'E', 'F',
  '0', 'Y', 'V', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8', 'B', '?', '4', '2', '7',
  'C', '1', 'D', '6', 'X',
];

export function kochCharsForLesson(n: number): string[] {
  return KOCH_ORDER.slice(0, Math.max(2, n));
}
