import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export function FlaggedWordsAccordion() {
  const {
    flaggedWords, flaggedWordsCount, setFlaggedWords,
    clearFlaggedWords, loadFlaggedAsText,
  } = useMorseApp();

  return (
    <fieldset className="morse-settings-fieldset morse-settings-subfieldset">
      <legend className="morse-settings-legend">Flagged cards</legend>
      <p className="form-text mb-2" role="note">
        Click cards you missed in the word list to add them here. Load As Text copies this list
        into the practice text area above.
        <span className="badge bg-success ms-1">{flaggedWordsCount}</span>
      </p>
      <div className="input-group flagged-cards-input-group">
        <button
          type="button"
          id="btnSetFlagged"
          className="input-group-text"
          onClick={loadFlaggedAsText}
        >
          <img height={20} width={20} alt="" src={getMorseImageSrc('uploadImage')} />
          &nbsp;Load As Text
        </button>
        <button
          type="button"
          id="btnClearFlagged"
          className="input-group-text"
          onClick={clearFlaggedWords}
        >
          <img height={20} width={20} alt="" src={getMorseImageSrc('trashImage')} />
          &nbsp;Clear
        </button>
        <textarea
          className="form-control"
          aria-label="Flagged Words"
          value={flaggedWords}
          onChange={e => setFlaggedWords(e.target.value)}
        />
      </div>
    </fieldset>
  );
}
