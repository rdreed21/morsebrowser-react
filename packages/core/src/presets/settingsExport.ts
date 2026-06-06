import type { MorseSettingsSnapshot } from './settingsApplier';
import { snapshotToSerialized } from './settingsApplier';

export interface ExportedSettingsFile {
  morseSettings: ReturnType<typeof snapshotToSerialized>;
}

export function buildExportedSettings(snapshot: MorseSettingsSnapshot): ExportedSettingsFile {
  return { morseSettings: snapshotToSerialized(snapshot) };
}

export function downloadSettingsFile(snapshot: MorseSettingsSnapshot, filename = 'LICWSettings.json'): void {
  const payload = buildExportedSettings(snapshot);
  const anchor = document.createElement('a');
  anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, '\t'))}`;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function parseImportedSettingsFile(text: string): ExportedSettingsFile {
  const parsed = JSON.parse(text) as ExportedSettingsFile;
  if (!parsed?.morseSettings || !Array.isArray(parsed.morseSettings)) {
    throw new Error('Invalid settings file');
  }
  return parsed;
}
