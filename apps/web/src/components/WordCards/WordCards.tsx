import { useMorseApp } from '../../context/MorseAppContext';
import { usePlaybackState } from '../../context/PlaybackStateContext';
import { useMorsePlaybackControls } from '../../context/MorsePlaybackContext';
import { getDisplayWord } from '../../utils/words';

export function WordCards() {
  const {
    words, hideList, cardsVisible, cardFontPx,
    trailReveal, addFlaggedWord,
  } = useMorseApp();
  const { currentIndex, maxRevealedTrail } = usePlaybackState();
  const { setWordIndex } = useMorsePlaybackControls();

  if (!cardsVisible || words.length === 0) return null;

  return (
    <section aria-label="Cards" className="col">
      <div className="row gx-2 gy-2">
        {words.map((word, index) => {
          const isCurrent = index === currentIndex;
          const isLast = index === words.length - 1;
          const btnClass = isCurrent
            ? (isLast ? 'btn-danger' : 'btn-primary')
            : (isLast ? 'btn-outline-danger' : 'btn-outline-primary');
          const label = getDisplayWord(word);
          const revealed = !hideList || (trailReveal && index <= maxRevealedTrail);
          const display = revealed
            ? label
            : 'X'.repeat(label.replace(/\r/g, '').replace(/\n/g, '').trim().length);

          return (
            <div key={`${word}-${index}`} className="col-auto">
              <button
                type="button"
                className={`btn ${btnClass}`}
                title="Adds this text to the Flagged Cards text area"
                aria-selected={isCurrent}
                onClick={() => addFlaggedWord(word)}
                onDoubleClick={() => setWordIndex(index)}
              >
                <span style={{ fontSize: `${cardFontPx}px` }}>{display}</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
