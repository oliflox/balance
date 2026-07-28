import { useAuth } from '../context/AuthContext';
import { initialsOf } from '../lib/compute';
import { LIME } from '../theme';
import type { Member } from '../types';

interface Props {
  me: Member;
  screen: 'dash' | 'me';
  onDash: () => void;
  onMe: () => void;
  onNewWeighIn: () => void;
}

export default function Header({ me, screen, onDash, onMe, onNewWeighIn }: Props) {
  const { signOut } = useAuth();

  const tab = (on: boolean): React.CSSProperties => ({
    padding: '9px 16px',
    border: 'none',
    borderRadius: 999,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .2s ease',
    background: on ? LIME : 'transparent',
    color: on ? '#0E100C' : 'rgba(242,240,230,.55)',
  });

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
        <button onClick={onDash} style={tab(screen === 'dash')}>Le groupe</button>
        <button onClick={onMe} style={tab(screen === 'me')}>Mon suivi</button>
      </nav>

      <div style={{ flex: 1, minWidth: 8 }} />

      <button
        onClick={onNewWeighIn}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 18px',
          background: LIME,
          border: 'none',
          borderRadius: 999,
          color: '#0E100C',
          fontWeight: 700,
          fontSize: 13.5,
          letterSpacing: '.02em',
          cursor: 'pointer',
          transition: 'transform .15s ease, box-shadow .2s ease',
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>+</span>Nouvelle pesée
      </button>

      <div
        onClick={onMe}
        style={{
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
      </div>

      <button
        onClick={() => signOut()}
        title="Se déconnecter"
        style={{ padding: '9px 13px', background: 'transparent', border: '1px solid rgba(242,240,230,.14)', borderRadius: 999, color: 'rgba(242,240,230,.5)', fontSize: 12.5, cursor: 'pointer' }}
      >
        Sortir
      </button>
    </header>
  );
}
