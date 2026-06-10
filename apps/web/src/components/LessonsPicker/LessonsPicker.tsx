import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getUserTargets, getClasses, getLetterGroups, getDisplays,
  loadLessonFile, type WordListOption,
} from '@morsebrowser/core';
import { useMorseApp } from '../../context/MorseAppContext';
import { usePlaybackActions } from '../../context/PlaybackStateContext';
import { usePresets } from '../../hooks/usePresets';
import { useLessonDeepLinks } from '../../hooks/useLessonDeepLinks';
import { getMorseImageSrc } from '../../utils/morseImages';
import { generateRandomPractice, resolvePracticeSeconds } from '../../utils/lessonPractice';
import { upsertLessonQueryParam } from '../../utils/lessonQueryString';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { DropdownPicker } from '../shared/DropdownPicker';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';

export function LessonsPicker() {
  const {
    userTarget, selectedClass, letterGroup, selectedDisplay,
    selectedPreset, setUserTarget, setSelectedClass, setLetterGroup,
    setSelectedDisplay,     setShowingText, setNewlineChunking,
    isQueryStringSettingsOn,
    ifOverrideTime, overrideMins, ifCustomGroup,
    closeLessonAccordionIfAutoClosing,
  } = useMorseApp();
  // Actions-only: this picker never re-renders on playback ticks.
  const { setCurrentIndex } = usePlaybackActions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetsRef = useRef<HTMLDivElement>(null);

  const userTargets = useMemo(() => getUserTargets(), []);
  const classes = useMemo(
    () => (userTarget ? getClasses(userTarget) : []),
    [userTarget],
  );
  const letterGroups = useMemo(
    () => (userTarget && selectedClass ? getLetterGroups(userTarget, selectedClass) : []),
    [userTarget, selectedClass],
  );
  const displays = useMemo(
    () => (userTarget && selectedClass && letterGroup
      ? getDisplays(userTarget, selectedClass, letterGroup)
      : []),
    [userTarget, selectedClass, letterGroup],
  );

  const loadLesson = useCallback(async (option: WordListOption) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loadLessonFile(option.fileName);
      if (result.type === 'text') {
        setShowingText(result.content.trim().replace(/\n/g, option.newlineChunking ? '\n' : ' '));
      } else {
        const practiceSeconds = resolvePracticeSeconds(
          result.config,
          ifOverrideTime,
          overrideMins,
          ifCustomGroup,
        );
        setShowingText(generateRandomPractice({ ...result.config, practiceSeconds }));
      }
      setNewlineChunking(option.newlineChunking);
      setCurrentIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
      closeLessonAccordionIfAutoClosing();
    }
  }, [
    setShowingText, setNewlineChunking, setCurrentIndex,
    ifOverrideTime, overrideMins, ifCustomGroup,
    closeLessonAccordionIfAutoClosing,
  ]);

  const selectedDisplayRef = useRef(selectedDisplay);
  selectedDisplayRef.current = selectedDisplay;

  const loadLessonRef = useRef(loadLesson);
  loadLessonRef.current = loadLesson;

  useLessonDeepLinks(loadLesson);

  const {
    settingsPresets,
    selectedSettingsPreset,
    presetsEnabled,
    selectPresetByDisplay,
    reapplyCurrentPreset,
    saveSettings,
    loadSettingsFromFile,
  } = usePresets(() => {
    const display = selectedDisplayRef.current;
    if (display) void loadLessonRef.current(display);
  });

  const handleDisplaySelect = useCallback((displayName: string) => {
    const option = displays.find(d => d.display === displayName);
    if (!option) return;
    setSelectedDisplay(option);
    if (isQueryStringSettingsOn()) {
      upsertLessonQueryParam('selectedLesson', option.display);
    }
    void loadLesson(option).then(() => reapplyCurrentPreset());
  }, [displays, setSelectedDisplay, loadLesson, reapplyCurrentPreset, isQueryStringSettingsOn]);

  const handleClassSelect = useCallback((v: string) => {
    setSelectedClass(v);
    if (isQueryStringSettingsOn()) {
      upsertLessonQueryParam('selectedClass', v);
    }
  }, [setSelectedClass, isQueryStringSettingsOn]);

  const handleLetterGroupSelect = useCallback((v: string) => {
    setLetterGroup(v);
    if (isQueryStringSettingsOn()) {
      upsertLessonQueryParam('selectedGroup', v);
    }
  }, [setLetterGroup, isQueryStringSettingsOn]);

  const handleLoadSettingsClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSettingsFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadSettingsFromFile(file);
    e.target.value = '';
  }, [loadSettingsFromFile]);

  useEffect(() => {
    if (!presetsOpen) return;
    const close = (e: MouseEvent) => {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setPresetsOpen(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [presetsOpen]);

  const hasSelection = !!selectedDisplay?.display;
  const presetDisplay = selectedSettingsPreset.display || selectedPreset || 'Select preset';

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.lessons}
      headingId="headingLessonControls"
      buttonId="lessonAccordianButton"
      buttonClassName="accordion-button flex-wrap gap-1"
      title={(
        <>
          <img id="bookImage" height={20} width={20} alt="" src={getMorseImageSrc('bookImage')} />
          <span>&nbsp;</span>
          <span>LICW Lessons</span>
          <span>&nbsp;</span>
          {hasSelection ? (
            <span className="badge bg-success lesson-selection-badge">
              <span>Type: </span><span>{userTarget}</span>
              <span>&nbsp; Class: </span><span>{selectedClass}</span>
              <span>&nbsp; Content: </span><span>{letterGroup}</span>
              <span>&nbsp; Lesson: </span><span>{selectedDisplay.display}</span>
              <span>&nbsp; Settings: </span><span>{selectedPreset}</span>
            </span>
          ) : (
            <span className="badge bg-success">(None Currently Selected)</span>
          )}
        </>
      )}
    >
      <div className="row g-2 lessons-picker-row">
            <DropdownPicker
              id="lessonsPickerType"
              label="TYPE"
              value={userTarget}
              placeholder="Select type"
              options={userTargets}
              onSelect={(v) => setUserTarget(v)}
            />
            <DropdownPicker
              id="lessonsPickerClass"
              label="CLASS"
              value={selectedClass}
              placeholder="Select class"
              options={classes}
              disabled={classes.length === 0}
              onSelect={handleClassSelect}
            />
            <DropdownPicker
              id="lessonsPickerContent"
              label="CONTENT"
              value={letterGroup}
              placeholder="Select content"
              options={letterGroups}
              disabled={letterGroups.length === 0}
              onSelect={handleLetterGroupSelect}
            />
            <DropdownPicker
              id="lessonsPickerLesson"
              label="LESSON"
              value={selectedDisplay?.display ?? ''}
              placeholder="Select lesson"
              options={displays.map(d => d.display)}
              disabled={displays.length === 0}
              onSelect={handleDisplaySelect}
            />
            <div className="col-6 col-md-4 col-lg lessons-picker-col">
              <span className="lessons-picker-label" id="lessonsPickerPresetsLabel">PRESETS</span>
              <div
                ref={presetsRef}
                className={`dropdown lessons-picker-dropdown${presetsOpen ? ' show' : ''}`}
              >
                <button
                  id="btnLessonSettingsPresets"
                  type="button"
                  className="btn btn-outline-primary dropdown-toggle w-100"
                  aria-expanded={presetsOpen}
                  aria-haspopup="listbox"
                  aria-labelledby="lessonsPickerPresetsLabel"
                  disabled={!presetsEnabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (presetsEnabled) setPresetsOpen(prev => !prev);
                  }}
                >
                  {presetDisplay}
                </button>
                <ul
                  className={`dropdown-menu w-100${presetsOpen ? ' show' : ''}`}
                  role="listbox"
                  aria-label="PRESETS"
                >
                  {settingsPresets.map(preset => (
                    <li key={preset.filename} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={preset.display === selectedSettingsPreset.display}
                        className={`dropdown-item${preset.display === selectedSettingsPreset.display ? ' active' : ''}`}
                        disabled={!presetsEnabled}
                        onClick={() => {
                          selectPresetByDisplay(preset.display);
                          setPresetsOpen(false);
                        }}
                      >
                        {preset.display}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lessons-preset-actions">
                <button
                  id="saveSettingsButton"
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={!presetsEnabled}
                  onClick={saveSettings}
                >
                  <span>Save</span>
                </button>
                <button
                  id="loadSettingsButton"
                  type="button"
                  className="btn btn-outline-primary"
                  disabled={!presetsEnabled}
                  onClick={handleLoadSettingsClick}
                >
                  <span>Load</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="settingsfiletoread"
                  accept=".json,application/json"
                  className="d-none"
                  onChange={handleSettingsFileChange}
                />
              </div>
            </div>
          </div>
      {loading && <p className="form-text mt-2">Loading lesson…</p>}
      {error && <p className="text-danger form-text mt-2">{error}</p>}
    </SettingsAccordionItem>
  );
}
