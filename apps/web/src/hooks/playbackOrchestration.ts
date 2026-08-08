/** Pure helpers mirrored from useMorsePlayback — unit-testable without AudioContext. */

import { computeNeedToSpeak } from '../utils/voicePlayback';

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
  racerOn?: boolean;
  speedRacerSpeakBeforeReplay?: boolean;
}) {
  const needToSpeak = computeNeedToSpeak({
    voiceEnabled: flags.voiceEnabled,
    fromVoiceOrTrail: flags.fromVoiceOrTrail,
    hasMoreMorse: flags.hasMoreMorse,
    maxBufferReached: flags.maxBufferReached,
    speakFirst: flags.speakFirst,
    racerOn: flags.racerOn ?? false,
    speedRacerSpeakBeforeReplay: flags.speedRacerSpeakBeforeReplay ?? false,
  });
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
