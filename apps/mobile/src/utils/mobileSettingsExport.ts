import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  buildExportedSettings,
  parseImportedSettingsFile,
  type MorseSettingsSnapshot,
} from '@morsebrowser/core';

export async function shareSettingsFile(snapshot: MorseSettingsSnapshot): Promise<void> {
  const payload = buildExportedSettings(snapshot);
  const path = `${FileSystem.cacheDirectory ?? ''}LICWSettings.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, '\t'));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json' });
  }
}

export async function pickAndParseSettingsFile(): Promise<ReturnType<typeof parseImportedSettingsFile> | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
  return parseImportedSettingsFile(text);
}
