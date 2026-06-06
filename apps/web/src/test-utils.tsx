import { render, type RenderOptions } from '@testing-library/react';
import { MorseAppProvider } from './context/MorseAppContext';
import { MorseAudioProvider } from './context/MorseAudioContext';
import { MorsePlaybackProvider } from './context/MorsePlaybackContext';

export function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MorseAppProvider>
      <MorseAudioProvider>
        <MorsePlaybackProvider>
          {children}
        </MorsePlaybackProvider>
      </MorseAudioProvider>
    </MorseAppProvider>
  );
}

export function renderWithMorseProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
