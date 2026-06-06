export interface MorseTimingConfig {
  charWPM:       number; // character speed
  effectiveWPM:  number; // spacing speed (Farnsworth)
  frequency:     number; // Hz — dit tone (KO ditFrequency)
  ditFrequency?: number; // Hz — when set, used for dits instead of frequency
  dahFrequency?: number; // Hz — when set, used for dahs instead of frequency
  volume:        number; // 0.0–1.0
  rampTime:      number; // seconds, prevents click artifacts
}
export interface MorseSettings {
  timing:   MorseTimingConfig;
  lessonId: string;
}
export interface Lesson {
  id:          string;
  name:        string;
  characters:  string[];
  wordFile?:   string;
}
export interface LessonResult {
  char:      string;
  expected:  string;
  correct:   boolean;
  timestamp: number;
}
