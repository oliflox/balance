import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../lib/compute';
import { hrefFor } from '../lib/route';
import type { Route } from '../lib/route';
import { LIME, primaryBtn, tabStyle } from '../theme';
import type { Member } from '../types';

interface Props {
  me: Member;
  route: Route;
  onNewWeighIn: () => void;
}

// Real links, not buttons: the tabs can be middle-clicked, bookmarked and
// copied, and the browser's back arrow walks them like any other page.
const navLink = (on: boolean): React.CSSProperties => ({ ...tabStyle(on), display: 'inline-block', textDecoration: 'none' });

export default function Header({ me, route, onNewWeighIn }: Props) {
  const { signOut } = useAuth();
  const mine = hrefFor({ name: 'me' });

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 16,
        padding: '14px clamp(16px, 3.5vw, 40px)',
        background: 'rgba(14,16,12,.86)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(242,240,230,.10)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 6 }}>
        <div style={{ width: 11, height: 11, background: LIME, borderRadius: 3 }} />
        <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 22, letterSpacing: '.04em', textTransform: 'uppercase' }}>Balance</span>
      </div>

      <nav style={{ display: 'flex', gap: 4, padding: 4, background: '#191C14', border: '1px solid rgba(242,240,230,.10)', borderRadius: 999 }}>
        <a href={hrefFor({ name: 'dash' })} style={navLink(route.name === 'dash')}>Le groupe</a>
        <a href={mine} style={navLink(route.name === 'me')}>Mon suivi</a>
      </nav>

      <div style={{ flex: 1, minWidth: 8 }} />

      <button
        onClick={onNewWeighIn}
        style={{ ...primaryBtn(), display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', fontSize: 13.5 }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Nouvelle pesée
      </button>

      <a
        href={mine}
        style={{
          color: 'inherit',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 14px 5px 5px',
          background: '#191C14',
          border: '1px solid rgba(242,240,230,.10)',
          borderRadius: 999,
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: me.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13 }}>
          {initialsOf(me.name)}
        </div>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{me.name}</span>
      </a>

      <a
        href={hrefFor({ name: 'settings' })}
        title="Réglages"
        aria-label="Réglages"
        style={{
          textDecoration: 'none',
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          background: route.name === 'settings' ? 'rgba(200,255,61,.14)' : 'transparent',
          border: `1px solid ${route.name === 'settings' ? 'rgba(200,255,61,.5)' : 'rgba(242,240,230,.14)'}`,
          borderRadius: 999,
          color: route.name === 'settings' ? LIME : 'rgba(242,240,230,.6)',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        ⚙
      </a>

      <button
        onClick={() => signOut()}
        title="Se déconnecter"
        aria-label="Se déconnecter"
        style={{
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: '1px solid rgba(242,240,230,.14)',
          borderRadius: 999,
          color: 'rgba(242,240,230,.5)',
          cursor: 'pointer',
        }}
      >
        <LogoutIcon />
      </button>
    </header>
  );
}

// Door with an arrow on its way out. Inline so it inherits the button's colour
// and needs no icon dependency.
function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
