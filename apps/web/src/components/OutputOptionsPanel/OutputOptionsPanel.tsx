import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { useWavDownload } from '../../hooks/useWavDownload';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';

export function OutputOptionsPanel() {
  const {
    preSpace, xtraWordSpaceDits, cardSpace, cardFontPx, cardsVisible,
    setPreSpace, setXtraWordSpaceDits, setCardSpace, setCardFontPx, setCardsVisible,
    showingText,
  } = useMorseApp();
  const { downloadWav, downloading } = useWavDownload();

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.output}
      headingId="headingoutputsettings"
      buttonId="outputSettingsAccordionButton"
      title={(
        <>
          <img height={20} width={20} alt="" src={getMorseImageSrc('grid3x3gapImage')} />
          <span>&nbsp;Output Options</span>
        </>
      )}
    >
      <fieldset className="morse-settings-fieldset">
            <legend className="morse-settings-legend">Output Options</legend>
            <div className="d-flex flex-column gap-2">
              <div className="input-group flex-wrap align-items-center">
                <label htmlFor="preSpace" className="input-group-text">
                  PRE&nbsp;
                  <img id="volumemuteImage" height={20} width={20} alt="" src={getMorseImageSrc('volumemuteImage')} />
                </label>
                <input
                  id="preSpace"
                  name="preSpace"
                  type="number"
                  className="form-control morse-settings-num morse-settings-num--wide"
                  min={0}
                  max={1200}
                  step={0.5}
                  title="Silence at start of playback"
                  value={preSpace}
                  onChange={e => setPreSpace(Number(e.target.value))}
                />
                <label htmlFor="xtraWordSpaceDits" className="input-group-text">
                  WORD&nbsp;SPACE&nbsp;
                  <img id="graphuparrowImage" height={20} width={20} alt="" src={getMorseImageSrc('graphuparrowImage')} />
                </label>
                <input
                  id="xtraWordSpaceDits"
                  name="xtraWordSpaceDits"
                  type="number"
                  className="form-control morse-settings-num"
                  min={1}
                  max={10}
                  step={1}
                  title="Extra word space in dits"
                  value={xtraWordSpaceDits}
                  onChange={e => setXtraWordSpaceDits(Number(e.target.value))}
                />
                <label htmlFor="cardSpace" className="input-group-text">
                  CARD&nbsp;WAIT&nbsp;
                  <img height={20} width={20} alt="" src={getMorseImageSrc('graphuparrowImage')} />
                </label>
                <input
                  id="cardSpace"
                  name="cardSpace"
                  type="number"
                  className="form-control morse-settings-num"
                  min={0}
                  max={10}
                  step={1}
                  title="Extra silence between cards"
                  value={cardSpace}
                  onChange={e => setCardSpace(Number(e.target.value))}
                />
                <label htmlFor="cardFontPx" className="input-group-text">
                  CARD&nbsp;SIZE&nbsp;
                  <img height={20} width={20} alt="" src={getMorseImageSrc('barchartImage')} />
                </label>
                <input
                  id="cardFontPx"
                  name="cardFontPx"
                  type="number"
                  className="form-control morse-settings-num morse-settings-num--wide"
                  min={1}
                  max={1200}
                  step={1}
                  title="Text size when displaying cards"
                  value={cardFontPx}
                  onChange={e => setCardFontPx(Number(e.target.value))}
                />
                <div className="col-auto">
                  <input
                    type="checkbox"
                    className="btn-check"
                    autoComplete="off"
                    id="btncheckcardsvisible"
                    title="Toggles card visibility"
                    aria-label="Cards"
                    checked={cardsVisible}
                    onChange={e => setCardsVisible(e.target.checked)}
                  />
                  <label className="btn btn-outline-primary" htmlFor="btncheckcardsvisible" aria-hidden="true">
                    <img alt="" src={getMorseImageSrc('grid3x3gapImage')} />
                    &nbsp;Cards&nbsp;
                    <img
                      alt=""
                      src={getMorseImageSrc(cardsVisible ? 'checkImage' : 'circleImage')}
                    />
                  </label>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2 align-items-center output-settings-actions">
                <button
                  type="button"
                  className="btn btn-success"
                  disabled={!showingText.trim() || downloading}
                  title="Downloads an audio file using the current settings"
                  onClick={() => { void downloadWav(); }}
                >
                  <img id="downloadImage" alt="" src={getMorseImageSrc('downloadImage')} />
                  {downloading ? ' Rendering…' : ' Audio File'}
                </button>
              </div>
            </div>
          </fieldset>
    </SettingsAccordionItem>
  );
}
