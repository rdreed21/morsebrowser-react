import { useState, type MouseEvent } from 'react';
import {
  buildSpeedRacerPreview, parseMultipliers, speedRacerSpeakLabel,
} from '@morsebrowser/core';
import { useMorseApp } from '../../context/MorseAppContext';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { shouldBlurSpeedRacerAction } from '../../utils/voicePlayback';
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
    speedRacerEnabled, setSpeedRacerEnabled,
    speedRacerMultipliers, setSpeedRacerMultipliers,
    speedRacerFinalPlay, setSpeedRacerFinalPlay,
    speedRacerSpeakBeforeReplay, setSpeedRacerSpeakBeforeReplay,
    resetSpeedRacerDefaults, applyOverlearnSpeedRacer, expandVoiceOptionsAccordionIfClosed,
    charWPM,
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
  const speedRacerPreview = buildSpeedRacerPreview(
    charWPM,
    speedRacerMultipliers,
    speedRacerFinalPlay,
    speedRacerSpeakBeforeReplay,
  );
  const speedRacerMultipliersEmpty = parseMultipliers(speedRacerMultipliers).length === 0;
  const [speedRacerAdvancedOpen, setSpeedRacerAdvancedOpen] = useState(false);

  const blurIfPointerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (shouldBlurSpeedRacerAction(event)) {
      event.currentTarget.blur();
    }
  };

  const onSpeedRacerEnabledChange = (v: boolean) => {
    setSpeedRacerEnabled(v);
    if (v) {
      expandVoiceOptionsAccordionIfClosed();
    }
  };

  const onSpeedRacerSpeakChange = (v: boolean) => {
    expandVoiceOptionsAccordionIfClosed();
    setSpeedRacerSpeakBeforeReplay(v);
  };

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
                        <span className="input-group-text">
                          <label htmlFor="lessonsOverrideMax">Max</label>
                          &nbsp;
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary p-1"
                            aria-label="Sync minimum and maximum size"
                            aria-pressed={syncSize}
                            title={syncSize ? 'Minimum and maximum size are synced' : 'Minimum and maximum size are independent'}
                            onClick={() => setSyncSize(!syncSize)}
                          >
                            <img
                              aria-hidden="true"
                              alt=""
                              src={getMorseImageSrc(syncSize ? 'lockImage' : 'unlockImage')}
                            />
                          </button>
                        </span>
                        <input
                          id="lessonsOverrideMax"
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

            <fieldset className="morse-settings-fieldset">
              <legend className="morse-settings-legend">Timing</legend>
              <div className="settings-inline-row d-flex flex-wrap gap-2 align-items-start">
                {/* Speed Intervals */}
                <div className="input-group flex-wrap speed-interval-input-group">
                  <div className="col-auto">
                    <SettingsCheckToggle
                      id="btncheckspeedinterval"
                      label="Speed Intervals"
                      icon="rocketTakeoffImage"
                      checked={speedInterval}
                      onChange={setSpeedInterval}
                      ariaLabel="Speed Intervals"
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

                {/* Repeats */}
                <div className="input-group flex-wrap">
                  <div className="col-md-auto">
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
                        step={0.25}
                        title="Extra spacing between repeats, in wordspaces. Adjustable in 0.25 steps. Also controls the gap between Speed Racer repeats; while racing, 0 falls back to a 1-wordspace gap."
                        value={speakFirstAdditionalWordspaces}
                        onChange={e => setSpeakFirstAdditionalWordspaces(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Speed Racer */}
                <div className="input-group flex-wrap speed-racer-input-group">
                  <div className="col-auto">
                    <SettingsCheckToggle
                      id="btncheckspeedracer"
                      label="Speed Racer"
                      icon="speedometerImage"
                      checked={speedRacerEnabled}
                      onChange={onSpeedRacerEnabledChange}
                      ariaLabel="Speed Racer"
                    />
                    <p id="speedRacerHelp" className="sr-only">
                      Speed Racer plays each card more than once at different speeds. It cannot be used with Speed Intervals.
                    </p>
                  </div>

                  {speedRacerEnabled && speedRacerPreview && (
                    <span
                      className="input-group-text speed-racer-sequence-preview"
                      title="Per-card sequence based on your character speed and Speed Racer steps."
                    >
                      <strong>Sequence:</strong>&nbsp;{speedRacerPreview}
                    </span>
                  )}

                  {speedRacerEnabled && (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      aria-expanded={speedRacerAdvancedOpen}
                      aria-controls="speedRacerAdvanced"
                      aria-describedby="speedRacerAdvancedHelp"
                      title="Show advanced Speed Racer speed and timing controls."
                      onClick={() => setSpeedRacerAdvancedOpen(open => !open)}
                    >
                      Advanced
                    </button>
                  )}
                  <p id="speedRacerAdvancedHelp" className="sr-only">
                    Shows extra Speed Racer choices for speed steps, replay, spoken recap timing, and preset shortcuts.
                  </p>

                  {speedRacerEnabled && speedRacerMultipliersEmpty && (
                    <span
                      className="input-group-text text-warning"
                      role="alert"
                      title="Speed Racer needs at least one non-zero multiplier."
                    >
                      <img
                        width={16}
                        height={16}
                        alt=""
                        src={getMorseImageSrc('exclamationoctagonImage')}
                      />
                      &nbsp;Set at least one non-zero multiplier
                    </span>
                  )}
                </div>

                {/* Speed Racer advanced (collapsed) */}
                {speedRacerEnabled && (
                  <div
                    id="speedRacerAdvanced"
                    className={`collapse col-12 mt-2${speedRacerAdvancedOpen ? ' show' : ''}`}
                  >
                    <div className="morse-settings-subfieldset speed-racer-advanced-panel">
                      <div className="input-group flex-wrap mb-2">
                        <label
                          htmlFor="speedRacerMultipliers"
                          className="input-group-text"
                          title="Comma-separated multipliers applied to your main WPM. Each non-zero entry adds one variation play. Default: 1.5, 1.35, 1.175, 1.0. Use 0 to skip a slot."
                        >
                          Multipliers
                        </label>
                        <input
                          id="speedRacerMultipliers"
                          type="text"
                          className="form-control morse-settings-text-short speed-racer-multipliers-input"
                          aria-describedby="speedRacerMultipliersHelp"
                          title="Comma-separated multipliers (e.g. 1.5, 1.35, 1.175, 1.0). Each non-zero value plays the card once at round(mainWpm * multiplier). 0 = skip."
                          value={speedRacerMultipliers}
                          onChange={e => setSpeedRacerMultipliers(e.target.value)}
                        />
                        <p id="speedRacerMultipliersHelp" className="sr-only">
                          Enter the speed steps separated by commas. For example, 1.5 is faster than your character speed, and 1.0 is your character speed. Zero skips a step.
                        </p>
                        <span className="input-group-text small text-muted">
                          Default: 1.5, 1.35, 1.175, 1.0
                        </span>
                      </div>

                      <div
                        className="settings-lesson-control-strip mb-2"
                        aria-label="Speed Racer replay and timing options"
                      >
                        <div className="settings-lesson-control">
                          <SettingsCheckToggle
                            id="speedRacerFinalPlay"
                            label="Replay at First Multiplier"
                            icon="repeatImage"
                            checked={speedRacerFinalPlay}
                            onChange={setSpeedRacerFinalPlay}
                            ariaLabel="Replay at First Multiplier"
                          />
                        </div>
                        <div className="settings-lesson-control">
                          <SettingsCheckToggle
                            id="speedRacerSpeakBeforeReplay"
                            label={speedRacerSpeakLabel(speedRacerFinalPlay)}
                            icon="chatquoteImage"
                            checked={speedRacerSpeakBeforeReplay}
                            onChange={onSpeedRacerSpeakChange}
                          />
                        </div>
                      </div>

                      <div
                        className="settings-lesson-control-strip"
                        aria-label="Speed Racer preset shortcuts"
                      >
                        <div className="settings-lesson-control">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Restore Multipliers, Replay at First Multiplier, and Speak Before Replay to their defaults (1.5, 1.35, 1.175, 1.0; all on)."
                            onClick={event => {
                              resetSpeedRacerDefaults();
                              blurIfPointerClick(event);
                            }}
                          >
                            <img
                              height={16}
                              width={16}
                              alt=""
                              src={getMorseImageSrc('bootstrapRebootImage')}
                            />
                            &nbsp;Reset to defaults
                          </button>
                        </div>
                        <div className="settings-lesson-control">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            title="Set Multipliers to 1.348, 1.174, 1.0 (fast→slow, ratios of 31/27/23 wpm with 23 as base) and turn off Replay at First Multiplier and Speak Before Replay."
                            onClick={event => {
                              applyOverlearnSpeedRacer();
                              blurIfPointerClick(event);
                            }}
                          >
                            Overlearn
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </fieldset>

            <NoiseSettingsGroup />

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
