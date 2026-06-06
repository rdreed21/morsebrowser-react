/** KO SpeedSettings.getApplicableSpeed — WPM/FWPM from elapsed play time. */

export interface SpeedIntervalConfig {
  charWPM: number;
  effectiveWPM: number;
  speedInterval: boolean;
  intervalTimingsText: string;
  intervalWpmText: string;
  intervalFwpmText: string;
}

export interface ApplicableSpeed {
  charWPM: number;
  effectiveWPM: number;
}

function parseCsvNumbers(text: string, parser: (v: string) => number): number[] {
  return text.split(',').map(s => parser(s.trim())).filter(n => Number.isFinite(n));
}

export function getApplicableSpeed(
  runningPlayMs: number,
  config: SpeedIntervalConfig,
): ApplicableSpeed {
  const {
    charWPM, effectiveWPM, speedInterval, intervalTimingsText,
    intervalWpmText, intervalFwpmText,
  } = config;

  if (!speedInterval || !intervalTimingsText.trim()) {
    return { charWPM, effectiveWPM };
  }

  const totalSeconds = runningPlayMs / 1000;
  const times = parseCsvNumbers(intervalTimingsText, parseFloat);
  if (times.length === 0) {
    return { charWPM, effectiveWPM };
  }

  let runningSum = 0;
  const adjTimes = times.map((t) => {
    runningSum += t;
    return runningSum;
  });

  const wpms = parseCsvNumbers(intervalWpmText, v => parseInt(v, 10));
  const fwpms = parseCsvNumbers(intervalFwpmText, v => parseInt(v, 10));

  let idx = -1;
  adjTimes.forEach((t, i) => {
    if (idx === -1 && totalSeconds < t) {
      idx = i;
    }
  });
  if (idx === -1) {
    idx = Math.max(wpms.length - 1, fwpms.length - 1, 0);
  }

  const wpm = wpms.length - 1 >= idx ? wpms[idx] : wpms[wpms.length - 1] ?? charWPM;
  const fwpm = fwpms.length - 1 >= idx ? fwpms[idx] : fwpms[fwpms.length - 1] ?? effectiveWPM;

  return {
    charWPM: wpm ?? charWPM,
    effectiveWPM: fwpm ?? effectiveWPM,
  };
}
