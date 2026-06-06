/** KO GeneralUtils.getParameterByName */
export function getUrlParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get(name);
  return value === null || value === '' ? null : value;
}

export function hasUrlParam(name: string): boolean {
  return getUrlParam(name) !== null;
}

/**
 * KO isDev(): URL path contains /dev/ on beta deployments.
 * Also true for ?beta=true / ?dev=true and Vite dev server (local work).
 */
export function isDevBuild(): boolean {
  if (typeof window === 'undefined') return false;
  const href = window.location.href.toLowerCase();
  if (href.includes('/dev/')) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('beta') === 'true' || params.get('dev') === 'true') return true;
  return import.meta.env.DEV;
}
