export interface SpeakPhraseConfig {
  text: string;
  volume: number;
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
  afterThinkingTimeSec: number;
  /** When true, speak space-separated tokens one at a time (clearer spelling). */
  spellMode?: boolean;
  interTokenPauseMs?: number;
}

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function speakSingleToken(
  text: string,
  config: SpeakPhraseConfig,
  onComplete: () => void,
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onComplete();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
  utterance.volume = config.volume;
  utterance.rate = Number(config.rate) || 1;
  utterance.pitch = Number(config.pitch) || 1;
  if (config.voice) {
    utterance.voice = config.voice;
    utterance.lang = config.voice.lang;
  }

  utterance.onend = onComplete;
  utterance.onerror = onComplete;
  window.speechSynthesis.speak(utterance);
}

export function speakPhrase(config: SpeakPhraseConfig, onComplete: () => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onComplete();
    return;
  }

  cancelSpeech();

  const finish = () => {
    window.setTimeout(onComplete, config.afterThinkingTimeSec * 1000);
  };

  const phrase = config.text.trim();
  if (!phrase) {
    finish();
    return;
  }

  if (!config.spellMode) {
    speakSingleToken(phrase, config, finish);
    return;
  }

  const tokens = phrase.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    speakSingleToken(phrase, config, finish);
    return;
  }

  const pauseMs = config.interTokenPauseMs ?? 150;
  let idx = 0;

  const speakNext = () => {
    if (idx >= tokens.length) {
      finish();
      return;
    }
    const token = tokens[idx];
    idx += 1;
    speakSingleToken(token, config, () => {
      if (idx >= tokens.length) {
        finish();
      } else {
        window.setTimeout(speakNext, pauseMs);
      }
    });
  };

  speakNext();
}

/** Safari wake-up — mirrors KO MorseVoice.primeThePump. */
export function primeSpeechPump(voice: SpeechSynthesisVoice | null): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance('i');
  utterance.volume = 0;
  utterance.rate = 5;
  utterance.pitch = 1;
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  window.speechSynthesis.speak(utterance);
}

export function resolveSpeechVoice(
  voiceVoices: { idx: number; name: string }[],
  voiceVoiceIdx: number,
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const all = window.speechSynthesis.getVoices();
  if (voiceVoiceIdx >= 0 && voiceVoiceIdx < voiceVoices.length) {
    const name = voiceVoices[voiceVoiceIdx].name;
    return all.find(v => v.name === name) ?? null;
  }
  const allowed = ['en-US', 'en-GB', 'en_US', 'en_GB'];
  return all.find(v => allowed.includes(v.lang)) ?? all[0] ?? null;
}
