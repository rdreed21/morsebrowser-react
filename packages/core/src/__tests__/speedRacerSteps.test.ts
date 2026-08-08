import {
  addSpeedRacerStep,
  createSpeedRacerStepDefaults,
  removeSpeedRacerStep,
} from '../settings/speedRacerSteps';

describe('speed racer WPM step helpers', () => {
  it('defaults to three descending WPM picker values from the selected top-page WPM', () => {
    expect(createSpeedRacerStepDefaults({ baseWpm: 25 })).toEqual([25, 20, 15]);
  });

  it('adds another descending step five WPM below the prior choice', () => {
    expect(addSpeedRacerStep([25, 20, 15])).toEqual([25, 20, 15, 10]);
  });

  it('does not remove below the required three default steps', () => {
    expect(removeSpeedRacerStep([25, 20, 15])).toEqual([25, 20, 15]);
    expect(removeSpeedRacerStep([25, 20, 15, 10])).toEqual([25, 20, 15]);
  });

  it('supports Overlearn-style ascending defaults', () => {
    expect(createSpeedRacerStepDefaults({ baseWpm: 23, direction: 'up' })).toEqual([23, 28, 33]);
  });

  it('clamps low descending speeds to the minimum WPM', () => {
    expect(createSpeedRacerStepDefaults({ baseWpm: 7, count: 4 })).toEqual([7, 2, 1, 1]);
  });
});
