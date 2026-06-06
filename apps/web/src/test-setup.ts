import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('./context/MorseAudioContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./context/MorseAudioContext')>();
  return {
    ...actual,
    MorseAudioProvider: ({ children }: { children: React.ReactNode }) => children,
    useMorseAudio: () => ({
      play: vi.fn((_text: string, opts?: { onComplete?: () => void }) => {
        opts?.onComplete?.();
      }),
      stopMorse: vi.fn(),
      stopAll: vi.fn(),
      ensureNoise: vi.fn(),
      playTestTone: vi.fn(),
      getCtx: vi.fn(),
    }),
  };
});

beforeEach(() => {
  document.cookie.split(';').forEach(c => {
    const name = c.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
  });
});
