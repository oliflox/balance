import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { r1, validateProfile } from '../lib/compute';
import { useRoute } from '../lib/route';
import { COLOR_CHOICES, LIME, primaryBtn, tabStyle } from '../theme';
import { ColorPicker, ErrorBanner, Field, UnitInput, textInput } from './FormControls';

/** The room a new member is about to join, once picked or resumed. */
type Target = { id: string; name: string };

export default function Onboarding() {
  const { room } = useData();
  const [route] = useRoute();
  // A room they own but never finished joining: pick the signup back up there.
  const [target, setTarget] = useState<Target | null>(room ? { id: room.id, name: room.name } : null);

  return (
    <Shell>
      {target ? (
        <ProfileStep target={target} onBack={() => setTarget(null)} />
      ) : (
        <RoomStep invite={route.name === 'join' ? route.code : ''} onPicked={setTarget} />
      )}
    </Shell>
  );
}

// ---- Étape 1 : sa room -------------------------------------------------------

function RoomStep({ invite, onPicked }: { invite: string; onPicked: (t: Target) => void }) {
  // An invite link lands straight on the join tab with the code already filled.
  const [mode, setMode] = useState<'join' | 'create'>(invite ? 'join' : 'create');
  const [name, setName] = useState('');
  const [code, setCode] = useState(invite);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { openRoom, findRoom } = useData();

  const submit = async () => {
    setErr('');
    if (mode === 'create' && !name.trim()) return setErr('Il faut un nom pour ta room.');
    if (mode === 'join' && code.trim().length < 4) return setErr("Un code d'invitation, c'est 6 caractères.");
    setBusy(true);
    try {
      onPicked(mode === 'create' ? { id: await openRoom(name), name: name.trim() } : await findRoom(code));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  return (
    <>
      <div style={kicker}>Bienvenue sur Balance</div>
      <h1 style={title}>{mode === 'create' ? 'Ouvre ta ligue' : 'Rejoins ta ligue'}</h1>
      <p style={lede}>
        Une room, c'est un championnat privé : seules les personnes à qui tu donnes le code y
        entrent. Crée la tienne, ou rejoins celle d'un ami.
      </p>

      <div style={{ display: 'flex', gap: 4, padding: 4, background: '#0E100C', border: '1px solid rgba(242,240,230,.10)', borderRadius: 999, marginBottom: 20 }}>
        <button onClick={() => { setMode('create'); setErr(''); }} style={{ ...tabStyle(mode === 'create'), flex: 1 }}>
          Créer une room
        </button>
        <button onClick={() => { setMode('join'); setErr(''); }} style={{ ...tabStyle(mode === 'join'), flex: 1 }}>
          J'ai un code
        </button>
      </div>

      {mode === 'create' ? (
        <Field label="Nom de la room">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="La ligue du bureau" style={textInput} />
        </Field>
      ) : (
        <Field label="Code d'invitation">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="K7M2QP"
            maxLength={6}
            style={{ ...textInput, fontFamily: 'Anton, sans-serif', fontSize: 24, letterSpacing: '.3em', textAlign: 'center' }}
          />
        </Field>
      )}

      {err && <ErrorBanner>{err}</ErrorBanner>}

      <button onClick={submit} disabled={busy} style={{ ...primaryBtn('hero', busy), width: '100%', marginTop: 24 }}>
        {busy ? 'Un instant…' : mode === 'create' ? 'Créer la room' : 'Rejoindre'}
      </button>
    </>
  );
}

// ---- Étape 2 : son profil ----------------------------------------------------

function ProfileStep({ target, onBack }: { target: Target; onBack: () => void }) {
  const { user } = useAuth();
  const { createMyProfile } = useData();
  const [name, setName] = useState(defaultName(user?.email));
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [start, setStart] = useState('');
  const [goal, setGoal] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    const s = parseFloat(start);
    const t = parseFloat(goal);
    const bad = validateProfile(name, s, t);
    if (bad) return setErr(bad);
    setBusy(true);
    try {
      await createMyProfile({ roomId: target.id, name: name.trim(), color, start: r1(s), target: r1(t) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  return (
    <>
      <div style={kicker}>{target.name}</div>
      <h1 style={title}>Crée ton profil</h1>
      <p style={lede}>
        Poids de départ, objectif, et une couleur. L'objectif peut être au-dessus comme en
        dessous : perdre ou prendre, c'est le même championnat.
      </p>

      <Field label="Ton nom (ou surnom)">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marco" style={textInput} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 16 }}>
        <Field label="Poids de départ">
          <UnitInput value={start} onChange={setStart} unit="kg" placeholder="96.4" />
        </Field>
        <Field label="Objectif">
          <UnitInput value={goal} onChange={setGoal} unit="kg" placeholder="84" />
        </Field>
      </div>

      <Field label="Ta couleur" style={{ marginTop: 16 }}>
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      {err && <ErrorBanner>{err}</ErrorBanner>}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button onClick={save} disabled={busy} style={{ ...primaryBtn('hero', busy), flex: 1 }}>
          {busy ? 'Un instant…' : 'Entrer dans la ligue'}
        </button>
        <button onClick={onBack} style={ghostBtn}>
          Changer de room
        </button>
      </div>
    </>
  );
}

// ---- Habillage partagé -------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vh, 56px) 16px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#191C14',
          border: '1px solid rgba(242,240,230,.14)',
          borderRadius: 24,
          padding: 'clamp(22px, 3vw, 34px)',
          animation: 'popIn .4s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        {children}
        <button onClick={() => signOut()} style={{ ...ghostBtn, width: '100%', marginTop: 12, padding: '13px 20px' }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

const kicker: React.CSSProperties = { fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: LIME };
const title: React.CSSProperties = { fontFamily: 'Anton, sans-serif', fontSize: 'clamp(30px, 5vw, 44px)', margin: '10px 0 6px', textTransform: 'uppercase' };
const lede: React.CSSProperties = { margin: '0 0 24px', fontSize: 13.5, color: 'rgba(242,240,230,.5)', lineHeight: 1.5 };
const ghostBtn: React.CSSProperties = {
  padding: '16px 20px',
  background: 'transparent',
  border: '1px solid rgba(242,240,230,.16)',
  borderRadius: 14,
  color: 'rgba(242,240,230,.6)',
  fontSize: 14,
  cursor: 'pointer',
};

function defaultName(email?: string | null): string {
  if (!email) return '';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
