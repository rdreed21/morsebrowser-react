/** Pure Speed Racer / Voice helpers ported from KO `voicePlayback.ts`. */

export type LessonVoiceBaseline = {
  voiceEnabled: boolean;
  manualVoice: boolean;
  speakFirst: boolean;
};

/** Snapshot voice + Arm Recap + Voice First from the active lesson preset. */
export function buildLessonVoiceBaseline(
  voiceEnabled: boolean,
  manualVoice: boolean,
  speakFirst: boolean,
): LessonVoiceBaseline {
  return { voiceEnabled, manualVoice, speakFirst };
}

export function applyLessonVoiceBaseline(
  baseline: LessonVoiceBaseline,
  setVoiceEnabled: (value: boolean) => void,
  setManualVoice: (value: boolean) => void,
  setSpeakFirst: (value: boolean) => void,
): void {
  setVoiceEnabled(baseline.voiceEnabled);
  setManualVoice(baseline.manualVoice);
  setSpeakFirst(baseline.speakFirst);
}

export type NeedToSpeakInput = {
  voiceEnabled: boolean;
  fromVoiceOrTrail: boolean;
  hasMoreMorse: boolean;
  maxBufferReached: boolean;
  speakFirst: boolean;
  racerOn: boolean;
  speedRacerSpeakBeforeReplay: boolean;
};

export function computeNeedToSpeak(input: NeedToSpeakInput): boolean {
  if (!input.voiceEnabled
      || input.fromVoiceOrTrail
      || input.hasMoreMorse
      || !input.maxBufferReached
      || input.speakFirst) {
    return false;
  }
  // Speed Racer owns speech (or is morse-only); never use the normal voice trail.
  if (input.racerOn) {
    return false;
  }
  return true;
}

export type RacerRecapOnInput = {
  racerOn: boolean;
  speedRacerSpeakBeforeReplay: boolean;
  voiceEnabled: boolean;
};

export function computeRacerRecapOn(input: RacerRecapOnInput): boolean {
  return input.racerOn
    && input.speedRacerSpeakBeforeReplay
    && input.voiceEnabled;
}

/** Arm Recap presets lock the Voice toggle; SR + Speak restores user control. */
export function shouldBypassManualVoiceForToggle(
  manualVoice: boolean,
  racerOn: boolean,
  speedRacerSpeakBeforeReplay: boolean,
  voiceCapable = true,
): boolean {
  return voiceCapable
    && (!manualVoice || (racerOn && speedRacerSpeakBeforeReplay));
}

/** Hide manual Voice Recap while Speed Racer + Speak own automatic recap. */
export function shouldShowManualVoiceRecapButton(
  manualVoice: boolean,
  voiceEnabled: boolean,
  racerOn: boolean,
  speedRacerSpeakBeforeReplay: boolean,
): boolean {
  return manualVoice
    && voiceEnabled
    && !(racerOn && speedRacerSpeakBeforeReplay);
}

/** Blur Reset/Overlearn action buttons only for pointer clicks (keep keyboard focus). */
export function shouldBlurSpeedRacerAction(event: { detail?: number }): boolean {
  return typeof event.detail === 'number' && event.detail > 0;
}
