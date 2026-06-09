import { useRssPlugin } from '../../hooks/useRssPlugin';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';

const PRESET_FEEDS = [
  { label: 'ARRL News', url: 'https://www.arrl.org/news/rss/' },
  { label: 'Fox News', url: 'https://moxie.foxnews.com/feedburner/latest.xml' },
  { label: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
];
const CUSTOM_VALUE = '__custom__';

export function RssAccordion() {
  const rss = useRssPlugin();

  const isCustom = !PRESET_FEEDS.some(f => f.url === rss.rssFeedUrl);

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.rss}
      headingId="headingOne"
      buttonId="btnRssAccordionButton"
      title={(
        <span>
          <img height={20} width={20} alt="" src={getMorseImageSrc('rssImage')} />
          &nbsp;RSS (Experimental)
          <span>&nbsp;</span>
          <span className={`badge ${rss.rssPollingOn ? 'bg-success' : 'bg-danger'}`}>
            {rss.rssPollingOn ? rss.pollRssButtonText.replace(/ Waiting.*/, '') : 'No Polling'}
          </span>
          <span className="badge bg-success">
            {`Unread: ${rss.unreadCount}`}
          </span>
          <span className={`badge ${rss.rssPlayOn ? 'bg-success' : 'bg-danger'}`}>
            {rss.rssPlayOn
              ? (rss.rssPlayWaitingBadgeText || 'Playing...')
              : 'Play Off'}
          </span>
        </span>
      )}
    >
      <div className="row row-cols-3 gy-2 gx-2">
            <div className="col-auto">
              <div className="input-group-vertical">
                <span className="input-group-text">RSS Feed</span>
                <select
                  className="form-select"
                  style={{ width: 300 }}
                  aria-label="RSS feed"
                  value={isCustom ? CUSTOM_VALUE : rss.rssFeedUrl}
                  onChange={e => {
                    if (e.target.value !== CUSTOM_VALUE) {
                      rss.setRssFeedUrl(e.target.value);
                    }
                    // Selecting "Custom URL…" keeps current URL visible in the text field below
                  }}
                >
                  {PRESET_FEEDS.map(f => (
                    <option key={f.url} value={f.url}>{f.label}</option>
                  ))}
                  <option value={CUSTOM_VALUE}>Custom URL…</option>
                </select>
                {isCustom && (
                  <input
                    type="text"
                    className="form-control"
                    aria-label="Custom RSS URL"
                    style={{ width: 300 }}
                    value={rss.rssFeedUrl}
                    onChange={e => rss.setRssFeedUrl(e.target.value)}
                    placeholder="https://example.com/feed.xml"
                  />
                )}
                <span className="input-group-text">Proxy Url</span>
                <input
                  type="text"
                  className="form-control"
                  aria-label="Proxy"
                  value={rss.proxyUrl}
                  onChange={e => rss.setProxyUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="col-auto" style={{ width: 75 }}>
              <div className="input-group-vertical">
                <span className="input-group-text">
                  Poll&nbsp;
                  <img height={15} width={15} alt="" src={getMorseImageSrc('hourglassImage')} />
                </span>
                <input
                  type="number"
                  className="form-control"
                  aria-label="Poll"
                  value={rss.rssPollMins}
                  onChange={e => rss.setRssPollMins(Number(e.target.value))}
                />
                <span className="input-group-text">
                  Play&nbsp;
                  <img height={15} width={15} alt="" src={getMorseImageSrc('hourglassImage')} />
                </span>
                <input
                  type="number"
                  className="form-control"
                  aria-label="Play"
                  value={rss.rssPlayMins}
                  onChange={e => rss.setRssPlayMins(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-auto">
              <div className="btn-toolbar" role="toolbar">
                <button type="button" className="btn btn-success" onClick={rss.doRSS}>
                  {rss.pollRssButtonText}
                </button>
                <button type="button" className="btn btn-secondary" onClick={rss.doRssPlay}>
                  {rss.playRssButtonText}
                </button>
                <button type="button" className="btn btn-danger" onClick={rss.doRSSReset}>
                  Mark All Read
                </button>
              </div>
              <div className="btn-group mt-2" role="group" aria-label="Article mode">
                <input
                  type="radio"
                  className="btn-check"
                  name="rssMode"
                  id="rssHeadlines"
                  checked={!rss.rssFullArticle}
                  onChange={() => rss.setRssFullArticle(false)}
                />
                <label className="btn btn-outline-primary btn-sm" htmlFor="rssHeadlines">
                  Headlines
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="rssMode"
                  id="rssFullArticle"
                  checked={rss.rssFullArticle}
                  onChange={() => rss.setRssFullArticle(true)}
                />
                <label className="btn btn-outline-primary btn-sm" htmlFor="rssFullArticle">
                  Headlines + Article
                </label>
              </div>
            </div>
          </div>
    </SettingsAccordionItem>
  );
}
