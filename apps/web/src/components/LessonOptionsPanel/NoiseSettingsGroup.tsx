import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export type NoiseType = 'off' | 'white' | 'brown' | 'pink';

export function NoiseSettingsGroup() {
  const { noiseType, noiseVolume, setNoiseType, setNoiseVolume } = useMorseApp();

  return (
    <fieldset className="morse-settings-fieldset">
      <legend className="morse-settings-legend">
        <img height={20} width={20} alt="" src={getMorseImageSrc('soundwaveImage')} />
        &nbsp;Noise (Experimental)
      </legend>
      <div className="row row-cols-2 gy-2 gx-2">
        <div className="col-auto">
          <fieldset className="btn-group" aria-label="Noise Type">
            {(['off', 'white', 'brown', 'pink'] as const).map(type => (
              <span key={type}>
                <input
                  type="radio"
                  className="btn-check"
                  name="noiseType"
                  id={`btnnoise-${type}`}
                  autoComplete="off"
                  checked={noiseType === type}
                  aria-label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onChange={() => setNoiseType(type)}
                />
                <label
                  className={`btn btn-outline-${type === 'off' ? 'primary' : type === 'white' ? 'info' : type === 'brown' ? 'secondary' : 'danger'}`}
                  htmlFor={`btnnoise-${type}`}
                  aria-hidden="true"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              </span>
            ))}
          </fieldset>
        </div>
        <div className="col-auto">
          <div className="input-group">
            <label htmlFor="noiseVolume" className="input-group-text">
              <img role="presentation" height={20} width={20} alt=""
                src={getMorseImageSrc('volumeImage')} />
            </label>
            <input
              id="noiseVolume"
              name="noiseVolume"
              type="number"
              className="form-control"
              min={1}
              max={10}
              step={1}
              value={noiseVolume}
              onChange={e => setNoiseVolume(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
