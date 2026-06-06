import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export function WorkingTextStats() {
  const { playingTime, charsPlayed, charCount } = useMorseApp();

  return (
    <section className="col working-text-section" title="Working text" aria-label="Working text">
      <div className="working-text-layout">
        <div className="working-text-stats" aria-live="polite">
          <div className="working-text-stat-row">
            <span id="play-time-label" className="working-text-stat-label">Play</span>
            <span className="working-text-stat-value" aria-describedby="play-time-label">
              <img alt="" height={15} width={15} src={getMorseImageSrc('stopwatchImage')} />
              <span>{playingTime.minutes}</span>:<span>{playingTime.normedSeconds}</span>
            </span>
          </div>
          <div className="working-text-stat-row">
            <span id="characters-played-label" className="working-text-stat-label">Chars</span>
            <span className="working-text-stat-value" aria-describedby="characters-played-label">
              <span>{charsPlayed}</span>/<span>{charCount}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
