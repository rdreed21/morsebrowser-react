import { describe, expect, it } from 'vitest';
import {
  applyLessonVoiceBaseline,
  buildLessonVoiceBaseline,
  computeNeedToSpeak,
  computeRacerRecapOn,
  shouldBlurSpeedRacerAction,
  shouldBypassManualVoiceForToggle,
  shouldShowManualVoiceRecapButton,
} from './voicePlayback';

describe('voicePlayback helpers', () => {
  it('builds and applies lesson voice baseline', () => {
    const baseline = buildLessonVoiceBaseline(true, true, true);
    let voice = false;
    let manual = false;
    let speakFirst = false;
    applyLessonVoiceBaseline(
      baseline,
      v => { voice = v; },
      v => { manual = v; },
      v => { speakFirst = v; },
    );
    expect(voice).toBe(true);
    expect(manual).toBe(true);
    expect(speakFirst).toBe(true);
  });

  it('blocks normal voice trail during Speed Racer', () => {
    expect(computeNeedToSpeak({
      voiceEnabled: true,
      fromVoiceOrTrail: false,
      hasMoreMorse: false,
      maxBufferReached: true,
      speakFirst: false,
      racerOn: true,
      speedRacerSpeakBeforeReplay: false,
    })).toBe(false);

    expect(computeNeedToSpeak({
      voiceEnabled: true,
      fromVoiceOrTrail: false,
      hasMoreMorse: false,
      maxBufferReached: true,
      speakFirst: false,
      racerOn: true,
      speedRacerSpeakBeforeReplay: true,
    })).toBe(false);
  });

  it('allows normal voice trail when Speed Racer is off', () => {
    expect(computeNeedToSpeak({
      voiceEnabled: true,
      fromVoiceOrTrail: false,
      hasMoreMorse: false,
      maxBufferReached: true,
      speakFirst: false,
      racerOn: false,
      speedRacerSpeakBeforeReplay: false,
    })).toBe(true);
  });

  it('gates Speed Racer recap on Speak + Voice', () => {
    expect(computeRacerRecapOn({
      racerOn: true,
      speedRacerSpeakBeforeReplay: true,
      voiceEnabled: true,
    })).toBe(true);
    expect(computeRacerRecapOn({
      racerOn: true,
      speedRacerSpeakBeforeReplay: false,
      voiceEnabled: true,
    })).toBe(false);
  });

  it('unlocks Voice master when SR + Speak override Arm Recap', () => {
    expect(shouldBypassManualVoiceForToggle(true, false, false)).toBe(false);
    expect(shouldBypassManualVoiceForToggle(true, true, true)).toBe(true);
    expect(shouldBypassManualVoiceForToggle(false, false, false)).toBe(true);
    expect(shouldBypassManualVoiceForToggle(false, false, false, false)).toBe(false);
  });

  it('hides Voice Recap button during SR + Speak', () => {
    expect(shouldShowManualVoiceRecapButton(true, true, true, true)).toBe(false);
    expect(shouldShowManualVoiceRecapButton(true, true, false, false)).toBe(true);
  });

  it('blurs SR action buttons only for pointer clicks', () => {
    expect(shouldBlurSpeedRacerAction({ detail: 1 })).toBe(true);
    expect(shouldBlurSpeedRacerAction({ detail: 0 })).toBe(false);
  });
});
