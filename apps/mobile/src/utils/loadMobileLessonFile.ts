/**
 * Load lesson wordfiles on React Native.
 * Dev: Metro serves /wordfiles/* (see metro.config.js).
 * Release: reads from synced assets/wordfiles on disk via expo-file-system.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import {
  loadLessonFile,
  PRESETS_BASE_PATH,
  WORDFILES_BASE_PATH,
  type LessonFileResult,
} from '@morsebrowser/core';

const WORDFILES_DIR = `${FileSystem.documentDirectory ?? ''}wordfiles/`;
const PRESETS_DIR = `${FileSystem.documentDirectory ?? ''}presets/`;

function devServerOrigin(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.linkingUri;
  if (!hostUri) return null;
  try {
    const url = new URL(hostUri);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function resolveFetchUrl(filename: string): string {
  const origin = devServerOrigin();
  if (origin) return `${origin}${WORDFILES_BASE_PATH}/${filename}`;
  return `${WORDFILES_BASE_PATH}/${filename}`;
}

async function readBundledFile(filename: string): Promise<string | null> {
  const localPath = `${WORDFILES_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists) {
    return FileSystem.readAsStringAsync(localPath);
  }
  return null;
}

async function fetchOrRead(filename: string): Promise<Response> {
  const bundled = await readBundledFile(filename);
  if (bundled !== null) {
    return new Response(bundled);
  }

  const url = resolveFetchUrl(filename);
  try {
    const res = await fetch(url);
    if (res.ok) return res;
  } catch {
    /* fall through */
  }

  throw new Error(`Lesson file not found: ${filename}`);
}

/**
 * Marker value once a bundle copy has succeeded. Stamped with the app version
 * so an app update that ships refreshed wordfiles/presets re-copies the cache.
 * Any other value ('metro-only', a stale version) retries on the next launch,
 * so installing a build that finally bundles the data heals an older cache.
 */
function cacheStamp(): string {
  return `ok:${Constants.expoConfig?.version ?? 'dev'}`;
}

async function markerValue(marker: string): Promise<string | null> {
  const info = await FileSystem.getInfoAsync(marker);
  if (!info.exists) return null;
  try {
    return await FileSystem.readAsStringAsync(marker);
  } catch {
    return null;
  }
}

/** Copy assets/wordfiles into documentDirectory on first launch (release builds). */
export async function ensureWordfilesCached(): Promise<void> {
  const marker = `${WORDFILES_DIR}.ready`;
  if (await markerValue(marker) === cacheStamp()) return;

  // Bundled by the Xcode folder reference: <app bundle>/wordfiles/
  const bundleDir = FileSystem.bundleDirectory;
  const bundleWordfiles = bundleDir ? `${bundleDir}wordfiles/` : null;
  const bundleInfo = bundleWordfiles
    ? await FileSystem.getInfoAsync(bundleWordfiles)
    : null;

  if (!bundleWordfiles || !bundleInfo?.exists || !bundleInfo.isDirectory) {
    await FileSystem.makeDirectoryAsync(WORDFILES_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(marker, 'metro-only');
    return;
  }

  // Start clean: copyAsync throws on existing destinations, and a partial
  // cache from an interrupted earlier copy must not survive.
  await FileSystem.deleteAsync(WORDFILES_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(WORDFILES_DIR, { intermediates: true });

  const names = await FileSystem.readDirectoryAsync(bundleWordfiles);
  await Promise.all(
    names.map(name =>
      FileSystem.copyAsync({
        from: `${bundleWordfiles}${name}`,
        to: `${WORDFILES_DIR}${name}`,
      }),
    ),
  );
  await FileSystem.writeAsStringAsync(marker, cacheStamp());
}

async function copyDirRecursive(from: string, to: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(to, { intermediates: true });
  const names = await FileSystem.readDirectoryAsync(from);
  await Promise.all(names.map(async (name) => {
    const fromPath = `${from}${name}`;
    const info = await FileSystem.getInfoAsync(fromPath);
    if (info.isDirectory) {
      await copyDirRecursive(`${fromPath}/`, `${to}${name}/`);
    } else {
      await FileSystem.copyAsync({ from: fromPath, to: `${to}${name}` });
    }
  }));
}

/** Copy assets/presets into documentDirectory on first launch (release builds). */
export async function ensurePresetsCached(): Promise<void> {
  const marker = `${PRESETS_DIR}.ready`;
  if (await markerValue(marker) === cacheStamp()) return;

  const bundleDir = FileSystem.bundleDirectory;
  const bundlePresets = bundleDir ? `${bundleDir}presets/` : null;
  const bundleInfo = bundlePresets
    ? await FileSystem.getInfoAsync(bundlePresets)
    : null;

  if (!bundlePresets || !bundleInfo?.exists || !bundleInfo.isDirectory) {
    await FileSystem.makeDirectoryAsync(PRESETS_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(marker, 'metro-only');
    return;
  }

  await FileSystem.deleteAsync(PRESETS_DIR, { idempotent: true });
  await copyDirRecursive(bundlePresets, PRESETS_DIR);
  await FileSystem.writeAsStringAsync(marker, cacheStamp());
}

let presetFetchFallbackInstalled = false;

/**
 * Core's preset loader (`@morsebrowser/core` presetLoader.ts) calls the global
 * `fetch('/presets/...')` directly — relative URLs that Metro's dev server resolves
 * against the bundle origin, but which have nothing to resolve against in a release
 * build. This patches `fetch` once so `/presets/*` requests fall back to the bundled
 * copy cached by `ensurePresetsCached()` when the relative fetch fails (i.e. no Metro).
 */
export function installPresetFetchFallback(): void {
  if (presetFetchFallbackInstalled || Platform.OS === 'web') return;
  presetFetchFallbackInstalled = true;

  const originalFetch = globalThis.fetch.bind(globalThis);
  const prefix = `${PRESETS_BASE_PATH}/`;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (!url.startsWith(prefix)) {
      return originalFetch(input as RequestInfo, init);
    }

    try {
      const res = await originalFetch(input as RequestInfo, init);
      if (res.ok) return res;
    } catch {
      /* fall through to bundled copy */
    }

    const localPath = `${PRESETS_DIR}${url.slice(prefix.length)}`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      const text = await FileSystem.readAsStringAsync(localPath);
      return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('Not found', { status: 404 });
  }) as typeof fetch;
}

/** Mobile-aware loadLessonFile — same API as @morsebrowser/core. */
export async function loadMobileLessonFile(filename: string): Promise<LessonFileResult> {
  if (Platform.OS === 'web') {
    return loadLessonFile(filename);
  }

  const res = await fetchOrRead(filename);
  if (!res.ok) throw new Error(`Lesson file not found: ${filename}`);

  if (filename.endsWith('.json')) {
    const config = await res.json();
    return { type: 'random', config };
  }

  const content = await res.text();
  return { type: 'text', content };
}
