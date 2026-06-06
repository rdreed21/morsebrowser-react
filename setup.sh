#!/usr/bin/env bash
# ============================================================
# setup.sh — morsebrowser React monorepo
# Run this from wherever you want the project to live.
# Creates: ./morsebrowser-react/
# Roger Reed (rdreed21) | KQ4NKF
# ============================================================
set -euo pipefail

ROOT="morsebrowser-react"
echo ""
echo "  🐇 Morsebrowser React — Setup"
echo "  KQ4NKF // Roger Rabbit"
echo ""

mkdir -p "$ROOT"
cd "$ROOT"

# ── Directories ──────────────────────────────────────────────
mkdir -p \
  packages/types/src \
  packages/core/src/{audio,engine,lessons,settings,__tests__} \
  apps/web/src/{components,hooks,pages} \
  apps/mobile/src/{audio,hooks,screens} \
  tools

git init -q

# ── .gitignore ───────────────────────────────────────────────
cat > .gitignore << 'EOF'
node_modules
.turbo
dist
.expo
*.tsbuildinfo
.env
visual-diff-output
EOF

# ── Root package.json ────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "morsebrowser-react-monorepo",
  "private": true,
  "packageManager": "npm@10.9.7",
  "workspaces": ["packages/*", "apps/web"],
  "scripts": {
    "dev":       "turbo dev",
    "build":     "turbo build",
    "test":      "turbo test",
    "typecheck": "turbo typecheck",
    "mobile":    "cd apps/mobile && npx expo start"
  },
  "devDependencies": {
    "turbo":      "^2.0.0",
    "typescript": "^5.4.0"
  }
}
EOF

# ── turbo.json ───────────────────────────────────────────────
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev":       { "cache": false, "persistent": true },
    "test":      { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] }
  }
}
EOF

# ── Root tsconfig ────────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  }
}
EOF

# ── packages/types ───────────────────────────────────────────
cat > packages/types/package.json << 'EOF'
{
  "name": "@morsebrowser/types",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": { "build": "tsc", "typecheck": "tsc --noEmit" },
  "devDependencies": { "typescript": "^5.4.0" }
}
EOF

cat > packages/types/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
EOF

cat > packages/types/src/index.ts << 'EOF'
export interface MorseTimingConfig {
  charWPM:       number; // character speed
  effectiveWPM:  number; // spacing speed (Farnsworth)
  frequency:     number; // Hz
  volume:        number; // 0.0–1.0
  rampTime:      number; // seconds, prevents click artifacts
}
export interface MorseSettings {
  timing:   MorseTimingConfig;
  lessonId: string;
}
export interface Lesson {
  id:          string;
  name:        string;
  characters:  string[];
  wordFile?:   string;
}
export interface LessonResult {
  char:      string;
  expected:  string;
  correct:   boolean;
  timestamp: number;
}
EOF

echo "  ✅ packages/types"

# ── packages/core ────────────────────────────────────────────
cat > packages/core/package.json << 'EOF'
{
  "name": "@morsebrowser/core",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build":     "tsc",
    "test":      "jest --passWithNoTests",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": { "@morsebrowser/types": "*" },
  "packageManager": "npm@10.9.7",
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest":        "^29.7.0",
    "ts-jest":     "^29.1.0",
    "typescript":  "^5.4.0"
  }
}
EOF

cat > packages/core/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir":  "./dist",
    "rootDir": "./src",
    "lib":     ["ES2020"]
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules", "src/__tests__"]
}
EOF

cat > packages/core/jest.config.js << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@morsebrowser/types$': '<rootDir>/../types/src/index.ts',
  },
};
EOF

cat > packages/core/src/index.ts << 'EOF'
export * from './audio/timingEngine';
export * from './audio/morseScheduler';
export * from './engine/morseMap';
export * from './lessons/lessonLoader';
export * from './settings/settingsManager';
EOF

# ── packages/core — timingEngine ────────────────────────────
cat > packages/core/src/audio/timingEngine.ts << 'TSEOF'
/**
 * timingEngine.ts — PARIS standard + Farnsworth timing
 * All Morse timing math lives here. Nowhere else.
 * No AudioContext refs. Pure math only.
 */
export interface MorseTimingConfig {
  charWPM:      number;
  effectiveWPM: number;
  frequency:    number;
  volume:       number;
  rampTime:     number;
}
export const DEFAULT_TIMING: MorseTimingConfig = {
  charWPM: 20, effectiveWPM: 15,
  frequency: 600, volume: 0.8, rampTime: 0.005,
};

/** 1 unit at N WPM — PARIS standard */
export function unitDuration(wpm: number): number { return 1.2 / wpm; }

export interface MorseTiming {
  dit: number; dah: number;
  interElement: number; interChar: number; interWord: number;
}

/** Farnsworth: chars at charWPM, spacing slowed to effectiveWPM */
export function calculateFarnsworthTiming(cfg: MorseTimingConfig): MorseTiming {
  const cu = unitDuration(cfg.charWPM);
  const toneTime   = 31 * cu;
  const totalTime  = 60 / cfg.effectiveWPM;
  const spaceTime  = totalTime - toneTime;
  const fw         = spaceTime / 19;
  return {
    dit: cu, dah: 3 * cu,
    interElement: cu,
    interChar: Math.max(3 * cu, fw * 3),
    interWord: Math.max(7 * cu, fw * 7),
  };
}

export type ElementType = 'dit'|'dah'|'interElement'|'interChar'|'interWord';
export interface ScheduledElement {
  type: ElementType; duration: number; isTone: boolean;
}

const MORSE_MAP: Record<string, string> = {
  A:'.-',B:'-...',C:'-.-.',D:'-..', E:'.',  F:'..-.',G:'--.',H:'....',
  I:'..',J:'.---',K:'-.-', L:'.-..', M:'--',N:'-.',O:'---',P:'.--.',
  Q:'--.-',R:'.-.',S:'...',T:'-',   U:'..-',V:'...-',W:'.--',X:'-..-',
  Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..',  '9':'----.',
  '.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-',
};

/** Build flat array of scheduled tone/silence elements from text */
export function buildSchedule(text: string, cfg: MorseTimingConfig): ScheduledElement[] {
  const t = calculateFarnsworthTiming(cfg);
  const els: ScheduledElement[] = [];
  const words = text.toUpperCase().trim().split(/\s+/);
  words.forEach((word, wi) => {
    word.split('').forEach((ch, ci) => {
      const morse = MORSE_MAP[ch];
      if (!morse) return;
      morse.split('').forEach((sym, si) => {
        els.push({ type: sym==='.'?'dit':'dah', duration: sym==='.'?t.dit:t.dah, isTone: true });
        if (si < morse.length-1)
          els.push({ type:'interElement', duration:t.interElement, isTone:false });
      });
      if (ci < word.length-1)
        els.push({ type:'interChar', duration:t.interChar, isTone:false });
    });
    if (wi < words.length-1)
      els.push({ type:'interWord', duration:t.interWord, isTone:false });
  });
  return els;
}

export function sequenceDuration(els: ScheduledElement[]): number {
  return els.reduce((s, e) => s + e.duration, 0);
}

export const KOCH_ORDER: string[] = [
  'K','M','R','S','U','A','P','T','L','O','W','I','.','N','J','E','F',
  '0','Y','V','G','5','/','Q','9','Z','H','3','8','B','?','4','2','7',
  'C','1','D','6','X',
];
export function kochCharsForLesson(n: number): string[] {
  return KOCH_ORDER.slice(0, Math.max(2, n));
}
TSEOF

# ── packages/core — morseScheduler ──────────────────────────
cat > packages/core/src/audio/morseScheduler.ts << 'TSEOF'
/**
 * morseScheduler.ts
 * Pre-schedules morse audio on the audio clock.
 * Works with browser AudioContext AND react-native-audio-api.
 * NEVER uses setTimeout for timing.
 */
import { buildSchedule, MorseTimingConfig } from './timingEngine';

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
  const { startDelay = 0.1, onComplete } = opts;
  const elements = buildSchedule(text, config);
  const { rampTime, frequency, volume } = config;
  const oscillators: OscillatorNodeLike[] = [];

  let t = ctx.currentTime + startDelay;
  let total = 0;

  for (const el of elements) {
    if (el.isTone) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;

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
TSEOF

# ── packages/core — remaining source files ───────────────────
cat > packages/core/src/engine/morseMap.ts << 'TSEOF'
// Agent 2: verify this matches the KO app's morse.js character set exactly
export const MORSE_MAP: Record<string, string> = {
  A:'.-',B:'-...',C:'-.-.',D:'-..', E:'.',  F:'..-.',G:'--.',H:'....',
  I:'..',J:'.---',K:'-.-', L:'.-..', M:'--',N:'-.',  O:'---',P:'.--.',
  Q:'--.-',R:'.-.',S:'...',T:'-',   U:'..-',V:'...-',W:'.--',X:'-..-',
  Y:'-.--',Z:'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..',  '9':'----.',
  '.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-',
  '+':'.-.-.','-':'-....-',"'":'.--.--','(':'-.--.',')':'-.--.-',
};
export function textToMorse(text: string): string {
  return text.toUpperCase().trim().split('')
    .map(c => MORSE_MAP[c] ?? (c===' '?'/':'?')).join(' ');
}
const REV: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k,v])=>[v,k])
);
export function morseToText(morse: string): string {
  return morse.split(' / ')
    .map(w => w.split(' ').map(c=>REV[c]??'?').join('')).join(' ');
}
TSEOF

cat > packages/core/src/settings/settingsManager.ts << 'TSEOF'
// Agent 2: grep the KO app for localStorage.setItem and match the key exactly
// If the key changes, upgrading users lose all saved settings
import type { MorseSettings } from '@morsebrowser/types';

const KEY = 'morsebrowser_settings'; // verify against KO app

export const DEFAULT_SETTINGS: MorseSettings = {
  timing: { charWPM:20, effectiveWPM:15, frequency:600, volume:0.8, rampTime:0.005 },
  lessonId: 'lesson_1',
};

function deepMerge<T extends object>(def: T, ov: Partial<T>): T {
  const r = { ...def };
  for (const k of Object.keys(ov) as (keyof T)[]) {
    const v = ov[k];
    if (v && typeof v==='object' && !Array.isArray(v))
      r[k] = deepMerge(def[k] as object, v as object) as T[keyof T];
    else if (v !== undefined) r[k] = v as T[keyof T];
  }
  return r;
}

export function loadSettings(): MorseSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? deepMerge(DEFAULT_SETTINGS, JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}
export function saveSettings(s: MorseSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
export function resetSettings(): void { localStorage.removeItem(KEY); }
TSEOF

cat > packages/core/src/lessons/lessonLoader.ts << 'TSEOF'
// Agent 2: port the lesson/word file loading from the KO app (srd/wordfiles)
import type { Lesson } from '@morsebrowser/types';
import { kochCharsForLesson } from '../audio/timingEngine';

export async function loadLesson(id: string): Promise<Lesson> {
  const n = parseInt(id.replace('lesson_',''), 10) || 1;
  return { id, name: `Lesson ${n}`, characters: kochCharsForLesson(n) };
}
export async function loadWordList(filename: string): Promise<string[]> {
  const res = await fetch(`/srd/wordfiles/${filename}`);
  if (!res.ok) throw new Error(`Word file not found: ${filename}`);
  return (await res.text()).split('\n').map(w=>w.trim()).filter(Boolean);
}
TSEOF

# ── packages/core — tests ────────────────────────────────────
cat > packages/core/src/__tests__/timingEngine.test.ts << 'TSEOF'
import {
  unitDuration, calculateFarnsworthTiming,
  buildSchedule, sequenceDuration,
  DEFAULT_TIMING, KOCH_ORDER, kochCharsForLesson,
} from '../audio/timingEngine';

describe('unitDuration', () => {
  it('20 WPM = 60ms',  () => expect(unitDuration(20)).toBeCloseTo(0.06, 5));
  it('5 WPM = 240ms',  () => expect(unitDuration(5)).toBeCloseTo(0.24, 5));
  it('slower at lower WPM', () => expect(unitDuration(10)).toBeGreaterThan(unitDuration(20)));
});

describe('calculateFarnsworthTiming', () => {
  const std = { ...DEFAULT_TIMING, charWPM:20, effectiveWPM:20 };
  const fw  = { ...DEFAULT_TIMING, charWPM:20, effectiveWPM:10 };
  it('dit = 60ms at 20wpm',  () => expect(calculateFarnsworthTiming(std).dit).toBeCloseTo(0.06,4));
  it('dah = 180ms at 20wpm', () => expect(calculateFarnsworthTiming(std).dah).toBeCloseTo(0.18,4));
  it('farnsworth spacing > standard', () => {
    expect(calculateFarnsworthTiming(fw).interChar)
      .toBeGreaterThan(calculateFarnsworthTiming(std).interChar);
  });
  it('farnsworth dit unchanged', () => {
    expect(calculateFarnsworthTiming(fw).dit)
      .toBeCloseTo(calculateFarnsworthTiming(std).dit, 5);
  });
});

describe('buildSchedule', () => {
  it('E = single dit',      () => { const e=buildSchedule('E',DEFAULT_TIMING); expect(e).toHaveLength(1); expect(e[0].type).toBe('dit'); });
  it('T = single dah',      () => expect(buildSchedule('T',DEFAULT_TIMING)[0].type).toBe('dah'));
  it('K (-.-) = 3 tones',   () => expect(buildSchedule('K',DEFAULT_TIMING).filter(e=>e.isTone)).toHaveLength(3));
  it('KM has 1 interChar',  () => expect(buildSchedule('KM',DEFAULT_TIMING).filter(e=>e.type==='interChar')).toHaveLength(1));
  it('K M has 1 interWord', () => expect(buildSchedule('K M',DEFAULT_TIMING).filter(e=>e.type==='interWord')).toHaveLength(1));
  it('all durations > 0',   () => buildSchedule('CQ DE KQ4NKF',DEFAULT_TIMING).forEach(e=>expect(e.duration).toBeGreaterThan(0)));
  it('sequenceDuration = sum', () => {
    const els = buildSchedule('KM',DEFAULT_TIMING);
    expect(sequenceDuration(els)).toBeCloseTo(els.reduce((s,e)=>s+e.duration,0),10);
  });
});

describe('Koch', () => {
  it('starts K M',   () => { expect(KOCH_ORDER[0]).toBe('K'); expect(KOCH_ORDER[1]).toBe('M'); });
  it('39 chars',     () => expect(KOCH_ORDER).toHaveLength(39));
  it('lesson 2 = K M', () => expect(kochCharsForLesson(2)).toEqual(['K','M']));
});
TSEOF

echo "  ✅ packages/core"

# ── apps/web ─────────────────────────────────────────────────
cat > apps/web/package.json << 'EOF'
{
  "name": "web",
  "version": "0.0.1",
  "scripts": {
    "dev":       "vite",
    "build":     "tsc && vite build",
    "test":      "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@morsebrowser/core":  "*",
    "@morsebrowser/types": "*",
    "bootstrap":  "^5.3.3",
    "react":      "^19.0.0",
    "react-dom":  "^19.0.0"
  },
  "packageManager": "npm@10.9.7",
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react":    "^16.0.0",
    "@types/react":              "^19.0.0",
    "@types/react-dom":          "^19.0.0",
    "@vitejs/plugin-react":      "^4.3.0",
    "jsdom":       "^24.0.0",
    "typescript":  "^5.4.0",
    "vite":        "^5.4.0",
    "vitest":      "^1.6.0"
  }
}
EOF

cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2020","DOM","DOM.Iterable"],
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src","vite.config.ts"],
  "exclude": ["node_modules","dist"]
}
EOF

cat > apps/web/vite.config.ts << 'TSEOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@morsebrowser/core':  path.resolve(__dirname,'../../packages/core/src/index.ts'),
      '@morsebrowser/types': path.resolve(__dirname,'../../packages/types/src/index.ts'),
    },
  },
  // Proxy word files from KO app running locally on 3001
  server: { proxy: { '/srd': { target:'http://localhost:3001', changeOrigin:true } } },
  test: { environment:'jsdom', setupFiles:['./src/test-setup.ts'], globals:true },
});
TSEOF

cat > apps/web/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    <title>LICW Morse Practice</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > apps/web/src/main.tsx << 'TSEOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
TSEOF

cat > apps/web/src/App.tsx << 'TSEOF'
// Agent 3: replace this with components from COMPONENT_MAP.md
// Reference: rdreed21/morsebrowser_dev develop branch — NOT upstream
import React from 'react';
export default function App() {
  return (
    <div className="container-fluid">
      <p className="text-muted mt-3">Migration in progress — see COMPONENT_MAP.md</p>
    </div>
  );
}
TSEOF

cat > apps/web/src/hooks/useMorsePlayer.ts << 'TSEOF'
import { useRef, useCallback, useState } from 'react';
import { scheduleText } from '@morsebrowser/core';
import type { MorseTimingConfig } from '@morsebrowser/types';

export function useMorsePlayer(config: MorseTimingConfig) {
  const ctxRef  = useRef<AudioContext|null>(null);
  const cancelRef = useRef<(()=>void)|null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state==='closed')
      ctxRef.current = new AudioContext();
    if (ctxRef.current.state==='suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const play = useCallback((text: string) => {
    if (isPlaying) cancelRef.current?.();
    setIsPlaying(true);
    const s = scheduleText(getCtx() as any, text, config, {
      onComplete: () => setIsPlaying(false),
    });
    cancelRef.current = s.cancel;
  }, [config, getCtx, isPlaying]);

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}
TSEOF

cat > apps/web/src/test-setup.ts << 'EOF'
import '@testing-library/jest-dom';
EOF

echo "  ✅ apps/web"

# ── apps/mobile ───────────────────────────────────────────────
cat > apps/mobile/package.json << 'EOF'
{
  "name": "mobile",
  "version": "0.0.1",
  "main": "expo-router/entry",
  "scripts": {
    "start":     "expo start",
    "ios":       "expo run:ios",
    "build:ios": "eas build --platform ios --profile preview"
  },
  "dependencies": {
    "@morsebrowser/core":     "file:../../packages/core",
    "@morsebrowser/types":    "file:../../packages/types",
    "expo":                   "~56.0.0",
    "expo-audio":             "*",
    "expo-router":            "*",
    "react-native-audio-api": "latest",
    "nativewind":             "*",
    "tailwindcss":            "*"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "typescript":  "^5.4.0"
  }
}
EOF

cat > apps/mobile/app.json << 'EOF'
{
  "expo": {
    "name":    "LICW Morsebrowser",
    "slug":    "morsebrowser",
    "version": "1.0.0",
    "platforms": ["ios"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "net.reedgames.morsebrowser",
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "Required by audio framework."
      }
    },
    "plugins": [
      "expo-router",
      ["react-native-audio-api", { "enableBackgroundAudio": true }]
    ],
    "scheme": "morsebrowser"
  }
}
EOF

cat > apps/mobile/tsconfig.json << 'EOF'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@morsebrowser/core":  ["../../packages/core/src/index.ts"],
      "@morsebrowser/types": ["../../packages/types/src/index.ts"]
    }
  }
}
EOF

cat > apps/mobile/babel.config.js << 'EOF'
module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'], plugins: ['nativewind/babel'] };
};
EOF

cat > apps/mobile/eas.json << 'EOF'
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  {}
  }
}
EOF

cat > apps/mobile/src/audio/audioSession.ts << 'TSEOF'
/**
 * audioSession.ts — iOS background audio setup
 * Call configureAudioSession() on app mount BEFORE any AudioContext.
 * app.json already has UIBackgroundModes:audio — do not remove it.
 */
import { Platform } from 'react-native';

export async function configureAudioSession(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    const { setAudioModeAsync } = await import('expo-audio');
    await setAudioModeAsync({
      playsInSilentModeIOS:    true,
      staysActiveInBackground: true,
      interruptionModeIOS:     'DoNotMix' as const,
    });
    console.log('[Audio] iOS session ready — background OK');
  } catch (err) {
    console.error('[Audio] Session config failed:', err);
  }
}
TSEOF

cat > apps/mobile/src/hooks/useMorsePlayer.ts << 'TSEOF'
import { useRef, useCallback, useState, useEffect } from 'react';
import { AudioContext } from 'react-native-audio-api';
import { scheduleText } from '@morsebrowser/core';
import { configureAudioSession } from '../audio/audioSession';
import type { MorseTimingConfig } from '@morsebrowser/types';

export function useMorsePlayer(config: MorseTimingConfig) {
  const ctxRef     = useRef<AudioContext|null>(null);
  const cancelRef  = useRef<(()=>void)|null>(null);
  const ready      = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Must run before any AudioContext
    configureAudioSession().then(() => { ready.current = true; });
    return () => { ctxRef.current?.close?.(); };
  }, []);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    return ctxRef.current;
  }, []);

  const play = useCallback((text: string) => {
    if (!ready.current) { console.warn('[Morse] Session not ready'); return; }
    cancelRef.current?.();
    setIsPlaying(true);
    const s = scheduleText(getCtx() as any, text, config, {
      onComplete: () => setIsPlaying(false),
    });
    cancelRef.current = s.cancel;
  }, [config, getCtx]);

  const stop = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setIsPlaying(false);
  }, []);

  return { play, stop, isPlaying };
}
TSEOF

cat > apps/mobile/.npmrc << 'EOF'
legacy-peer-deps=true
workspaces=false
EOF

echo "  ✅ apps/mobile"

# ── tools/visual-diff.mjs ────────────────────────────────────
cat > tools/visual-diff.mjs << 'EOF'
#!/usr/bin/env node
/**
 * visual-diff.mjs — Screenshot diff: KO fork vs React
 * Agent 3 runs this after each major component.
 *
 * Setup: npm install -D playwright pixelmatch pngjs
 *        npx playwright install chromium
 * Usage: node tools/visual-diff.mjs
 */
import { chromium } from 'playwright';
import { PNG }      from 'pngjs';
import pixelmatch   from 'pixelmatch';
import fs           from 'fs';
import path         from 'path';

const KO_URL    = process.env.KO_URL    || 'http://localhost:3001/index.html';
const REACT_URL = process.env.REACT_URL || 'http://localhost:5173';
const OUT       = path.resolve('./visual-diff-output');
const VIEWPORTS = [
  { name:'desktop', width:1280, height:900 },
  { name:'tablet',  width:768,  height:1024 },
];

fs.mkdirSync(OUT, { recursive:true });

const browser = await chromium.launch();
let fails = 0;

console.log('\n🔍 Visual Diff — KO fork vs React\n');

for (const vp of VIEWPORTS) {
  console.log(`── ${vp.name} (${vp.width}×${vp.height})`);
  const page = await browser.newPage();
  await page.setViewportSize(vp);

  const koF    = path.join(OUT, `${vp.name}-ko.png`);
  const reactF = path.join(OUT, `${vp.name}-react.png`);
  const diffF  = path.join(OUT, `${vp.name}-diff.png`);

  await page.goto(KO_URL,    { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path:koF, fullPage:true });

  await page.goto(REACT_URL, { waitUntil:'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path:reactF, fullPage:true });
  await page.close();

  const ref = PNG.sync.read(fs.readFileSync(koF));
  const cur = PNG.sync.read(fs.readFileSync(reactF));
  const diff = new PNG({ width:ref.width, height:ref.height });
  const px = pixelmatch(ref.data, cur.data, diff.data, ref.width, ref.height, { threshold:0.005 });
  fs.writeFileSync(diffF, PNG.sync.write(diff));

  if (px === 0) { console.log(`  ✅ Pixel-perfect`); }
  else { console.log(`  ❌ ${px} pixels differ — diff: ${diffF}`); fails++; }
}

await browser.close();
console.log(`\n${fails===0 ? '✅ All viewports match' : `❌ ${fails} viewport(s) failed`}\n`);
process.exit(fails > 0 ? 1 : 0);
EOF

echo "  ✅ tools/visual-diff.mjs"

# ── COMPONENT_MAP template ────────────────────────────────────
cat > COMPONENT_MAP.md << 'EOF'
# Component Map — KO → React Migration
Fill this in using Agent 1 (Audit Agent).
Reference: rdreed21/morsebrowser_dev (develop branch)

## Views / Sections
| # | Section | Bootstrap Class | Visible When | React Component |
|---|---|---|---|---|
| 1 | ... | ... | Always | `<.../>`  |

## ko.observable → useState
| Observable | Default | Controls | React |
|---|---|---|---|
| ... | ... | ... | ... |

## ko.computed → useMemo
| Computed | Depends On | React |
|---|---|---|
| ... | ... | ... |

## Event Handlers
| KO Handler | Trigger | React Event |
|---|---|---|
| ... | ... | ... |

## Audio Touch Points (port to morseScheduler)
| File:Line | What It Does |
|---|---|
| morse.js:?? | ... |

## Bootstrap Classes to Preserve
| Element | Classes |
|---|---|
| ... | ... |
EOF

echo "  ✅ COMPONENT_MAP.md"

# ── CLAUDE.md ─────────────────────────────────────────────────
cat > CLAUDE.md << 'EOF'
# CLAUDE.md — morsebrowser React Migration
Owner: Roger Reed (rdreed21) | KQ4NKF

## Hard Requirements
| # | Requirement | Solution |
|---|---|---|
| 1 | iOS audio through screen lock | react-native-audio-api + UIBackgroundModes:audio + configureAudioSession() |
| 2 | Accurate Morse timing | Pre-schedule on AudioContext clock — zero setTimeout |
| 3 | Match fork look/feel | rdreed21/morsebrowser_dev develop, Bootstrap 5, no redesign |

## Agents
| Agent | Directory | Job |
|---|---|---|
| 1 Audit | KO repo root | Produce COMPONENT_MAP.md (others wait on this) |
| 2 Core  | packages/core/ | Verify timing, port lessons, check localStorage keys |
| 3 Web   | apps/web/ | React + Bootstrap, run visual-diff.mjs per component |
| 4 Mobile| apps/mobile/ | Expo + background audio, test on real iPhone |

## KO → React Quick Reference
| KO | React |
|---|---|
| ko.observable(x) | useState(x) |
| ko.computed(()=>x+y) | useMemo(()=>x+y,[x,y]) |
| data-bind="text:x" | {x} |
| data-bind="visible:x" | {x && <div>} |
| data-bind="foreach:arr" | {arr.map(i=>...)} |
| data-bind="click:fn" | onClick={fn} |
| data-bind="value:x" | value={x} onChange={...} |
| data-bind="css:{a:x}" | className={x?'a':''} |

## Commands
npm install          — first time only
turbo dev --filter=web   — web dev server
turbo test           — all tests
node tools/visual-diff.mjs  — screenshot diff

## Audio Rules
- Never setTimeout for Morse timing
- Always scheduleText from @morsebrowser/core
- Mobile: call configureAudioSession() before any AudioContext
- Background audio: test on real iPhone not Simulator
EOF

echo ""
echo "  ════════════════════════════════════════"
echo "  ✅ Setup complete"
echo ""
echo "  Next: cd $ROOT && npm install"
echo "  ════════════════════════════════════════"
echo ""
