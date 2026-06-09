import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMorseApp } from '../context/MorseAppContext';
import { useMorsePlaybackControls } from '../context/MorsePlaybackContext';

export interface RssItem {
  id: string;          // unique key for dedup and mark-played
  text: string;        // what to pass to playPracticeFromText
  articleId: string;   // article headline — groups headline + its sentences
  isHeadline: boolean;
  played: boolean;
}

const DEFAULT_FEED = 'https://www.arrl.org/news/rss/';
// Production builds set VITE_RSS_PROXY to the deployed CORS proxy (e.g. the
// Cloudflare Worker). Falls back to a local proxy for `vite dev`.
const DEFAULT_PROXY = import.meta.env.VITE_RSS_PROXY ?? 'http://127.0.0.1:8085/';

function parseDescriptionToSentences(rawHtml: string, articleId: string): RssItem[] {
  const htmlDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const paragraphEls = Array.from(htmlDoc.querySelectorAll('p'))
    .map(p => p.textContent?.trim() ?? '')
    .filter(Boolean);

  // Fall back to the full body text as one paragraph if no <p> tags
  const paragraphs = paragraphEls.length > 0
    ? paragraphEls
    : [(htmlDoc.body.textContent ?? '').trim()].filter(Boolean);

  const items: RssItem[] = [];
  paragraphs.forEach((para, pIdx) => {
    // Split on sentence-ending punctuation followed by whitespace
    const sentences = para
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3);
    sentences.forEach((sentence, sIdx) => {
      items.push({
        id: `${articleId}|p${pIdx}s${sIdx}`,
        text: sentence,
        articleId,
        isHeadline: false,
        played: false,
      });
    });
  });
  return items;
}

export function useRssPlugin() {
  const {
    rssFeedUrl, setRssFeedUrl,
    proxyUrl, setProxyUrl,
    rssPollMins, setRssPollMins,
    rssPlayMins, setRssPlayMins,
    rssFullArticle, setRssFullArticle,
    isPlaying,
  } = useMorseApp();
  const { lastFullPlayTimeMs, playPracticeFromText } = useMorsePlaybackControls();

  const [titlesQueue, setTitlesQueue] = useState<RssItem[]>([]);
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

  // In headlines mode count unplayed headlines; in full-article mode count
  // distinct articles (articleId) that have any unplayed card.
  const unreadCount = useMemo(() => {
    if (rssFullArticle) {
      const unread = new Set(titlesQueue.filter(t => !t.played).map(t => t.articleId));
      return unread.size;
    }
    return titlesQueue.filter(t => !t.played && t.isHeadline).length;
  }, [titlesQueue, rssFullArticle]);

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
    playTimerRef.current = setTimeout(() => rssPlayTickRef.current(false), 5_000);
  }, []);

  const rssPlayTickRef = useRef<(ignoreWait: boolean) => void>(() => {});
  rssPlayTickRef.current = (ignoreWait: boolean) => {
    if (!rssPlayOnRef.current) return;

    const minSince = (Date.now() - lastFullPlayTimeMsRef.current) / 1000 / 60;
    const enoughWait = minSince > rssPlayMins;

    if (!isPlayingRef.current) {
      if (enoughWait || ignoreWait) {
        setRssMinsToWait(-1);
        // In headlines mode skip sentence cards so they stay unplayed and
        // will play if the user later switches to full-article mode.
        const target = titlesQueueRef.current.find(
          t => !t.played && (rssFullArticle || t.isHeadline),
        );
        if (target) {
          setTitlesQueue(prev => prev.map(t => (
            t.id === target.id ? { ...t, played: true } : t
          )));
          playPracticeFromText(target.text);
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
        const resp = await fetch(fetchUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
        const xml = await resp.text();
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const parseErr = doc.querySelector('parsererror');
        if (parseErr) throw new Error(`XML parse error: ${parseErr.textContent ?? ''}`);

        // RSS 2.0 uses <item>, Atom uses <entry>
        const nodes = Array.from(doc.querySelectorAll('item, entry'));
        const rawItems = nodes
          .map(n => ({
            title: n.querySelector('title')?.textContent?.trim() ?? '',
            description: n.querySelector('description')?.textContent?.trim() ?? '',
          }))
          .filter(i => i.title)
          .reverse(); // oldest first so newest arrives at the end of the queue

        setTitlesQueue(prev => {
          const next = [...prev];
          rawItems.forEach(({ title, description }) => {
            const headlineId = `headline|${title}`;
            if (next.some(t => t.id === headlineId)) return; // already queued
            next.push({ id: headlineId, text: title, articleId: title, isHeadline: true, played: false });
            if (rssFullArticle && description) {
              next.push(...parseDescriptionToSentences(description, title));
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
    // Flip the ref synchronously before kicking off the tick — the tick guards on
    // rssPollingOnRef.current, and the state update alone wouldn't commit until after
    // the next render, causing the guard to bail on the first click.
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
    rssFullArticle,
    setRssFullArticle,
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
