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

  it('filters empty pieces from Sending-style column pads', () => {
    const buf = new CardBufferManager(() => 0, () => ['A  B   ']);
    expect(buf.getNextMorse()).toBe('A');
    expect(buf.getNextMorse()).toBe('B');
    expect(buf.hasMoreMorse()).toBe(false);
  });

  it('repeats subparts when repeats > 0', () => {
    const buf = new CardBufferManager(() => 0, () => ['AB']);
    expect(buf.getNextMorse(2, 0)).toBe('AB');
    expect(buf.getNextMorse(2, 0)).toBe('AB');
    expect(buf.hasMoreMorse()).toBe(false);
  });

  it('places wordspace pads between repeats only', () => {
    const buf = new CardBufferManager(() => 0, () => ['CQ']);
    expect(buf.getNextMorse(2, 1)).toBe('CQ');
    expect(buf.getNextMorse(2, 1)).toBe('');
    expect(buf.getNextMorse(2, 1)).toBe('CQ');
    expect(buf.hasMoreMorse()).toBe(false);
  });

  it('reports repeat state per audible play, ignoring pads', () => {
    const buf = new CardBufferManager(() => 0, () => ['CQ']);
    buf.getNextMorse(3, 1);
    expect(buf.getRepeatState()).toEqual({
      index: 0, total: 3, isFirstOfRepeat: true, isLastOfRepeat: true,
    });
    // Pad between repeats does not advance the audible index.
    buf.getNextMorse(3, 1);
    expect(buf.getRepeatState().index).toBe(0);
    buf.getNextMorse(3, 1);
    expect(buf.getRepeatState().index).toBe(1);
    buf.getNextMorse(3, 1);
    buf.getNextMorse(3, 1);
    expect(buf.getRepeatState().index).toBe(2);
  });

  it('tracks first/last position across a multi-subpart repeat', () => {
    const buf = new CardBufferManager(() => 0, () => ['c q']);
    expect(buf.getNextMorse(2, 0)).toBe('c');
    expect(buf.getRepeatState()).toEqual({
      index: 0, total: 2, isFirstOfRepeat: true, isLastOfRepeat: false,
    });
    expect(buf.getNextMorse(2, 0)).toBe('q');
    expect(buf.getRepeatState()).toEqual({
      index: 0, total: 2, isFirstOfRepeat: false, isLastOfRepeat: true,
    });
    expect(buf.getNextMorse(2, 0)).toBe('c');
    expect(buf.getRepeatState().index).toBe(1);
    expect(buf.getRepeatState().isFirstOfRepeat).toBe(true);
  });
});
