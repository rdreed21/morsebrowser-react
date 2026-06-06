import classPresets from './data/config.json';
import legacyMixin from './data/legacymixin/legacymixin.json';
import presetOverrides from './data/overrides/presetoverrides.json';
import type {
  ClassPresetsConfig,
  LegacyMixinConfig,
  PresetConfigFile,
  PresetOverridesConfig,
  PresetSetFile,
  SerializedSetting,
  SettingsOption,
} from './types';
import { YOUR_SETTINGS_PRESET } from './types';

export const PRESETS_BASE_PATH = '/presets';

const CLASS_PRESETS = classPresets as ClassPresetsConfig;
const LEGACY_MIXIN = legacyMixin as LegacyMixinConfig;
const PRESET_OVERRIDES = presetOverrides as PresetOverridesConfig;

function presetUrl(...parts: string[]): string {
  return `${PRESETS_BASE_PATH}/${parts.join('/')}`;
}

export async function loadPresetSetFile(setFile: string): Promise<PresetSetFile | null> {
  const res = await fetch(presetUrl('sets', setFile));
  if (!res.ok) return null;
  return res.json() as Promise<PresetSetFile>;
}

export async function loadPresetConfigFile(filename: string): Promise<PresetConfigFile | null> {
  const res = await fetch(presetUrl('configs', filename));
  if (!res.ok) return null;
  return res.json() as Promise<PresetConfigFile>;
}

export function resolvePresetSetFile(className: string, letterGroup: string): string | null {
  if (!className) return null;
  const targetClass = CLASS_PRESETS.classes.find(c => c.className === className);
  if (!targetClass) return null;

  const letterGroups = targetClass.letterGroups;
  if (letterGroups && letterGroups.length > 0 && letterGroup) {
    const match = letterGroups.find(l => l.letterGroup === letterGroup);
    if (match?.setFile) return match.setFile;
  }

  return targetClass.defaultSetFile || null;
}

export function buildPresetOptions(
  setOptions: Array<{ display: string; filename: string }> = [],
  customOptions: SettingsOption[] = [],
): SettingsOption[] {
  return [
    YOUR_SETTINGS_PRESET,
    ...customOptions,
    ...setOptions.map(o => ({ display: o.display, filename: o.filename })),
  ];
}

export async function fetchSettingsPresetsForLesson(
  className: string,
  letterGroup: string,
  customOptions: SettingsOption[] = [],
): Promise<SettingsOption[]> {
  const base = [YOUR_SETTINGS_PRESET, ...customOptions];
  const setFile = resolvePresetSetFile(className, letterGroup);
  if (!setFile) return base;

  const setData = await loadPresetSetFile(setFile);
  if (!setData?.options) return base;
  return buildPresetOptions(setData.options, customOptions);
}

export function mergeLegacyMixin(settings: SerializedSetting[]): SerializedSetting[] {
  const merged = settings.map(s => ({ ...s }));
  const existing = new Set(merged.map(s => s.key));
  for (const entry of LEGACY_MIXIN.morseSettings) {
    if (!existing.has(entry.key)) {
      merged.push({ ...entry });
    }
  }
  return merged;
}

export function applyPresetOverrides(
  settings: SerializedSetting[],
  letterGroup: string,
  fileName: string | undefined,
): { settings: SerializedSetting[]; overridden: boolean } {
  const merged = settings.map(s => ({ ...s }));
  let overridden = false;

  for (const override of PRESET_OVERRIDES.overrides) {
    const letterMatch = override.filters.letterGroup.some(s => s === letterGroup);
    const fileMatch = fileName
      ? override.filters.fileName.some(s => s === fileName)
      : false;

    if (letterMatch || fileMatch) {
      overridden = true;
      for (const field of override.settings) {
        const target = merged.find(s => s.key === field.name);
        if (target) {
          target.value = field.value;
        } else {
          merged.push({ key: field.name, value: field.value });
        }
      }
    }
  }

  return { settings: merged, overridden };
}

export function filterPresetSettings(
  settings: SerializedSetting[],
  keyBlacklist: readonly string[] = [],
): SerializedSetting[] {
  const blacklist = new Set(keyBlacklist);
  return settings.filter(s => s.key !== 'showRaw' && !blacklist.has(s.key));
}

export interface ResolvedPresetSettings {
  settings: SerializedSetting[];
  overridden: boolean;
}

export async function resolvePresetSettings(
  preset: SettingsOption,
  letterGroup: string,
  fileName: string | undefined,
  savedYourSettings: SerializedSetting[] | null,
  keyBlacklist: readonly string[] = [],
): Promise<ResolvedPresetSettings | null> {
  let raw: SerializedSetting[] | null = null;

  if (preset.isDummy) {
    raw = savedYourSettings ? [...savedYourSettings] : null;
  } else if (preset.isCustom && preset.morseSettings) {
    raw = [...preset.morseSettings];
  } else {
    const config = await loadPresetConfigFile(preset.filename);
    raw = config?.morseSettings ? [...config.morseSettings] : null;
  }

  if (!raw) return null;

  const filtered = filterPresetSettings(raw, keyBlacklist);
  const withMixin = mergeLegacyMixin(filtered);
  const { settings, overridden } = applyPresetOverrides(withMixin, letterGroup, fileName);
  return { settings, overridden };
}
