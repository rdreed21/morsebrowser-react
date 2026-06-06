/** KO settings accordion panel ids (preserve typo accordianItemLessonControls). */
export const SETTINGS_ACCORDION_IDS = {
  lessons: 'accordianItemLessonControls',
  lessonOptions: 'collapselessonoptions',
  voice: 'collapsevoiceoptions',
  tone: 'collapsetonespacing',
  input: 'collapsecustominput',
  output: 'collapseoutputsettings',
  rss: 'collapseOne',
} as const;

export type SettingsAccordionId =
  typeof SETTINGS_ACCORDION_IDS[keyof typeof SETTINGS_ACCORDION_IDS];

export function createDefaultAccordionOpen(): Record<SettingsAccordionId, boolean> {
  return {
    [SETTINGS_ACCORDION_IDS.lessons]: true,
    [SETTINGS_ACCORDION_IDS.lessonOptions]: false,
    [SETTINGS_ACCORDION_IDS.voice]: false,
    [SETTINGS_ACCORDION_IDS.tone]: false,
    [SETTINGS_ACCORDION_IDS.input]: false,
    [SETTINGS_ACCORDION_IDS.output]: false,
    [SETTINGS_ACCORDION_IDS.rss]: false,
  };
}
