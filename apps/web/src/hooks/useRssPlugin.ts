import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorsePlaybackControls } from '../context/MorsePlaybackContext';

export interface RssTitle {
  title: string;
  played: boolean;
}

const DEFAULT_FEED = 'https://moxie.foxnews.com/feedburner/latest.xml';
// Production builds set VITE_RSS_PROXY to the deployed CORS proxy (e.g. the
// Cloudflare Worker). Falls back to a local proxy for `vite dev`.
const DEFAULT_PROXY = import.meta.env.VITE_RSS_PROXY ?? 'http://127.0.0.1:8085/';

export function useRssPlugin() {
  const {
    rssFeedUrl, setRssFeedUrl,
    proxyUrl, setProxyUrl,
    rssPollMins, setRssPollMins,
    rssPlayMins, setRssPlayMins,
    isPlaying,
  } = useMorseApp();
  const { lastFullPlayTimeMs, playPracticeFromText } = useMorsePlaybackControls();

  const [titlesQueue, setTitlesQueue] = useState<RssTitle[]>([]);
  const [rssPlayOn, setRssPlayOn] = useState(false);
  const [rssPollingOn, setRssPollingOn] = useState(false);
  const [rssPolling, setRssPolling] = useState(false);
  const [lastPollMs, setLastPollMs] = useState(0);
  const [rssMinsToWait, setRssMinsToWait] = useState(-1);
  const [rssPollMinsToWait, setRssPollMinsToWait] = useState(-1);

  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titlesQueueRef = useRef(titlesQueue);
  const rssPlayOnRef = useRef(rssPlayOn);
  const rssPollingOnRef = useRef(rssPollingOn);
  const rssPollingRef = useRef(rssPolling);
  const lastPollMsRef = useRef(lastPollMs);
  const lastFullPlayTimeMsRef = useRef(lastFullPlayTimeMs);
  const isPlayingRef = useRef(isPlaying);

  titlesQueueRef.current = titlesQueue;
  rssPlayOnRef.current = rssPlayOn;
  rssPollingOnRef.current = rssPollingOn;
  rssPollingRef.current = rssPolling;
  lastPollMsRef.current = lastPollMs;
  lastFullPlayTimeMsRef.current = lastFullPlayTimeMs;
  isPlayingRef.current = isPlaying;

  const unreadCount = useMemo(
    () => titlesQueue.filter(t => !t.played).length,
    [titlesQueue],
  );

  const pollRssButtonText = useMemo(() => {
    let waitingText = '';
    if (rssPollMinsToWait > 0 && rssPollingOn) {
      waitingText = rssPollMinsToWait > 1
        ? ` Waiting ${Math.round(rssPollMinsToWait)} min`
        : ` Waiting ${Math.round(60 * rssPollMinsToWait)} sec`;
    }
    return `${rssPollingOn ? 'Polling' : 'Poll'} RSS${waitingText}`;
  }, [rssPollMinsToWait, rssPollingOn]);

  const rssPlayWaitingBadgeText = useMemo(() => {
    if (rssMinsToWait <= 0 || !rssPlayOn) return '';
    return rssMinsToWait > 1
      ? ` Waiting ${Math.round(rssMinsToWait)} min`
      : ` Waiting ${Math.round(60 * rssMinsToWait)} sec`;
  }, [rssMinsToWait, rssPlayOn]);

  const playRssButtonText = useMemo(() => {
    let waitingText = '';
    if (rssMinsToWait > 0 && rssPlayOn) {
      waitingText = rssMinsToWait > 1
        ? ` Waiting ${Math.round(rssMinsToWait)} min`
        : ` Waiting ${Math.round(60 * rssMinsToWait)} sec`;
    }
    return `${rssPlayOn ? 'Stop' : 'Play'} RSS (${unreadCount})${waitingText}`;
  }, [rssMinsToWait, rssPlayOn, unreadCount]);

  const schedulePlayTick = useCallback(() => {
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    playTimerRef.current = setTimeout(() => rssPlayTickRef.current(false), 20_000);
  }, []);

  const rssPlayTickRef = useRef<(ignoreWait: boolean) => void>(() => {});
  rssPlayTickRef.current = (ignoreWait: boolean) => {
    if (!rssPlayOnRef.current) return;

    const minSince = (Date.now() - lastFullPlayTimeMsRef.current) / 1000 / 60;
    const enoughWait = minSince > rssPlayMins;

    if (!isPlayingRef.current) {
      if (enoughWait || ignoreWait) {
        setRssMinsToWait(-1);
        const target = titlesQueueRef.current.find(t => !t.played);
        if (target) {
          setTitlesQueue(prev => prev.map(t => (
            t.title === target.title ? { ...t, played: true } : t
          )));
          playPracticeFromText(target.title);
        }
      } else {
        setRssMinsToWait(rssPlayMins - minSince);
      }
    }
    schedulePlayTick();
  };

  const doRSSReset = useCallback(() => {
    setTitlesQueue(prev => prev.map(t => ({ ...t, played: true })));
  }, []);

  const pollTickRef = useRef<() => void>(() => {});
  pollTickRef.current = async () => {
    if (!rssPollingOnRef.current || rssPollingRef.current) return;

    const minSince = lastPollMsRef.current === 0
      ? Number.POSITIVE_INFINITY
      : (Date.now() - lastPollMsRef.current) / 1000 / 60;
    const enoughWait = minSince > rssPollMins;

    if (enoughWait) {
      setRssPolling(true);
      setRssPollMinsToWait(-1);
      const fetchUrl = `${proxyUrl}${rssFeedUrl}`;
      try {
        const { default: RSSParser } = await import('rss-parser');
        const parser = new RSSParser();
        const feed = await parser.parseURL(fetchUrl);
        const items = [...(feed.items ?? [])].reverse();
        setTitlesQueue(prev => {
          const next = [...prev];
          items.forEach(entry => {
            const title = entry.title?.trim();
            if (title && !next.some(t => t.title === title)) {
              next.push({ title, played: false });
            }
          });
          return next;
        });
        setLastPollMs(Date.now());
        setRssPollMinsToWait(rssPollMins);
      } catch (err) {
        setLastPollMs(Date.now());
        // eslint-disable-next-line no-console
        console.error('[RSS] fetch failed:', fetchUrl, err);
        window.alert(`RSS error — tried:\n${fetchUrl}\n\n${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setRssPolling(false);
      }
    } else {
      setRssPollMinsToWait(rssPollMins - minSince);
    }

    if (rssPollingOnRef.current) {
      pollTimerRef.current = setTimeout(() => { void pollTickRef.current(); }, 15_000);
    }
  };

  const doRSS = useCallback(() => {
    // Read the live value from the ref (committed state) and flip it. We must
    // update the ref *before* kicking off pollTick, because pollTick guards on
    // rssPollingOnRef.current — if we relied on the state update, the ref would
    // still hold the old `false` and the guard would bail before fetching.
    const next = !rssPollingOnRef.current;
    rssPollingOnRef.current = next;
    setRssPollingOn(next);
    if (next) {
      void pollTickRef.current();
    } else if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
  }, []);

  const doRssPlay = useCallback(() => {
    const next = !rssPlayOnRef.current;
    rssPlayOnRef.current = next;
    setRssPlayOn(next);
    if (next) {
      rssPlayTickRef.current(true);
    } else if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
    }
  }, []);

  useEffect(() => () => {
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  }, []);

  return {
    rssFeedUrl: rssFeedUrl || DEFAULT_FEED,
    setRssFeedUrl,
    proxyUrl: proxyUrl || DEFAULT_PROXY,
    setProxyUrl,
    rssPollMins,
    setRssPollMins,
    rssPlayMins,
    setRssPlayMins,
    unreadCount,
    rssPollingOn,
    rssPlayOn,
    rssPlayWaitingBadgeText,
    pollRssButtonText,
    playRssButtonText,
    doRSS,
    doRssPlay,
    doRSSReset,
  };
}
