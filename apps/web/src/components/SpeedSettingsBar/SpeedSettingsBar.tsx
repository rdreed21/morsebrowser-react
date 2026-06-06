import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export function SpeedSettingsBar() {
  const {
    charWPM, effectiveWPM, syncWpm,
    setCharWPM, setEffectiveWPM, setSyncWpm,
    koVolume, setKoVolume,
    isPlaying, speedInterval, intervalTimingsText,
    timingConfig,
  } = useMorseApp();

  const variableSpeedDisplay = isPlaying
    && speedInterval
    && intervalTimingsText.trim().length > 0;

  return (
    <section className="col speed-settings-section" title="Basic settings" aria-label="Basic settings">
      <div className="input-group flex-wrap speed-input-group">
        <label htmlFor="wpm" className="input-group-text">
          Character Speed (WPM)&nbsp;
          <img
            aria-hidden="true"
            src={getMorseImageSrc('speedometerImage')}
            height={20}
            width={20}
            alt=""
          />
        </label>
        {!variableSpeedDisplay && (
          <input
            id="wpm"
            name="wpm"
            type="number"
            className="form-control morse-settings-num"
            min={1}
            value={charWPM}
            onChange={e => setCharWPM(Number(e.target.value))}
          />
        )}
        {variableSpeedDisplay && (
          <input
            id="vWpm"
            name="vWpm"
            type="number"
            className="form-control morse-settings-num"
            readOnly
            disabled
            value={timingConfig.charWPM}
            aria-label="Current interval character speed"
          />
        )}
        <span className="input-group-text">
          <label htmlFor="trueWpm">Effective Speed (FWPM)</label>
          &nbsp;
          <input
            type="image"
            role="checkbox"
            alt="Sync WPM speed"
            aria-checked={syncWpm}
            src={getMorseImageSrc(syncWpm ? 'lockImage' : 'unlockImage')}
            onClick={() => setSyncWpm(!syncWpm)}
          />
        </span>
        {!variableSpeedDisplay && (
          <input
            id="trueWpm"
            name="trueWpm"
            type="number"
            className="form-control morse-settings-num"
            min={1}
            max={charWPM}
            disabled={syncWpm}
            value={effectiveWPM}
            onChange={e => setEffectiveWPM(Number(e.target.value))}
          />
        )}
        {variableSpeedDisplay && (
          <input
            id="vFwpm"
            name="vFwpm"
            type="number"
            className="form-control morse-settings-num"
            readOnly
            disabled
            value={timingConfig.effectiveWPM}
            aria-label="Current interval effective speed"
          />
        )}
        <div className="input-group speed-volume-segment">
          <label htmlFor="txtVolume" className="input-group-text">
            <img alt="Volume" id="volumeImage" width={20} height={20}
              src={getMorseImageSrc('volumeImage')} />
          </label>
          <input
            id="txtVolume"
            name="txtVolume"
            type="number"
            className="form-control morse-settings-num"
            min={1}
            max={10}
            step={1}
            value={koVolume}
            onChange={e => setKoVolume(Number(e.target.value))}
          />
        </div>
      </div>
    </section>
  );
}
