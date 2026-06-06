import { estimateScheduleDuration, encodeWav } from '../audio/wavExport';
import { DEFAULT_TIMING } from '../audio/timingEngine';

describe('wavExport', () => {
  it('estimateScheduleDuration includes trailing word space', () => {
    const withTrail = estimateScheduleDuration('A', DEFAULT_TIMING, { trimLastWordSpace: false });
    const withoutTrail = estimateScheduleDuration('A', DEFAULT_TIMING, { trimLastWordSpace: true });
    expect(withTrail).toBeGreaterThan(withoutTrail);
  });

  it('encodeWav produces a RIFF header', () => {
    const buffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 100,
      getChannelData: () => new Float32Array(100),
    } as unknown as AudioBuffer;
    const wav = encodeWav(buffer);
    const view = new DataView(wav);
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe('RIFF');
  });
});
