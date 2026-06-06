import * as Speech from 'expo-speech';

export interface VoiceOption {
  idx: number;
  name: string;
  identifier: string;
  language?: string;
}

export interface SpeakPhraseConfig {
  text: string;
  volume: number;
  rate: number;
  pitch: number;
  voiceIdentifier?: string;
  afterThinkingTimeSec: number;
  spellMode?: boolean;
  interTokenPauseMs?: number;
}

export function cancelSpeech(): void {
  Speech.stop();
}

export async function checkVoiceCapable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}

export async function loadAvailableVoices(): Promise<VoiceOption[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v, idx) => ({
    idx,
    name: v.name ?? v.identifier,
    identifier: v.identifier,
    language: v.language,
  }));
}

function speakSingleToken(
  text: string,
  config: SpeakPhraseConfig,
  onComplete: () => void,
): void {
  const phrase = text.trim().toLowerCase();
  if (!phrase) {
    onComplete();
    return;
  }

  Speech.speak(phrase, {
    volume: config.volume,
    rate: config.rate,
    pitch: config.pitch,
    voice: config.voiceIdentifier,
    onDone: () => {
      setTimeout(onComplete, config.afterThinkingTimeSec * 1000);
    },
    onStopped: onComplete,
    onError: onComplete,
  });
}

export function speakPhrase(config: SpeakPhraseConfig, onComplete: () => void): void {
  cancelSpeech();

  const phrase = config.text.trim();
  if (!phrase) {
    setTimeout(onComplete, config.afterThinkingTimeSec * 1000);
    return;
  }

  if (!config.spellMode) {
    speakSingleToken(phrase, config, onComplete);
    return;
  }

  const tokens = phrase.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    speakSingleToken(phrase, config, onComplete);
    return;
  }

  const pauseMs = config.interTokenPauseMs ?? 150;
  let idx = 0;

  const speakNext = () => {
    if (idx >= tokens.length) {
      setTimeout(onComplete, config.afterThinkingTimeSec * 1000);
      return;
    }
    const token = tokens[idx];
    idx += 1;
    speakSingleToken(token, config, () => {
      if (idx >= tokens.length) {
        setTimeout(onComplete, config.afterThinkingTimeSec * 1000);
      } else {
        setTimeout(speakNext, pauseMs);
      }
    });
  };

  speakNext();
}

/** Prime TTS engine — mirrors KO MorseVoice.primeThePump. */
export function primeSpeechPump(voiceIdentifier?: string): void {
  cancelSpeech();
  Speech.speak('i', {
    volume: 0.01,
    rate: 5,
    pitch: 1,
    voice: voiceIdentifier,
  });
}

export function resolveSpeechVoice(
  voiceVoices: VoiceOption[],
  voiceVoiceIdx: number,
): string | undefined {
  if (voiceVoiceIdx >= 0 && voiceVoiceIdx < voiceVoices.length) {
    return voiceVoices[voiceVoiceIdx].identifier;
  }
  const en = voiceVoices.find(v =>
    v.language?.startsWith('en-US') || v.language?.startsWith('en_US'),
  );
  return en?.identifier ?? voiceVoices[0]?.identifier;
}
