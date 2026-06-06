import { useState } from 'react';
import { useMorseApp } from '../../context/MorseAppContext';
import { useMorseAudio } from '../../context/MorseAudioContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';

export function ToneOptionsPanel() {
  const {
    ditFrequency, dahFrequency, syncFreq,
    setDitFrequency, setDahFrequency, setSyncFreq,
  } = useMorseApp();
  const { playTestTone, stopMorse } = useMorseAudio();
  const [testTonePlaying, setTestTonePlaying] = useState(false);

  const handleTestTone = () => {
    if (testTonePlaying) {
      stopMorse();
      setTestTonePlaying(false);
      return;
    }
    setTestTonePlaying(true);
    playTestTone(() => setTestTonePlaying(false));
  };

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.tone}
      headingId="headingtonespacing"
      buttonId="toneSettingsAccordionButton"
      title={(
        <>
          <img height={20} width={20} alt="" src={getMorseImageSrc('musicnoteImage')} />
          <span>&nbsp;Tone Options</span>
        </>
      )}
    >
      <fieldset className="morse-settings-fieldset">
            <legend className="morse-settings-legend">Tone Options</legend>
            <div className="input-group flex-wrap">
              <label htmlFor="ditFrequency" className="input-group-text">
                DIT&nbsp;
                <img id="musicnoteImage" height={20} width={20} alt="" src={getMorseImageSrc('musicnoteImage')} />
              </label>
              <input
                id="ditFrequency"
                name="ditFrequency"
                type="number"
                className="form-control morse-settings-num morse-settings-num--wide"
                min={100}
                max={1200}
                step={10}
                title="Dit frequency in hertz"
                value={ditFrequency}
                onChange={e => setDitFrequency(Number(e.target.value))}
              />
              <span className="input-group-text">
                <label htmlFor="dahFrequency">DAH</label>
                &nbsp;
                <input
                  type="image"
                  role="checkbox"
                  alt="Sync dit and dah frequencies"
                  aria-checked={syncFreq}
                  src={getMorseImageSrc(syncFreq ? 'lockImage' : 'unlockImage')}
                  title="Sync dit and dah frequencies"
                  onClick={() => setSyncFreq(!syncFreq)}
                />
              </span>
              <input
                id="dahFrequency"
                name="dahFrequency"
                type="number"
                className="form-control morse-settings-num morse-settings-num--wide"
                min={100}
                max={1200}
                step={10}
                title="Dah frequency in hertz"
                disabled={syncFreq}
                value={dahFrequency}
                onChange={e => setDahFrequency(Number(e.target.value))}
              />
              <button
                id="zeroBeatButton"
                type="button"
                className="btn btn-light"
                title="Plays a sustained test tone"
                onClick={handleTestTone}
              >
                <span>{testTonePlaying ? 'Stop Tone' : 'Zero Beat'}</span>
              </button>
            </div>
          </fieldset>
    </SettingsAccordionItem>
  );
}
