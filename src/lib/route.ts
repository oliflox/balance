import { useEffect, useState } from 'react';

// Hash routing on purpose: the app is served from GitHub Pages, which has no
// rewrite rules, so /balance/mon-suivi would 404 on a refresh. Everything after
// the # is the browser's business alone — deep links, back and forward all work
// with no server config and no router dependency.
export type Route =
  | { name: 'dash' }
  | { name: 'me'; id?: string } // no id = my own tracking
  | { name: 'settings' }
  | { name: 'join'; code: string } // an invite link, followed before the friend has an account
  | { name: '404' };

export const hrefFor = (r: Route): string =>
  r.name === 'dash' ? '#/groupe'
  : r.name === 'me' ? (r.id ? '#/membre/' + r.id : '#/mon-suivi')
  : r.name === 'settings' ? '#/reglages'
  : r.name === 'join' ? '#/rejoindre/' + r.code
  : '#/404';

export function parseRoute(hash: string): Route {
  // Supabase hands back its auth tokens in the hash (recovery links, email
  // confirmations). That is not a route: leave it alone and show the dashboard.
  if (hash.includes('access_token=') || hash.includes('error_code=')) return { name: 'dash' };
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts.length === 0 || (parts.length === 1 && parts[0] === 'groupe')) return { name: 'dash' };
  if (parts.length === 1 && parts[0] === 'mon-suivi') return { name: 'me' };
  if (parts.length === 2 && parts[0] === 'membre') return { name: 'me', id: parts[1] };
  if (parts.length === 1 && parts[0] === 'reglages') return { name: 'settings' };
  if (parts.length === 2 && parts[0] === 'rejoindre') return { name: 'join', code: parts[1].toUpperCase() };
  return { name: '404' };
}

export function useRoute(): [Route, (r: Route) => void] {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  return [parseRoute(hash), (r) => { window.location.hash = hrefFor(r); }];
}
