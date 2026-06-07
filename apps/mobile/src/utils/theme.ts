import { useMemo } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import { C } from './colors';

/** Semantic UI colors — light/dark palettes for cohesive theming. */
export interface Theme {
  bg: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  inputBg: string;
  inputText: string;
  inputDisabledBg: string;
  accent: string;
  accentMuted: string;
  lockActiveBg: string;
  headerBg: string;
  badgeBg: string;
  chipText: string;
  chipTextActive: string;
  chipBorder: string;
  danger: string;
  success: string;
  info: string;
  secondary: string;
}

const lightTheme: Theme = {
  bg:              C.bg,
  surface:           C.light,
  surfaceElevated:   C.inputBg,
  border:            C.border,
  text:              C.dark,
  textMuted:         C.textMuted,
  inputBg:           C.inputBg,
  inputText:         C.dark,
  inputDisabledBg:   '#e9ecef',
  accent:            C.primary,
  accentMuted:       C.primary,
  lockActiveBg:      '#cfe2ff',
  headerBg:          C.primary,
  badgeBg:           C.success,
  chipText:          C.primary,
  chipTextActive:    '#fff',
  chipBorder:        C.outlinePrimary,
  danger:            C.danger,
  success:           C.success,
  info:              C.info,
  secondary:         C.secondary,
};

const darkTheme: Theme = {
  bg:              C.bgDark,
  surface:         '#252540',
  surfaceElevated: '#2d2d48',
  border:          '#3d3d5c',
  text:            '#e9ecef',
  textMuted:       '#adb5bd',
  inputBg:         '#2d2d48',
  inputText:       '#e9ecef',
  inputDisabledBg: '#1f1f35',
  accent:          '#6ea8fe',
  accentMuted:     '#9ec5fe',
  lockActiveBg:    '#1a3a6b',
  headerBg:        '#1a3a6b',
  // Darker than the dark theme's `success` (#75b798) — that shade is tuned for
  // legibility against the dark background, but is too light for white badge text
  // to sit on top of with sufficient contrast.
  badgeBg:         '#1f6e49',
  chipText:        '#9ec5fe',
  chipTextActive:  '#fff',
  chipBorder:      '#6ea8fe',
  danger:          '#ea868f',
  success:         '#75b798',
  info:            '#6edff6',
  secondary:       '#5c636a',
};

export function getTheme(darkMode: boolean): Theme {
  return darkMode ? darkTheme : lightTheme;
}

export function useTheme(): Theme {
  const { darkMode } = useMorseApp();
  return useMemo(() => getTheme(darkMode), [darkMode]);
}
