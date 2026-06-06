import { useCallback, useState } from 'react';
import { renderMorseWav } from '@morsebrowser/core';
import { useMorseApp } from '../context/MorseAppContext';
import { getDisplayWord } from '../utils/words';
import { downloadBlob } from '../utils/downloadBlob';

export function useWavDownload() {
  const {
    words, timingConfig, preSpace, xtraWordSpaceDits, showingText,
  } = useMorseApp();
  const [downloading, setDownloading] = useState(false);

  const downloadWav = useCallback(async () => {
    if (!showingText.trim() || words.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const allWords = words.map(w => getDisplayWord(w).replace(/\n/g, ' ')).join(' ');
      const wav = await renderMorseWav(allWords, timingConfig, {
        prePaddingSeconds: preSpace,
        extraTrailingDitUnits: Math.max(0, (xtraWordSpaceDits - 1) * 7),
        trimLastWordSpace: true,
      });
      downloadBlob(new Blob([wav], { type: 'audio/wav' }), 'morse.wav');
    } finally {
      setDownloading(false);
    }
  }, [showingText, words, timingConfig, preSpace, xtraWordSpaceDits, downloading]);

  return { downloadWav, downloading };
}
