import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';
import { SettingsCheckToggle } from '../shared/SettingsCheckToggle';

export function VoiceOptionsPanel() {
  const {
    voiceCapable, voiceEnabled, voiceSpelling, manualVoice, speakFirst,
    voiceThinkingTime, voiceThinkingTimeWpm, voiceAfterThinkingTime,
    voiceVoices, voiceVoiceIdx, voiceVolume, voiceLastOnly,
    voicePitch, voiceRate, voiceBufferMaxLength,
    setVoiceEnabled, setVoiceSpelling, setManualVoice, setSpeakFirst,
    setVoiceThinkingTime, setVoiceAfterThinkingTime, setVoiceVoiceIdx,
    setVoiceVolume, setVoiceLastOnly, setVoicePitch, setVoiceRate,
    setVoiceBufferMaxLength, initVoices,
  } = useMorseApp();

  const voiceOn = voiceEnabled;

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.voice}
      headingId="headingvoiceoptions"
      buttonId="voiceOptionsAccordionButton"
      onBeforeOpen={() => initVoices()}
      title={(
        <>
          <img height={20} width={20} alt="" src={getMorseImageSrc('chatquoteImage')} />
          <span>&nbsp;Voice Options</span>
        </>
      )}
    >
      <div className="row row-cols-5 gx-2 gy-2">
            <div className="input-group">
              <SettingsCheckToggle
                id="btncheckvoice"
                label="Voice"
                icon="chatquoteImage"
                checked={voiceEnabled}
                disabled={!voiceCapable || manualVoice}
                onChange={setVoiceEnabled}
              />
              <SettingsCheckToggle
                id="btncheckvoicespell"
                label="Spell"
                icon="spellcheckImage"
                checked={voiceSpelling}
                disabled={!voiceOn}
                onChange={setVoiceSpelling}
              />
              <SettingsCheckToggle
                id="btncheckmanualVoice"
                label="Arm Recap"
                icon="bootstrapRebootImage"
                checked={manualVoice}
                disabled={!voiceOn}
                onChange={setManualVoice}
              />
              <SettingsCheckToggle
                id="btncheckspeakfirst"
                label="Voice First"
                icon="chatRightDotsImage"
                checked={speakFirst}
                disabled={!voiceOn}
                onChange={setSpeakFirst}
              />
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voiceThinkingTime" className="input-group-text">
                    Delay Before
                    <img width={20} height={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                  </label>
                  <input
                    id="voiceThinkingTime"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={10}
                    step={0.25}
                    disabled={!voiceOn}
                    value={voiceThinkingTime}
                    onChange={e => setVoiceThinkingTime(Number(e.target.value))}
                  />
                  <span className="input-group-text">
                    {voiceThinkingTimeWpm}&nbsp;wpm
                  </span>
                </div>
              </div>
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voiceAfterThinkingTime" className="input-group-text">
                    Delay After
                    <img width={20} height={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                  </label>
                  <input
                    id="voiceAfterThinkingTime"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={10}
                    step={0.25}
                    disabled={!voiceOn}
                    value={voiceAfterThinkingTime}
                    onChange={e => setVoiceAfterThinkingTime(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="col-auto">
                <select
                  aria-label="Choose speaker"
                  id="selectVoiceDropdown"
                  className="form-select"
                  disabled={!voiceOn || voiceVoices.length === 0}
                  value={voiceVoiceIdx >= 0 ? voiceVoiceIdx : ''}
                  onChange={e => setVoiceVoiceIdx(Number(e.target.value))}
                >
                  <option value="">Choose speaker...</option>
                  {voiceVoices.map(v => (
                    <option key={v.idx} value={v.idx}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voiceVolume" className="input-group-text">
                    <img role="presentation" width={20} height={20} alt="Voice Volume"
                      src={getMorseImageSrc('volumeImage')} />
                  </label>
                  <input
                    id="voiceVolume"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={10}
                    step={1}
                    disabled={!voiceOn}
                    value={voiceVolume}
                    onChange={e => setVoiceVolume(Number(e.target.value))}
                  />
                </div>
              </div>
              <SettingsCheckToggle
                id="btnvoicelastonly"
                label="Last Only"
                icon="alignendImage"
                checked={voiceLastOnly}
                disabled={!voiceOn}
                onChange={setVoiceLastOnly}
              />
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voicePitch" className="input-group-text">
                    Pitch
                    <img width={20} height={20} alt="" src={getMorseImageSrc('musicnoteImage')} />
                  </label>
                  <input
                    id="voicePitch"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={2}
                    step={0.25}
                    disabled={!voiceOn}
                    value={voicePitch}
                    onChange={e => setVoicePitch(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voiceRate" className="input-group-text">
                    Rate
                    <img width={20} height={20} alt="" src={getMorseImageSrc('speedometerImage')} />
                  </label>
                  <input
                    id="voiceRate"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0.1}
                    max={10}
                    step={0.1}
                    disabled={!voiceOn}
                    value={voiceRate}
                    onChange={e => setVoiceRate(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="col-md-auto">
                <div className="input-group">
                  <label htmlFor="voiceBufferMaxLength" className="input-group-text">
                    Voice After
                    <img width={20} height={20} alt="" src={getMorseImageSrc('bookshelfImage')} />
                  </label>
                  <input
                    id="voiceBufferMaxLength"
                    type="number"
                    className="form-control morse-settings-num"
                    min={1}
                    max={999}
                    step={1}
                    disabled={!voiceOn}
                    value={voiceBufferMaxLength}
                    onChange={e => setVoiceBufferMaxLength(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
      </div>
    </SettingsAccordionItem>
  );
}
