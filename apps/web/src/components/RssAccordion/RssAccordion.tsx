import { useRssPlugin } from '../../hooks/useRssPlugin';
import { getMorseImageSrc } from '../../utils/morseImages';
import { SETTINGS_ACCORDION_IDS } from '../../utils/settingsAccordion';
import { SettingsAccordionItem } from '../shared/SettingsAccordionItem';

export function RssAccordion() {
  const rss = useRssPlugin();

  return (
    <SettingsAccordionItem
      panelId={SETTINGS_ACCORDION_IDS.rss}
      headingId="headingOne"
      buttonId="btnRssAccordionButton"
      title={(
        <span>
          <img height={20} width={20} alt="" src={getMorseImageSrc('rssImage')} />
          &nbsp;RSS (Experimental, and you will need a proxy)
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
                <span className="input-group-text">RSS Url</span>
                <input
                  type="text"
                  className="form-control"
                  aria-label="RSS"
                  style={{ width: 300 }}
                  value={rss.rssFeedUrl}
                  onChange={e => rss.setRssFeedUrl(e.target.value)}
                />
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
            </div>
          </div>
    </SettingsAccordionItem>
  );
}
