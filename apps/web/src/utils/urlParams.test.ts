import { afterEach, describe, expect, it, vi } from 'vitest';
import { getUrlParam, hasUrlParam, isDevBuild } from './urlParams';

describe('urlParams', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads query params', () => {
    vi.stubGlobal('window', {
      location: { search: '?selectedClass=BC1&voiceEnabled=true' },
    });
    expect(getUrlParam('selectedClass')).toBe('BC1');
    expect(hasUrlParam('selectedClass')).toBe(true);
    expect(hasUrlParam('missing')).toBe(false);
  });

  it('detects /dev/ builds', () => {
    vi.stubGlobal('window', {
      location: { href: 'https://example.org/dev/morse/index.html' },
    });
    expect(isDevBuild()).toBe(true);
  });

  it('detects ?beta=true query param', () => {
    vi.stubGlobal('window', {
      location: { href: 'https://example.org/morse/index.html?beta=true', search: '?beta=true' },
    });
    expect(isDevBuild()).toBe(true);
  });
});
