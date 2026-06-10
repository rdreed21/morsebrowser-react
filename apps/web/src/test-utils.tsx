import { render, type RenderOptions } from '@testing-library/react';
import { MorseAppProvider } from './context/MorseAppContext';
import { MorseAudioProvider } from './context/MorseAudioContext';
import { MorsePlaybackProvider } from './context/MorsePlaybackContext';
import { PlaybackStateProvider } from './context/PlaybackStateContext';

/**
 * Minimal state-only wrapper: MorseAppProvider requires
 * PlaybackStateProvider above it. Use this instead of a bare
 * <MorseAppProvider> in tests.
 */
export function StateProviders({ children }: { children: React.ReactNode }) {
  return (
    <PlaybackStateProvider>
      <MorseAppProvider>
        {children}
      </MorseAppProvider>
    </PlaybackStateProvider>
  );
}

export function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <PlaybackStateProvider>
      <MorseAppProvider>
        <MorseAudioProvider>
          <MorsePlaybackProvider>
            {children}
          </MorsePlaybackProvider>
        </MorseAudioProvider>
      </MorseAppProvider>
    </PlaybackStateProvider>
  );
}

export function renderWithMorseProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
