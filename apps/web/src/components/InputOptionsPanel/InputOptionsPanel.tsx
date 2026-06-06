import { useRef } from 'react';
import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';
import { FlaggedWordsAccordion } from '../FlaggedWordsAccordion/FlaggedWordsAccordion';

export function InputOptionsPanel() {
  const {
    showRaw, setShowRaw, showingText, setShowingText, clearText,
  } = useMorseApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setShowingText(reader.result);
        setShowRaw(true);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.input}
      headingId="headingcustominput"
      buttonId="customInputAccordionButton"
      bodyClassName="d-flex flex-column gap-3"
      title={(
        <>
          <img height={20} width={20} alt="" src={getMorseImageSrc('uploadImage')} />
          <span>&nbsp;Input Options</span>
        </>
      )}
    >
      <fieldset className="morse-settings-fieldset">
            <legend className="morse-settings-legend">Practice text</legend>
            <div className="settings-lesson-control-strip custom-input-actions">
              <div className="settings-lesson-control">
                <input
                  type="checkbox"
                  className="btn-check"
                  id="btncheckshowraw"
                  autoComplete="off"
                  checked={showRaw}
                  onChange={e => setShowRaw(e.target.checked)}
                  aria-label="Show working text"
                />
                <label
                  className="btn btn-outline-primary"
                  htmlFor="btncheckshowraw"
                  aria-hidden="true"
                  title="Show or hide practice text"
                >
                  <img
                    alt=""
                    height={20}
                    width={20}
                    src={getMorseImageSrc(showRaw ? 'eyeImage' : 'eyeslashImage')}
                  />
                  <span>{showRaw ? 'Hide text' : 'View text'}</span>
                </label>
              </div>
              <div className="settings-lesson-control">
                <button id="btnClearText" type="button" className="btn btn-outline-primary" onClick={clearText}>
                  <img height={20} width={20} alt="" src={getMorseImageSrc('trashImage')} />
                  &nbsp;Clear
                </button>
              </div>
              <div className="settings-lesson-control">
                <button
                  id="btnLoadTextFile"
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => fileRef.current?.click()}
                >
                  <img height={20} width={20} alt="" src={getMorseImageSrc('arrowleftImage')} />
                  &nbsp;Insert File
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt"
                  id="txtfiletoread"
                  className="form-control"
                  hidden
                  onChange={handleFileChange}
                />
              </div>
            </div>
            {showRaw && (
              <div className="custom-input-editor">
                <p role="note" className="sr-only">
                  The following textarea contains the text that will be used for practice.
                  This can be set manually or selected using the options found in the LICW Lessons section.
                </p>
                <textarea
                  className="form-control working-text-area"
                  aria-label="Working text"
                  rows={4}
                  value={showingText}
                  onChange={e => setShowingText(e.target.value)}
                />
              </div>
            )}
          </fieldset>
          <FlaggedWordsAccordion />
    </SettingsAccordionItem>
  );
}
