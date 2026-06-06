import { useEffect, useRef } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import type { MorsePlaybackHandlers } from './useMorsePlayback';

export function useMorseShortcutKeys(playback: MorsePlaybackHandlers): void {
  const app = useMorseApp();
  const appRef = useRef(app);
  appRef.current = app;

  const playbackRef = useRef(playback);
  playbackRef.current = playback;

  useEffect(() => {
    const onKeyPress = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const current = appRef.current;
      const {
        togglePlayback,
        handleStop,
        decrementIndex,
        incrementIndex,
        fullRewind,
        toggleLoop,
      } = playbackRef.current;

      const handlers: Record<string, () => void> = {
        p: () => togglePlayback(),
        s: () => handleStop(),
        ',': () => decrementIndex(),
        '<': () => fullRewind(),
        '.': () => incrementIndex(),
        f: () => {
          const word = current.words[current.currentIndex];
          if (word) {
            current.addFlaggedWord(word);
            current.announceAccessibility('Flagged');
          }
        },
        c: () => {
          const hiding = !current.hideList;
          current.setHideList(hiding);
          current.announceAccessibility(hiding ? 'Cards hidden' : 'Cards revealed');
        },
        '/': () => {
          const shuffling = !current.isShuffled;
          current.shuffleWords();
          current.announceAccessibility(shuffling ? 'Shuffled' : 'Unshuffled');
        },
        l: () => {
          const message = !current.loop
            ? 'Looping'
            : current.loopNoShuffle
              ? 'Not looping'
              : 'Looping';
          toggleLoop();
          current.announceAccessibility(message);
        },
        z: () => changeFarnsworth(current, -1),
        x: () => changeFarnsworth(current, 1),
      };

      const handler = handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    };

    document.addEventListener('keypress', onKeyPress);
    return () => document.removeEventListener('keypress', onKeyPress);
  }, []);
}

function changeFarnsworth(
  app: ReturnType<typeof useMorseApp>,
  delta: number,
): void {
  const newWpm = app.charWPM + delta;
  const newFwpm = app.effectiveWPM + delta;
  if (newWpm < 1 || newFwpm < 1) return;

  if (app.syncWpm) {
    app.setCharWPM(newWpm);
    app.announceAccessibility(`${newFwpm} FWPM`);
    return;
  }

  if (newFwpm > app.charWPM) {
    app.setCharWPM(newWpm);
  }
  app.setEffectiveWPM(newFwpm);
  app.announceAccessibility(`${newFwpm} FWPM`);
}
