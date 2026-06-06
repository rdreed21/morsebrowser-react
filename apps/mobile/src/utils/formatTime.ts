export interface PlayTimeDisplay {
  minutes: number;
  seconds: number;
  normedSeconds: string;
}

export function formatPlayTime(ms: number): PlayTimeDisplay {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const normedSeconds = (seconds < 10 ? '0' : '') + String(seconds);
  return { minutes, seconds, normedSeconds };
}
