/**
 * Tiny CORS proxy for the RSS reader in apps/web.
 *
 * The web app builds requests as `${proxyUrl}${feedUrl}` (see
 * apps/web/src/hooks/useRssPlugin.ts), so this Worker treats everything after
 * its own origin as the upstream feed URL, fetches it, and returns the body
 * with permissive CORS headers.
 *
 *   https://morse-rss-proxy.<sub>.workers.dev/https://example.com/feed.xml
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
    }

    const incoming = new URL(request.url);
    // Strip the leading "/" to recover the upstream URL, preserving its query string.
    const target = incoming.pathname.slice(1) + incoming.search;

    let upstream: URL;
    try {
      upstream = new URL(target);
    } catch {
      return new Response('Pass the feed URL in the path: /https://host/feed.xml', {
        status: 400,
        headers: CORS_HEADERS,
      });
    }
    if (upstream.protocol !== 'http:' && upstream.protocol !== 'https:') {
      return new Response('Only http(s) targets are allowed', {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const resp = await fetch(upstream.toString(), {
      headers: { 'User-Agent': 'morsebrowser-rss-proxy' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    const headers = new Headers(CORS_HEADERS);
    const contentType = resp.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);

    return new Response(resp.body, { status: resp.status, headers });
  },
};
