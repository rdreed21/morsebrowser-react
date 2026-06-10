import { useMorseApp } from '../../context/MorseAppContext';
import { usePlaybackState } from '../../context/PlaybackStateContext';
import { useMorsePlaybackControls } from '../../context/MorsePlaybackContext';
import { getMorseImageSrc } from '../../utils/morseImages';

export function PlaybackControls() {
  const {
    hideList, setHideList,
    isShuffled, shuffleWords, loop, loopNoShuffle,
    manualVoice, voiceEnabled,
  } = useMorseApp();
  const { isPlaying, isPaused, playingTime } = usePlaybackState();

  const {
    handlePlay, handlePause, handleStop, toggleLoop, speakVoiceBuffer,
  } = useMorsePlaybackControls();

  const showVoiceRecap = manualVoice && voiceEnabled;

  const loopLabel = !loop ? 'Loop Off' : loopNoShuffle ? 'Loop On' : 'Loop Shuffle';

  return (
    <section className="col playback-controls" aria-label="Playback controls">
      <div className="d-flex flex-wrap gap-2 align-items-center w-100">
        <div className="btn-group" role="group">
          <button
            id="btnPlayButton"
            type="button"
            className="btn btn-success"
            aria-label="Play"
            onClick={handlePlay}
          >
            {!isPlaying && <span>Play</span>}
            {isPlaying && (
              <span>
                <span>{playingTime.minutes}</span>:<span>{playingTime.normedSeconds}</span>
              </span>
            )}
            &nbsp;
            {isPlaying && (
              <span className="spinner-border spinner-border-sm" role="status" aria-label="Playing" />
            )}
            {!isPlaying && (
              <img id="playImage" alt="" src={getMorseImageSrc('playImage')} />
            )}
          </button>
          <button
            id="btnPause"
            type="button"
            className="btn btn-info"
            onClick={handlePause}
          >
            Pause&nbsp;
            {isPaused && (
              <span className="spinner-grow spinner-grow-sm text-dark" role="status" aria-hidden="true" />
            )}
            {!isPaused && (
              <img id="pauseImage" height={20} width={20} alt=""
                src={getMorseImageSrc('pauseImage')} />
            )}
          </button>
          <button id="btnStop" type="button" className="btn btn-danger" onClick={handleStop}>
            Stop&nbsp;
            <img id="stopImage" height={20} width={20} alt=""
              src={getMorseImageSrc('stopImage')} />
          </button>
        </div>
        <div className="btn-group" role="group">
          <input
            aria-label="Hide cards"
            type="checkbox"
            className="btn-check"
            id="btnHideList"
            autoComplete="off"
            checked={!hideList}
            onChange={e => setHideList(!e.target.checked)}
          />
          <label aria-hidden="true" className="btn btn-outline-primary" htmlFor="btnHideList">
            <span>Reveal&nbsp;</span>
            <img
              height={20}
              width={20}
              alt=""
              src={getMorseImageSrc(!hideList ? 'eyeImage' : 'eyeslashImage')}
            />
          </label>
        </div>
        <div className="btn-group">
          <button
            id="btnShuffle"
            type="button"
            className="btn btn-secondary"
            onClick={() => shuffleWords()}
          >
            <span>{isShuffled ? 'UnShuffle' : 'Shuffle'}</span>&nbsp;
            <img alt="" id="shuffleImage" height={20} width={20}
              src={getMorseImageSrc('shuffleImage')} />
          </button>
          <button
            id="btnLoop"
            type="button"
            className="btn btn-secondary"
            onClick={toggleLoop}
          >
            <span>{loopLabel}</span>&nbsp;
            <img alt="" height={20} width={20}
              src={getMorseImageSrc('arrowrepeatImage')} />
          </button>
          {showVoiceRecap && (
            <button
              id="btnmanualvoice"
              type="button"
              className="btn btn-info"
              onClick={speakVoiceBuffer}
            >
              <span>Voice Recap</span>&nbsp;
              <img alt="" height={20} width={20}
                src={getMorseImageSrc('bootstrapRebootImage')} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
