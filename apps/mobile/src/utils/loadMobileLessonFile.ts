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
  WORDFILES_BASE_PATH,
  type LessonFileResult,
} from '@morsebrowser/core';

const WORDFILES_DIR = `${FileSystem.documentDirectory ?? ''}wordfiles/`;

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

/** Copy assets/wordfiles into documentDirectory on first launch (release builds). */
export async function ensureWordfilesCached(): Promise<void> {
  const marker = `${WORDFILES_DIR}.ready`;
  const markerInfo = await FileSystem.getInfoAsync(marker);
  if (markerInfo.exists) return;

  await FileSystem.makeDirectoryAsync(WORDFILES_DIR, { intermediates: true });

  // Bundled assets are copied at build time into the app bundle under wordfiles/
  const bundleDir = FileSystem.bundleDirectory;
  if (!bundleDir) return;

  const bundleWordfiles = `${bundleDir}wordfiles/`;
  const bundleInfo = await FileSystem.getInfoAsync(bundleWordfiles);
  if (!bundleInfo.exists || !bundleInfo.isDirectory) {
    await FileSystem.writeAsStringAsync(marker, 'metro-only');
    return;
  }

  const names = await FileSystem.readDirectoryAsync(bundleWordfiles);
  await Promise.all(
    names.map(name =>
      FileSystem.copyAsync({
        from: `${bundleWordfiles}${name}`,
        to: `${WORDFILES_DIR}${name}`,
      }),
    ),
  );
  await FileSystem.writeAsStringAsync(marker, 'ok');
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
