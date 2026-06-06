import { StatusBar } from 'expo-status-bar';
import { useMorseApp } from '../context/MorseAppContext';

export function ThemedStatusBar() {
  const { darkMode } = useMorseApp();
  return <StatusBar style={darkMode ? 'light' : 'dark'} />;
}
