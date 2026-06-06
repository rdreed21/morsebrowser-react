import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';
import { SettingsCheckToggle } from '../shared/SettingsCheckToggle';
import { NoiseSettingsGroup } from './NoiseSettingsGroup';

export function LessonOptionsPanel() {
  const {
    ifCustomGroup, setIfCustomGroup, customGroup, setCustomGroup,
    ifOverrideTime, setIfOverrideTime, overrideMins, setOverrideMins,
    ifOverrideMinMax, setIfOverrideMinMax, overrideMin, setOverrideMin,
    overrideMax, setOverrideMax, syncSize, setSyncSize,
    applyEnabled, applyLesson,
    randomizeLessons, setRandomizeLessons,
    autoCloseLessonAccordion, setAutoCloseLessonAccordion,
    ifStickySets, setIfStickySets, stickySets, setStickySets,
    newlineChunking, setNewlineChunking,
    shuffleIntraGroup, setShuffleIntraGroup,
    speedInterval, setSpeedInterval,
    intervalTimingsText, setIntervalTimingsText,
    intervalWpmText, setIntervalWpmText,
    intervalFwpmText, setIntervalFwpmText,
    numberOfRepeats, setNumberOfRepeats,
    speakFirstAdditionalWordspaces, setSpeakFirstAdditionalWordspaces,
    trailReveal, setTrailReveal,
    trailPreDelay, setTrailPreDelay,
    trailPostDelay, setTrailPostDelay,
    trailFinal, setTrailFinal,
  } = useMorseApp();

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.lessonOptions}
      headingId="headinglessonoptions"
      buttonId="moreSettingsAccordionButton"
      title={(
        <>
          <img id="gearImage" height={20} width={20} alt="" src={getMorseImageSrc('gearImage')} />
          <span>&nbsp;Lesson Options</span>
        </>
      )}
    >
      <div className="settings-group-panel settings-lesson-options-panel d-flex flex-column gap-3">
            <fieldset className="morse-settings-fieldset">
              <legend className="morse-settings-legend">Overrides</legend>
              <div
                className="settings-lesson-control-strip"
                aria-label="Overrides; press Apply to reload practice text"
              >
                <p role="note" className="sr-only">
                  Custom Group, Override Time, and Override Size take effect when Apply is pressed.
                </p>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheckcustomgroup"
                    label="Custom Group"
                    checked={ifCustomGroup}
                    onChange={setIfCustomGroup}
                  />
                  {ifCustomGroup && (
                    <input
                      type="text"
                      className="form-control morse-settings-text-short"
                      aria-label="Custom group text"
                      value={customGroup}
                      onChange={e => setCustomGroup(e.target.value)}
                    />
                  )}
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheck2"
                    label="Override Time"
                    checked={ifOverrideTime}
                    onChange={setIfOverrideTime}
                  />
                  {ifOverrideTime && (
                    <div className="input-group">
                      <span className="input-group-text" aria-hidden="true">Mins</span>
                      <input
                        type="number"
                        className="form-control morse-settings-num"
                        aria-label="minutes"
                        min={0}
                        value={overrideMins}
                        onChange={e => setOverrideMins(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheck2overridesize"
                    label="Override Size"
                    checked={ifOverrideMinMax}
                    onChange={setIfOverrideMinMax}
                  />
                  {ifOverrideMinMax && (
                    <>
                      <div className="input-group">
                        <span className="input-group-text" aria-hidden="true">Min</span>
                        <input
                          type="number"
                          className="form-control morse-settings-num"
                          aria-label="Minimum"
                          min={1}
                          value={overrideMin}
                          onChange={e => setOverrideMin(Number(e.target.value))}
                        />
                      </div>
                      <div className="input-group">
                        <span
                          role="checkbox"
                          aria-label="Sync minimum and maximum size"
                          aria-checked={syncSize}
                          className="input-group-text"
                          onClick={() => setSyncSize(!syncSize)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSyncSize(!syncSize); }}
                          tabIndex={0}
                        >
                          Max&nbsp;
                          <img
                            aria-hidden="true"
                            alt=""
                            src={getMorseImageSrc(syncSize ? 'lockImage' : 'unlockImage')}
                          />
                        </span>
                        <input
                          type="number"
                          className="form-control morse-settings-num"
                          aria-label="Maximum"
                          min={overrideMin}
                          disabled={syncSize}
                          value={overrideMax}
                          onChange={e => setOverrideMax(Number(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="settings-lesson-control">
                  <button
                    type="button"
                    className="btn btn-primary"
                    id="btnApply"
                    disabled={!applyEnabled}
                    onClick={() => void applyLesson()}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </fieldset>

            <fieldset className="morse-settings-fieldset">
              <legend className="morse-settings-legend">Playback</legend>
              <div className="settings-lesson-control-strip" aria-label="Playback options; effective immediately">
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheck1"
                    label="Randomize"
                    checked={randomizeLessons}
                    onChange={setRandomizeLessons}
                  />
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheckautoclose"
                    label="Auto Close"
                    checked={autoCloseLessonAccordion}
                    onChange={setAutoCloseLessonAccordion}
                  />
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btncheck2stickysetstoggle"
                    label="Sticky Sets"
                    checked={ifStickySets}
                    onChange={setIfStickySets}
                  />
                  {ifStickySets && (
                    <input
                      type="text"
                      className="form-control morse-settings-text-short"
                      aria-label="Sticky set text"
                      value={stickySets}
                      onChange={e => setStickySets(e.target.value)}
                    />
                  )}
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btnchecknewlinechunking"
                    label="Keep Lines"
                    checked={newlineChunking}
                    onChange={setNewlineChunking}
                  />
                </div>
                <div className="settings-lesson-control">
                  <SettingsCheckToggle
                    id="btnshuffleintragroup"
                    label="Shuffle Intra-group"
                    checked={shuffleIntraGroup}
                    onChange={setShuffleIntraGroup}
                  />
                </div>
              </div>
            </fieldset>

            <NoiseSettingsGroup />

            <fieldset className="morse-settings-fieldset">
              <legend className="morse-settings-legend">Timing</legend>
              <div className="settings-inline-row d-flex flex-wrap gap-2 align-items-start">
                <div className="input-group flex-wrap speed-interval-input-group">
                  <div className="col-auto">
                    <SettingsCheckToggle
                      id="btncheckspeedinterval"
                      label="Speed Intervals"
                      checked={speedInterval}
                      onChange={setSpeedInterval}
                    />
                  </div>
                  {speedInterval && (
                    <>
                      <label htmlFor="intervalTimingsText" className="input-group-text">
                        Timings&nbsp;
                        <img height={20} width={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                      </label>
                      <input
                        id="intervalTimingsText"
                        type="text"
                        className="form-control morse-settings-text-interval"
                        title="Comma-separated interval durations"
                        value={intervalTimingsText}
                        onChange={e => setIntervalTimingsText(e.target.value)}
                      />
                      <label htmlFor="intervalWpmText" className="input-group-text">WPM&nbsp;</label>
                      <input
                        id="intervalWpmText"
                        type="text"
                        className="form-control morse-settings-text-interval"
                        title="Comma-separated character WPM speeds for each interval"
                        value={intervalWpmText}
                        onChange={e => setIntervalWpmText(e.target.value)}
                      />
                      <label htmlFor="intervalFwpmText" className="input-group-text">FWPM&nbsp;</label>
                      <input
                        id="intervalFwpmText"
                        type="text"
                        className="form-control morse-settings-text-interval"
                        title="Comma-separated FWPM speeds for each interval"
                        value={intervalFwpmText}
                        onChange={e => setIntervalFwpmText(e.target.value)}
                      />
                    </>
                  )}
                </div>
                <div className="input-group flex-wrap">
                  <label htmlFor="numberOfRepeats" className="input-group-text">
                    Repeats&nbsp;
                    <img width={20} height={20} alt="" src={getMorseImageSrc('repeatImage')} />
                  </label>
                  <input
                    id="numberOfRepeats"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={10}
                    step={1}
                    value={numberOfRepeats}
                    onChange={e => setNumberOfRepeats(Number(e.target.value))}
                  />
                  <label htmlFor="speakFirstAdditionalWordspaces" className="input-group-text">
                    Repeat Spacing
                    <img width={20} height={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                  </label>
                  <input
                    id="speakFirstAdditionalWordspaces"
                    type="number"
                    className="form-control morse-settings-num"
                    min={0}
                    max={10}
                    step={1}
                    value={speakFirstAdditionalWordspaces}
                    onChange={e => setSpeakFirstAdditionalWordspaces(Number(e.target.value))}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="morse-settings-fieldset">
              <legend className="morse-settings-legend">Trail</legend>
              <div
                className="input-group flex-wrap trail-settings-row"
                title="Automatic card revealing"
              >
                <input
                  type="checkbox"
                  className="btn-check"
                  id="btntrailReveal"
                  autoComplete="off"
                  checked={trailReveal}
                  title="Reveals hidden cards after they have been played"
                  onChange={e => setTrailReveal(e.target.checked)}
                />
                <label className="btn btn-outline-primary" htmlFor="btntrailReveal">
                  <span>Trail&nbsp;</span>
                  <img
                    height={20}
                    width={20}
                    alt=""
                    src={getMorseImageSrc(trailReveal ? 'eyeImage' : 'eyeslashImage')}
                  />
                </label>
                <label htmlFor="trailPreDelay" className="input-group-text">
                  Pre&nbsp;
                  <img height={20} width={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                </label>
                <input
                  id="trailPreDelay"
                  type="number"
                  className="form-control morse-settings-num"
                  min={0}
                  step={0.25}
                  disabled={!trailReveal}
                  title="Delay before revealing a card upon playback"
                  value={trailPreDelay}
                  onChange={e => setTrailPreDelay(Number(e.target.value))}
                />
                <label htmlFor="trailPostDelay" className="input-group-text">
                  Post&nbsp;
                  <img height={20} width={20} alt="" src={getMorseImageSrc('stopwatchImage')} />
                </label>
                <input
                  id="trailPostDelay"
                  type="number"
                  className="form-control morse-settings-num"
                  min={0}
                  step={0.25}
                  disabled={!trailReveal}
                  title="Delay after revealing a card upon playback"
                  value={trailPostDelay}
                  onChange={e => setTrailPostDelay(Number(e.target.value))}
                />
                <label htmlFor="trailFinal" className="input-group-text">
                  Final&nbsp;
                  <img alt="" src={getMorseImageSrc('stopwatchImage')} />
                </label>
                <input
                  id="trailFinal"
                  type="number"
                  className="form-control morse-settings-num"
                  min={0}
                  step={0.25}
                  disabled={!trailReveal}
                  title="Delay after revealing the final card upon playback"
                  value={trailFinal}
                  onChange={e => setTrailFinal(Number(e.target.value))}
                />
              </div>
            </fieldset>
          </div>
    </SettingsAccordionItem>
  );
}
