/** Pure helpers mirrored from useMorsePlayback — unit-testable without AudioContext. */

export function isVoiceBufferFull(
  voiceBufferMaxLength: number,
  currentIndex: number,
  wordCount: number,
  bufferLength: number,
): boolean {
  if (voiceBufferMaxLength === 1) return true;
  if (currentIndex >= wordCount - 1) return true;
  return bufferLength >= voiceBufferMaxLength;
}

export function computePlayEndedActions(flags: {
  voiceEnabled: boolean;
  manualVoice: boolean;
  fromVoiceOrTrail: boolean;
  hasMoreMorse: boolean;
  maxBufferReached: boolean;
  speakFirst: boolean;
  trailReveal: boolean;
}) {
  const needToSpeak = flags.voiceEnabled
    && !flags.fromVoiceOrTrail
    && !flags.hasMoreMorse
    && flags.maxBufferReached
    && !flags.speakFirst;
  const needToTrail = flags.trailReveal && !flags.fromVoiceOrTrail;
  return {
    needToSpeak,
    needToTrail,
    speakAndTrail: needToSpeak && needToTrail,
    noDelays: !needToSpeak && !needToTrail,
  };
}

export function shouldRestartLoop(
  loop: boolean,
  fromStopButton: boolean,
  fromPauseButton: boolean,
  skipLoopRestart?: boolean,
): boolean {
  return loop && !fromStopButton && !fromPauseButton && !skipLoopRestart;
}
