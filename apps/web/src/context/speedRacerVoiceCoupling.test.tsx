import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StateProviders } from '../test-utils';
import { useMorseApp } from './MorseAppContext';
import { SETTINGS_ACCORDION_IDS } from '../utils/settingsAccordion';

function clearCookies() {
  document.cookie.split(';').forEach(c => {
    const key = c.split('=')[0]?.trim();
    if (key) document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

function stubVoiceCapable() {
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [],
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal('SpeechSynthesisUtterance', class {
    text = '';
    volume = 1;
    rate = 1;
    pitch = 1;
    voice = null;
    lang = '';
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
  });
}

function SpeedRacerVoiceHarness() {
  const app = useMorseApp();
  return (
    <>
      <button type="button" onClick={() => app.setManualVoice(true)}>armRecap</button>
      <button type="button" onClick={() => app.setVoiceEnabled(false)}>voiceOff</button>
      <button type="button" onClick={() => app.setVoiceEnabled(true)}>voiceOn</button>
      <button type="button" onClick={() => app.setSpeakFirst(true)}>speakFirstOn</button>
      <button type="button" onClick={() => app.captureLessonVoiceBaseline()}>captureBaseline</button>
      <button type="button" onClick={() => app.setSpeedRacerEnabled(true)}>srOn</button>
      <button type="button" onClick={() => app.setSpeedRacerEnabled(false)}>srOff</button>
      <button type="button" onClick={() => app.setSpeedRacerSpeakBeforeReplay(true)}>speakOn</button>
      <button type="button" onClick={() => app.setSpeedRacerSpeakBeforeReplay(false)}>speakOff</button>
      <button type="button" onClick={() => app.resetSpeedRacerDefaults()}>resetDefaults</button>
      <button type="button" onClick={() => app.applyOverlearnSpeedRacer()}>overlearn</button>
      <span data-testid="voiceEnabled">{String(app.voiceEnabled)}</span>
      <span data-testid="manualVoice">{String(app.manualVoice)}</span>
      <span data-testid="speakFirst">{String(app.speakFirst)}</span>
      <span data-testid="srSpeak">{String(app.speedRacerSpeakBeforeReplay)}</span>
      <span data-testid="srFinal">{String(app.speedRacerFinalPlay)}</span>
      <span data-testid="srOverlearn">{String(app.speedRacerOverlearnDirection)}</span>
      <span data-testid="voiceMaster">{String(app.voiceMasterToggleEnabled)}</span>
      <span data-testid="voiceOpen">{String(app.isSettingsAccordionOpen(SETTINGS_ACCORDION_IDS.voice))}</span>
      <span data-testid="steps">{app.speedRacerWpmSteps.join(',')}</span>
      <span data-testid="bufferEpoch">{app.voiceBufferClearEpoch}</span>
    </>
  );
}

function renderHarness() {
  return render(
    <StateProviders>
      <SpeedRacerVoiceHarness />
    </StateProviders>,
  );
}

describe('Speed Racer / Voice UI coupling', () => {
  beforeEach(() => {
    stubVoiceCapable();
  });

  afterEach(() => {
    clearCookies();
  });

  it('restores lesson voice when Speak turns off while Speed Racer stays on', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'armRecap' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
      screen.getByRole('button', { name: 'captureBaseline' }).click();
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'speakOff' }).click();
    });
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('false');
    expect(screen.getByTestId('manualVoice')).toHaveTextContent('true');
    view.unmount();
  });

  it('does not restore lesson voice when Speak turns off while Speed Racer is off', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'armRecap' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
      screen.getByRole('button', { name: 'captureBaseline' }).click();
      screen.getByRole('button', { name: 'srOff' }).click();
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'speakOff' }).click();
    });
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('true');
    expect(screen.getByTestId('manualVoice')).toHaveTextContent('true');
    view.unmount();
  });

  it('restores lesson voice when Overlearn turns Speak off while Speed Racer stays on', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'armRecap' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
      screen.getByRole('button', { name: 'captureBaseline' }).click();
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'overlearn' }).click();
    });
    expect(screen.getByTestId('srSpeak')).toHaveTextContent('false');
    expect(screen.getByTestId('srFinal')).toHaveTextContent('false');
    expect(screen.getByTestId('srOverlearn')).toHaveTextContent('true');
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('false');
    expect(screen.getByTestId('manualVoice')).toHaveTextContent('true');
    view.unmount();
  });

  it('forces Voice off and bumps buffer clear epoch when Speak turns off', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'captureBaseline' }).click();
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'speakOff' }).click();
    });
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('false');
    expect(Number(screen.getByTestId('bufferEpoch').textContent)).toBeGreaterThan(0);
    view.unmount();
  });

  it('restores Voice First when Speed Racer turns off after Speak-off morse-only session', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'speakFirstOn' }).click();
      screen.getByRole('button', { name: 'captureBaseline' }).click();
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'speakOff' }).click();
    });
    expect(screen.getByTestId('speakFirst')).toHaveTextContent('false');
    await act(async () => {
      screen.getByRole('button', { name: 'srOff' }).click();
    });
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('true');
    expect(screen.getByTestId('speakFirst')).toHaveTextContent('true');
    view.unmount();
  });

  it('enables Voice when Reset to defaults turns Speak on while SR is active', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOff' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
      screen.getByRole('button', { name: 'resetDefaults' }).click();
    });
    expect(screen.getByTestId('srSpeak')).toHaveTextContent('true');
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('true');
    view.unmount();
  });

  it('enables Voice on Reset when Speak was already on', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
      screen.getByRole('button', { name: 'resetDefaults' }).click();
    });
    expect(screen.getByTestId('srSpeak')).toHaveTextContent('true');
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('true');
    view.unmount();
  });

  it('turns Speak off when Voice is turned off during Speed Racer', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
      screen.getByRole('button', { name: 'voiceOn' }).click();
      screen.getByRole('button', { name: 'voiceOff' }).click();
    });
    expect(screen.getByTestId('srSpeak')).toHaveTextContent('false');
    expect(screen.getByTestId('voiceEnabled')).toHaveTextContent('false');
    view.unmount();
  });

  it('unlocks Voice master toggle when SR + Speak override Arm Recap', async () => {
    const view = renderHarness();
    await act(async () => {
      screen.getByRole('button', { name: 'armRecap' }).click();
    });
    expect(screen.getByTestId('voiceMaster')).toHaveTextContent('false');
    await act(async () => {
      screen.getByRole('button', { name: 'srOn' }).click();
      screen.getByRole('button', { name: 'speakOn' }).click();
    });
    expect(screen.getByTestId('voiceMaster')).toHaveTextContent('true');
    view.unmount();
  });
});
