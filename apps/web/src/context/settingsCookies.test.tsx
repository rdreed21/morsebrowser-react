import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useMorseApp, MorseAppProvider } from './MorseAppContext';

/**
 * Settings persist as one cookie per key, matching the KO app's saveCookie
 * extender — including the intentionally misspelled 'proxydUrl' key that
 * existing users' cookies already use.
 */

function SettingsHarness() {
  const app = useMorseApp();
  return (
    <>
      <button type="button" onClick={() => app.setProxyUrl('http://proxy.test/')}>setProxy</button>
      <button type="button" onClick={() => app.setTrailFinal(4)}>setTrailFinal</button>
      <button type="button" onClick={() => app.setRssFeedUrl('http://feed.test/rss')}>setFeed</button>
      <span data-testid="proxyUrl">{app.proxyUrl}</span>
      <span data-testid="trailFinal">{app.trailFinal}</span>
      <span data-testid="rssFeedUrl">{app.rssFeedUrl}</span>
    </>
  );
}

function renderApp() {
  return render(
    <MorseAppProvider>
      <SettingsHarness />
    </MorseAppProvider>,
  );
}

function clearCookies() {
  document.cookie.split(';').forEach(c => {
    const key = c.split('=')[0]?.trim();
    if (key) document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

describe('settings cookie round-trip', () => {
  afterEach(clearCookies);

  it('writes the KO-compatible proxydUrl cookie key', async () => {
    renderApp();
    await act(async () => {
      screen.getByRole('button', { name: 'setProxy' }).click();
    });
    expect(document.cookie).toContain('proxydUrl=');
    expect(document.cookie).not.toContain('proxyUrl=');
  });

  it('settings survive a remount via cookies', async () => {
    const first = renderApp();
    await act(async () => {
      screen.getByRole('button', { name: 'setProxy' }).click();
      screen.getByRole('button', { name: 'setTrailFinal' }).click();
      screen.getByRole('button', { name: 'setFeed' }).click();
    });
    first.unmount();

    renderApp();
    expect(screen.getByTestId('proxyUrl')).toHaveTextContent('http://proxy.test/');
    expect(screen.getByTestId('trailFinal')).toHaveTextContent('4');
    expect(screen.getByTestId('rssFeedUrl')).toHaveTextContent('http://feed.test/rss');
  });

  it('loads a legacy KO proxydUrl cookie on first mount', () => {
    document.cookie = 'proxydUrl=http://legacy.ko/; path=/';
    renderApp();
    expect(screen.getByTestId('proxyUrl')).toHaveTextContent('http://legacy.ko/');
  });
});
