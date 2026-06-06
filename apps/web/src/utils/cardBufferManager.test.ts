import { describe, it, expect } from 'vitest';
import { CardBufferManager } from './cardBufferManager';

describe('CardBufferManager', () => {
  it('plays display word subparts before advancing', () => {
    const words = ['c q', 'TEST'];
    const buf = new CardBufferManager(() => 0, () => words);
    expect(buf.getNextMorse()).toBe('c');
    expect(buf.hasMoreMorse()).toBe(true);
    expect(buf.getNextMorse()).toBe('q');
    expect(buf.hasMoreMorse()).toBe(false);
  });

  it('repeats subparts when repeats > 0', () => {
    const buf = new CardBufferManager(() => 0, () => ['AB']);
    expect(buf.getNextMorse(1, 0)).toBe('AB');
    expect(buf.getNextMorse(1, 0)).toBe('AB');
    expect(buf.hasMoreMorse()).toBe(false);
  });
});
