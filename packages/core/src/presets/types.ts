/** KO SavedSettingsInfo / preset JSON entry */
export interface SerializedSetting {
  key: string;
  value: unknown;
  comment?: string | null;
}

/** KO SettingsOption */
export interface SettingsOption {
  display: string;
  filename: string;
  isDummy?: boolean;
  isCustom?: boolean;
  morseSettings?: SerializedSetting[];
}

export interface PresetSetFile {
  options: Array<{ display: string; filename: string }>;
}

export interface PresetConfigFile {
  morseSettings: SerializedSetting[];
}

export interface ClassPresetEntry {
  className: string;
  defaultSetFile: string;
  letterGroups?: Array<{ letterGroup: string; setFile: string }>;
}

export interface ClassPresetsConfig {
  classes: ClassPresetEntry[];
}

export interface PresetOverrideFilter {
  letterGroup: string[];
  fileName: string[];
}

export interface PresetOverride {
  settings: Array<{ name: string; value: unknown }>;
  filters: PresetOverrideFilter;
}

export interface PresetOverridesConfig {
  overrides: PresetOverride[];
}

export interface LegacyMixinConfig {
  morseSettings: SerializedSetting[];
}

export const YOUR_SETTINGS_PRESET: SettingsOption = {
  display: 'Your Settings',
  filename: 'dummy.json',
  isDummy: true,
};

// KO only blacklists cardFontPx and preSpace (morseSettingsHandler.ts) —
// volume/voiceVolume ARE applied there, so they aren't blocked here either.
// The frequency keys never appear in KO settings files; kept as a safeguard.
export const DEFAULT_PRESET_KEY_BLACKLIST = [
  'ditFrequency',
  'dahFrequency',
  'syncFreq',
  'cardFontPx',
  'preSpace',
] as const;
