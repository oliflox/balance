import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { r1 } from '../lib/compute';
import { COLOR_CHOICES, LIME, primaryBtn } from '../theme';
import { ColorPicker, ErrorBanner, Field, UnitInput, textInput } from './FormControls';

export default function Onboarding() {
  const { user, signOut } = useAuth();
  const { createMyProfile } = useData();
  const [name, setName] = useState(defaultName(user?.email));
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    const s = parseFloat(start);
    const t = parseFloat(target);
    if (!name.trim()) return setErr('Il nous faut un nom pour te chambrer.');
    if (isNaN(s) || s < 30 || s > 250) return setErr('Poids de départ : entre 30 et 250 kg.');
    if (isNaN(t) || t < 30 || t > 250) return setErr('Objectif : entre 30 et 250 kg.');
    if (t >= s) return setErr("L'objectif doit être inférieur au poids de départ.");
    setBusy(true);
    try {
      await createMyProfile({ name: name.trim(), color, start: r1(s), target: r1(t) });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

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
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: LIME }}>Bienvenue dans la ligue</div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(30px, 5vw, 44px)', margin: '10px 0 6px', textTransform: 'uppercase' }}>
          Crée ton profil
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'rgba(242,240,230,.5)' }}>
          Poids de départ, objectif, et une couleur. Ensuite, on se pèse.
        </p>

        <Field label="Ton nom (ou surnom)">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marco" style={textInput} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 16 }}>
          <Field label="Poids de départ">
            <UnitInput value={start} onChange={setStart} unit="kg" placeholder="96.4" />
          </Field>
          <Field label="Objectif">
            <UnitInput value={target} onChange={setTarget} unit="kg" placeholder="84" />
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
          <button
            onClick={() => signOut()}
            style={{ padding: '16px 20px', background: 'transparent', border: '1px solid rgba(242,240,230,.16)', borderRadius: 14, color: 'rgba(242,240,230,.6)', fontSize: 14, cursor: 'pointer' }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

function defaultName(email?: string | null): string {
  if (!email) return '';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
