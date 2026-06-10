import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScheduleOptions } from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { usePlaybackState } from '../context/PlaybackStateContext';
import { CardBufferManager } from '../utils/cardBufferManager';
import { getDisplayWord } from '../utils/words';
import { getSpeakText, prepPhraseToSpeakForFinal } from '../utils/speakText';
import {
  cancelSpeech, primeSpeechPump, resolveSpeechVoice, speakPhrase,
} from '../utils/voiceSpeech';
import { useMorseAudio } from '../context/MorseAudioContext';
import {
  computePlayEndedActions,
  isVoiceBufferFull,
  shouldRestartLoop,
} from './playbackOrchestration';

type TimerKey =
  | 'doPlay'
  | 'cardSpace'
  | 'trailPre'
  | 'trailPost'
  | 'trailFinal'
  | 'voiceThink'
  | 'voiceRecap';

interface VoiceBufferEntry {
  txt: string;
  idx: number;
}

export interface MorsePlaybackHandlers {
  handlePlay: () => void;
  handlePause: () => void;
  handleStop: () => void;
  togglePlayback: () => void;
  toggleLoop: () => void;
  incrementIndex: () => void;
  decrementIndex: () => void;
  fullRewind: () => void;
  setWordIndex: (index: number) => void;
  lastFullPlayTimeMs: number;
  playPracticeFromText: (text: string) => void;
  speakVoiceBuffer: () => void;
}

export function useMorsePlayback(): MorsePlaybackHandlers {
  const app = useMorseApp();
  // Playback runtime state — setters are referentially stable; the two read
  // values keep this hook re-rendering per tick, which the indexRef mirror
  // below relies on.
  const {
    currentIndex, isPaused,
    setCurrentIndex, setIsPlaying, setIsPaused,
    setRunningPlayMs, setCharsPlayed, setMaxRevealedTrail,
  } = usePlaybackState();
  const { play, stopMorse, stopAll, ensureNoise } = useMorseAudio();

  const playingRef = useRef(false);
  const preSpaceUsedRef = useRef(false);
  const lastPartialStartRef = useRef(0);
  const indexRef = useRef(currentIndex);
  const timersRef = useRef<Partial<Record<TimerKey, ReturnType<typeof setTimeout>>>>({});
  const bufferRef = useRef<CardBufferManager | null>(null);
  const voiceBufferRef = useRef<VoiceBufferEntry[]>([]);
  const speakFirstLastCardIndexRef = useRef(-1);
  const lastFullPlayTimeMsRef = useRef(0);
  const [lastFullPlayTimeMs, setLastFullPlayTimeMs] = useState(0);

  indexRef.current = currentIndex;

  const clearTimers = useCallback(() => {
    Object.values(timersRef.current).forEach(t => { if (t) clearTimeout(t); });
    timersRef.current = {};
  }, []);

  // Read words lazily through a ref so the CardBufferManager is created once
  // (like KO's single instance) — recreating it on every words change dropped
  // repeat/position state when text or settings changed mid-playback.
  const wordsRef = useRef(app.words);
  wordsRef.current = app.words;

  const getDisplayWords = useCallback(
    () => wordsRef.current.map(w => getDisplayWord(w)),
    [],
  );

  if (!bufferRef.current) {
    bufferRef.current = new CardBufferManager(
      () => indexRef.current,
      getDisplayWords,
    );
  }

  const scheduleOpts = useCallback((
    playJustEnded: boolean,
    trimLastWordSpace: boolean,
  ): ScheduleOptions => {
    const prePaddingSeconds = preSpaceUsedRef.current ? 0 : app.preSpace;
    const extraTrailingDitUnits = Math.max(0, (app.xtraWordSpaceDits - 1) * 7);
    const startDelay = (!preSpaceUsedRef.current && !playJustEnded) ? 0.05 : 0;
    return { prePaddingSeconds, extraTrailingDitUnits, trimLastWordSpace, startDelay };
  }, [app.preSpace, app.xtraWordSpaceDits]);

  const resolveVoice = useCallback(
    () => resolveSpeechVoice(app.voiceVoices, app.voiceVoiceIdx),
    [app.voiceVoices, app.voiceVoiceIdx],
  );

  const buildSpeakConfig = useCallback((text: string) => ({
    text: prepPhraseToSpeakForFinal(text),
    volume: app.voiceVolume / 10,
    rate: app.voiceRate,
    pitch: app.voicePitch,
    voice: resolveVoice(),
    afterThinkingTimeSec: app.voiceAfterThinkingTime,
    spellMode: app.voiceSpelling,
    interTokenPauseMs: 150,
  }), [
    app.voiceVolume, app.voiceRate, app.voicePitch, app.voiceAfterThinkingTime,
    app.voiceSpelling, resolveVoice,
  ]);

  const addToVoiceBuffer = useCallback(() => {
    const idx = indexRef.current;
    const lastBufIndex = voiceBufferRef.current.length > 0
      ? voiceBufferRef.current[voiceBufferRef.current.length - 1].idx
      : -1;
    if (idx > lastBufIndex && idx >= voiceBufferRef.current.length) {
      const raw = app.words[idx];
      if (raw) {
        voiceBufferRef.current.push({
          txt: getSpeakText(raw, app.voiceSpelling),
          idx,
        });
      }
    }
  }, [app.words, app.voiceSpelling]);

  const ifMaxVoiceBufferReached = useCallback((): boolean => (
    isVoiceBufferFull(
      app.voiceBufferMaxLength,
      indexRef.current,
      app.words.length,
      voiceBufferRef.current.length,
    )
  ), [app.voiceBufferMaxLength, app.words.length]);

  const getPhraseToSpeakFromBuffer = useCallback((): string => {
    const phrase = voiceBufferRef.current.map(m => m.txt).join(' ')
      .replace(/[\r\n]/g, ' ')
      .trim();
    voiceBufferRef.current = [];
    return phrase;
  }, []);

  const endSession = useCallback((
    fullRewind: boolean,
    fromPauseButton: boolean,
    fromStopButton: boolean,
    opts?: { skipLoopRestart?: boolean },
  ) => {
    playingRef.current = false;
    clearTimers();
    cancelSpeech();
    stopAll();
    setIsPlaying(false);

    if (fromPauseButton) {
      setRunningPlayMs(ms => ms + (Date.now() - lastPartialStartRef.current));
      setIsPaused(p => !p);
    } else {
      setIsPaused(false);
    }

    if (fullRewind) {
      setCurrentIndex(0);
    }
    if (fromStopButton) {
      setMaxRevealedTrail(-1);
      voiceBufferRef.current = [];
      speakFirstLastCardIndexRef.current = -1;
    }

    if (shouldRestartLoop(app.loop, fromStopButton, fromPauseButton, opts?.skipLoopRestart)) {
      if (!app.loopNoShuffle) {
        app.shuffleWords(true);
      }
      setCurrentIndex(0);
      bufferRef.current?.clear();
      voiceBufferRef.current = [];
      preSpaceUsedRef.current = false;
      speakFirstLastCardIndexRef.current = -1;
      doPlayRef.current(false, false);
    }
  }, [
    app, clearTimers, stopAll, setIsPlaying, setIsPaused,
    setRunningPlayMs, setCurrentIndex, setMaxRevealedTrail,
  ]);

  const playMorseChunk = useCallback((playJustEnded: boolean) => {
    if (app.morseDisabled) {
      lastPartialStartRef.current = Date.now();
      playEndedRef.current(false);
      return;
    }

    const repeats = app.numberOfRepeats === 0 ? 0 : app.numberOfRepeats + 1;
    const morseText = bufferRef.current?.getNextMorse(
      repeats,
      app.speakFirstAdditionalWordspaces,
    ) ?? '';

    // KO: trim trailing word space only when voice will speak after this chunk
    // (not manual recap, and voice buffer is full).
    const trimLastWordSpace = app.voiceEnabled
      && !app.manualVoice
      && ifMaxVoiceBufferReached()
      && !(bufferRef.current?.hasMoreMorse() ?? false);

    lastPartialStartRef.current = Date.now();
    const opts = scheduleOpts(playJustEnded, trimLastWordSpace);

    play(morseText, {
      ...opts,
      onComplete: () => playEndedRef.current(false),
    });
    preSpaceUsedRef.current = true;
    setCharsPlayed(c => c + morseText.replace(/\s/g, '').length);
  }, [app, play, scheduleOpts, ifMaxVoiceBufferReached, setCharsPlayed]);

  const playEndedRef = useRef<(fromVoiceOrTrail: boolean) => void>(() => {});

  playEndedRef.current = (fromVoiceOrTrail: boolean) => {
    if (!playingRef.current) return;

    const idx = indexRef.current;
    const isNotLastWord = idx < app.words.length - 1;
    const anyNewLines = app.showingText.indexOf('\n') !== -1;
    const hasMoreMorse = bufferRef.current?.hasMoreMorse() ?? false;
    const maxBufferReached = ifMaxVoiceBufferReached();
    const {
      needToSpeak, needToTrail, speakAndTrail, noDelays,
    } = computePlayEndedActions({
      voiceEnabled: app.voiceEnabled,
      manualVoice: app.manualVoice,
      fromVoiceOrTrail,
      hasMoreMorse,
      maxBufferReached,
      speakFirst: app.speakFirst,
      trailReveal: app.trailReveal,
    });

    const advanceTrail = () => {
      if (!app.trailReveal) return;
      timersRef.current.trailPre = setTimeout(() => {
        setMaxRevealedTrail(v => v + 1);
        timersRef.current.trailPost = setTimeout(() => {
          if (!speakAndTrail) {
            playEndedRef.current(true);
          }
        }, speakAndTrail ? 0 : app.trailPostDelay * 1000);
      }, speakAndTrail ? 0 : app.trailPreDelay * 1000);
    };

    const finalizeTrail = (finalCallback: () => void) => {
      if (app.trailReveal) {
        timersRef.current.trailFinal = setTimeout(() => {
          setMaxRevealedTrail(-1);
          finalCallback();
        }, app.trailFinal * 1000);
      } else {
        finalCallback();
      }
    };

    if (noDelays) {
      setRunningPlayMs(ms => ms + (Date.now() - lastPartialStartRef.current));
      if (isNotLastWord || hasMoreMorse) {
        let cardChanged = false;
        if (!hasMoreMorse) {
          if (app.speakFirst) {
            voiceBufferRef.current = [];
          }
          setCurrentIndex(idx + 1);
          cardChanged = true;
        }
        const cardDelayMs = (!cardChanged && hasMoreMorse) ? 0 : app.cardSpace * 1000;
        timersRef.current.cardSpace = setTimeout(() => {
          doPlayRef.current(true, false);
        }, cardDelayMs);
      } else {
        const finalToDo = () => {
          lastFullPlayTimeMsRef.current = Date.now();
          setLastFullPlayTimeMs(lastFullPlayTimeMsRef.current);
          endSession(true, false, false);
        };
        finalizeTrail(finalToDo);
      }
    }

    if (needToSpeak) {
      const speakText = voiceBufferRef.current[0]?.txt ?? '';
      const hasNewline = speakText.indexOf('\n') !== -1;
      const speakCondition = !app.manualVoice
        && (hasNewline
          || !isNotLastWord
          || !anyNewLines
          || !app.newlineChunking);

      if (speakCondition) {
        let phraseToSpeak = getPhraseToSpeakFromBuffer();
        if (app.voiceLastOnly) {
          const pieces = phraseToSpeak.split(' ');
          phraseToSpeak = pieces[pieces.length - 1] ?? phraseToSpeak;
        }

        timersRef.current.voiceThink = setTimeout(() => {
          if (!playingRef.current) return;
          speakPhrase(buildSpeakConfig(phraseToSpeak), () => {
            if (!playingRef.current) return;
            if (needToTrail) {
              advanceTrail();
            }
            playEndedRef.current(true);
          });
        }, app.voiceThinkingTime * 1000);
      } else {
        playEndedRef.current(true);
      }
    }

    if (needToTrail && !speakAndTrail) {
      advanceTrail();
    }
  };

  const doPlayRef = useRef<(playJustEnded: boolean, fromPlayButton: boolean) => void>(() => {});

  doPlayRef.current = (playJustEnded: boolean, fromPlayButton: boolean) => {
    if (!app.showingText.trim() || app.words.length === 0) return;

    const wasPlaying = playingRef.current;
    const freshStart = fromPlayButton && !wasPlaying;

      if (freshStart) {
      app.collapseSettingsAccordions();
      setRunningPlayMs(0);
      bufferRef.current?.clear();
      voiceBufferRef.current = [];
      setCharsPlayed(0);
      preSpaceUsedRef.current = false;
      speakFirstLastCardIndexRef.current = -1;
      ensureNoise();
      if (app.voiceCapable) {
        primeSpeechPump(resolveVoice());
      }
    }

    if (!playJustEnded) {
      preSpaceUsedRef.current = false;
    }

    setIsPaused(false);
    setIsPlaying(true);
    playingRef.current = true;

    const delayMs = (playJustEnded || fromPlayButton) ? 0 : 1000;
    if (timersRef.current.doPlay) clearTimeout(timersRef.current.doPlay);

    timersRef.current.doPlay = setTimeout(() => {
      if (!playingRef.current) return;

      stopMorse();
      ensureNoise();
      setMaxRevealedTrail(indexRef.current - 1);
      addToVoiceBuffer();

      const runMorse = () => playMorseChunk(playJustEnded);

      const shouldSpeakFirst = app.speakFirst
        && app.voiceEnabled
        && speakFirstLastCardIndexRef.current !== indexRef.current;

      if (shouldSpeakFirst) {
        let phrase = voiceBufferRef.current.map(m => m.txt).join(' ').trim();
        if (app.voiceLastOnly) {
          const pieces = phrase.split(' ');
          phrase = pieces[pieces.length - 1] ?? phrase;
        }
        timersRef.current.voiceThink = setTimeout(() => {
          if (!playingRef.current) return;
          speakPhrase(buildSpeakConfig(phrase), () => {
            if (!playingRef.current) return;
            speakFirstLastCardIndexRef.current = indexRef.current;
            runMorse();
          });
        }, app.voiceThinkingTime * 1000);
      } else {
        runMorse();
      }
    }, delayMs);
  };

  const handlePlay = useCallback(() => {
    if (!app.showingText.trim()) return;
    ensureNoise();
    doPlayRef.current(false, true);
  }, [app.showingText, ensureNoise]);

  const handlePause = useCallback(() => {
    if (isPaused) {
      // KO resumes with doPlay(true, false): NOT a fresh start, so the
      // accumulated runningPlayMs, card/voice buffers and prespace survive.
      ensureNoise();
      doPlayRef.current(true, false);
      return;
    }
    endSession(false, true, false);
  }, [isPaused, endSession, ensureNoise]);

  const handleStop = useCallback(() => {
    endSession(true, false, true);
  }, [endSession]);

  const togglePlayback = useCallback(() => {
    if (playingRef.current) {
      endSession(false, true, false);
    } else {
      // KO togglePlayback resumes with doPlay(true, false) — see handlePause.
      ensureNoise();
      doPlayRef.current(true, false);
    }
  }, [endSession, ensureNoise]);

  const toggleLoop = useCallback(() => {
    app.toggleLoop();
  }, [app]);

  const incrementIndex = useCallback(() => {
    if (currentIndex < app.words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [app, currentIndex, setCurrentIndex]);

  const decrementIndex = useCallback(() => {
    if (currentIndex > 0 && app.words.length > 1) {
      stopMorse();
      ensureNoise();
      setCurrentIndex(currentIndex - 1);
      timersRef.current.doPlay = setTimeout(() => {
        doPlayRef.current(false, false);
      }, 1000);
    }
  }, [app, currentIndex, setCurrentIndex, stopMorse, ensureNoise]);

  const fullRewind = useCallback(() => {
    setCurrentIndex(0);
  }, [setCurrentIndex]);

  const setWordIndex = useCallback((index: number) => {
    if (!playingRef.current) {
      setCurrentIndex(index);
      return;
    }
    endSession(false, false, false, { skipLoopRestart: true });
    setCurrentIndex(index);
    doPlayRef.current(false, false);
  }, [setCurrentIndex, endSession]);

  const playPracticeFromText = useCallback((text: string) => {
    app.setShowingText(text);
    setCurrentIndex(0);
    doPlayRef.current(false, true);
  }, [app, setCurrentIndex]);

  const speakVoiceBufferRef = useRef<() => void>(() => {});

  speakVoiceBufferRef.current = () => {
    if (voiceBufferRef.current.length === 0) return;
    const entry = voiceBufferRef.current.shift();
    if (!entry) return;

    const phrase = prepPhraseToSpeakForFinal(entry.txt.replace(/\|/g, ' '));
    speakPhrase(buildSpeakConfig(phrase), () => {
      timersRef.current.voiceRecap = setTimeout(() => {
        speakVoiceBufferRef.current();
      }, 250);
    });
  };

  const speakVoiceBuffer = useCallback(() => {
    speakVoiceBufferRef.current();
  }, []);

  useEffect(() => () => {
    clearTimers();
    cancelSpeech();
    stopAll();
  }, [clearTimers, stopAll]);

  return {
    handlePlay,
    handlePause,
    handleStop,
    togglePlayback,
    toggleLoop,
    incrementIndex,
    decrementIndex,
    fullRewind,
    setWordIndex,
    lastFullPlayTimeMs,
    playPracticeFromText,
    speakVoiceBuffer,
  };
}
