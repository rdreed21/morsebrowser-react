import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveSpeechVoice, ALLOWED_VOICE_LANGS } from './voiceSpeech';

function stubVoices(langs: string[]): void {
  const voices = langs.map((lang, i) => ({ lang, name: `Voice ${i} (${lang})` }));
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices as unknown as SpeechSynthesisVoice[],
    cancel: () => {},
  });
}

describe('resolveSpeechVoice', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('allows the KO language set: English, Spanish, Portuguese', () => {
    for (const lang of ['en-US', 'en-GB', 'es-ES', 'es-US', 'pt-BR', 'pt-PT', 'es_ES', 'pt_BR']) {
      expect(ALLOWED_VOICE_LANGS).toContain(lang);
    }
  });

  it('falls back to a Spanish voice when no English voice exists', () => {
    stubVoices(['fr-FR', 'es-ES', 'de-DE']);
    const voice = resolveSpeechVoice([], -1);
    expect(voice?.lang).toBe('es-ES');
  });

  it('falls back to an underscored Portuguese locale', () => {
    stubVoices(['fr-FR', 'pt_BR']);
    const voice = resolveSpeechVoice([], -1);
    expect(voice?.lang).toBe('pt_BR');
  });

  it('prefers the first allowed voice over disallowed ones', () => {
    stubVoices(['fr-FR', 'en-GB', 'es-ES']);
    const voice = resolveSpeechVoice([], -1);
    expect(voice?.lang).toBe('en-GB');
  });

  it('uses the first voice of any language when nothing matches', () => {
    stubVoices(['fr-FR', 'de-DE']);
    const voice = resolveSpeechVoice([], -1);
    expect(voice?.lang).toBe('fr-FR');
  });

  it('resolves an explicitly selected voice by name', () => {
    stubVoices(['fr-FR', 'es-US']);
    const voice = resolveSpeechVoice([{ idx: 0, name: 'Voice 1 (es-US)' }], 0);
    expect(voice?.lang).toBe('es-US');
  });
});
