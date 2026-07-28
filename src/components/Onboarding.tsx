import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { COLOR_CHOICES, LIME } from '../theme';

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
      await createMyProfile({ name: name.trim(), color, start: round1(s), target: round1(t) });
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: c,
                  cursor: 'pointer',
                  border: color === c ? '3px solid #F2F0E6' : '3px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </Field>

        {err && (
          <div style={{ marginTop: 16, padding: '11px 14px', background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.35)', borderRadius: 10, color: '#FF8080', fontSize: 13 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={save}
            disabled={busy}
            style={{
              flex: 1,
              padding: 16,
              background: LIME,
              border: 'none',
              borderRadius: 14,
              color: '#0E100C',
              fontFamily: 'Anton, sans-serif',
              fontSize: 18,
              letterSpacing: '.05em',
              textTransform: 'uppercase',
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
            }}
          >
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

const textInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: '#0E100C',
  border: '1px solid rgba(242,240,230,.12)',
  borderRadius: 12,
  color: '#F2F0E6',
  fontSize: 15,
  outline: 'none',
};

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function UnitInput({ value, onChange, unit, placeholder }: { value: string; onChange: (v: string) => void; unit: string; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#0E100C', border: '1px solid rgba(242,240,230,.12)', borderRadius: 12, padding: '0 12px' }}>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, padding: '13px 0', background: 'transparent', border: 'none', color: '#F2F0E6', fontSize: 16, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
      />
      <span style={{ fontSize: 12, color: 'rgba(242,240,230,.4)' }}>{unit}</span>
    </div>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function defaultName(email?: string | null): string {
  if (!email) return '';
  const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}
