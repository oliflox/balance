import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { COLOR_CHOICES, INK, LIME, ORANGE, PANEL } from '../theme';

interface Props {
  onToast: (message: string) => void;
}

const panel: React.CSSProperties = {
  background: PANEL,
  border: '1px solid rgba(242,240,230,.10)',
  borderRadius: 22,
  padding: 'clamp(18px, 2vw, 26px)',
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function Settings({ onToast }: Props) {
  const { me, updateMyProfile } = useData();
  const { user, updatePassword, updateEmail, signOut } = useAuth();

  if (!me) return null;

  return (
    <main style={{ padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3.5vw, 40px) 80px', maxWidth: 760, margin: '0 auto' }}>
      <section style={{ animation: 'riseIn .5s ease both', marginBottom: 26 }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: ORANGE }}>Réglages</div>
        <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 0.95, margin: '8px 0 0', textTransform: 'uppercase' }}>
          Mon compte
        </h1>
      </section>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ProfileCard me={me} onSave={updateMyProfile} onToast={onToast} />
        <PasswordCard onSave={updatePassword} onToast={onToast} />
        <EmailCard currentEmail={user?.email ?? ''} onSave={updateEmail} onToast={onToast} />

        <div style={{ ...panel, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, textTransform: 'uppercase' }}>Se déconnecter</div>
            <div style={{ fontSize: 13, color: 'rgba(242,240,230,.5)' }}>Tu devras te reconnecter avec ton email et ton mot de passe.</div>
          </div>
          <button onClick={() => signOut()} style={ghostBtn}>Sortir</button>
        </div>
      </div>
    </main>
  );
}

// ---- Profil ------------------------------------------------------------------

function ProfileCard({
  me,
  onSave,
  onToast,
}: {
  me: { name: string; color: string; start: number; target: number };
  onSave: (f: { name?: string; color?: string; start?: number; target?: number }) => Promise<void>;
  onToast: (m: string) => void;
}) {
  const [name, setName] = useState(me.name);
  const [color, setColor] = useState(me.color);
  const [start, setStart] = useState(String(me.start));
  const [target, setTarget] = useState(String(me.target));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    const s = parseFloat(start);
    const t = parseFloat(target);
    if (!name.trim()) return setErr('Il faut un nom.');
    if (isNaN(s) || s < 30 || s > 250) return setErr('Poids de départ : entre 30 et 250 kg.');
    if (isNaN(t) || t < 30 || t > 250) return setErr('Objectif : entre 30 et 250 kg.');
    if (t >= s) return setErr("L'objectif doit être inférieur au poids de départ.");
    setBusy(true);
    try {
      await onSave({ name: name.trim(), color, start: round1(s), target: round1(t) });
      onToast('Profil mis à jour.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Profil" subtitle="Ton nom, ta couleur et tes objectifs.">
      <Field label="Nom (ou surnom)">
        <input value={name} onChange={(e) => setName(e.target.value)} style={textInput} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginTop: 16 }}>
        <Field label="Poids de départ">
          <UnitInput value={start} onChange={setStart} unit="kg" />
        </Field>
        <Field label="Objectif">
          <UnitInput value={target} onChange={setTarget} unit="kg" />
        </Field>
      </div>

      <Field label="Couleur" style={{ marginTop: 16 }}>
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
              }}
            />
          ))}
        </div>
      </Field>

      {err && <ErrorBanner>{err}</ErrorBanner>}
      <SaveButton busy={busy} onClick={save}>Enregistrer le profil</SaveButton>
    </Card>
  );
}

// ---- Mot de passe ------------------------------------------------------------

function PasswordCard({ onSave, onToast }: { onSave: (p: string) => Promise<void>; onToast: (m: string) => void }) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    if (pwd.length < 6) return setErr('Mot de passe : 6 caractères minimum.');
    if (pwd !== confirm) return setErr('Les deux mots de passe ne correspondent pas.');
    setBusy(true);
    try {
      await onSave(pwd);
      setPwd('');
      setConfirm('');
      onToast('Mot de passe mis à jour.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Mot de passe" subtitle="Choisis un nouveau mot de passe (6 caractères min.).">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <Field label="Nouveau mot de passe">
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" style={textInput} />
        </Field>
        <Field label="Confirmer">
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" style={textInput} />
        </Field>
      </div>
      {err && <ErrorBanner>{err}</ErrorBanner>}
      <SaveButton busy={busy} onClick={save}>Changer le mot de passe</SaveButton>
    </Card>
  );
}

// ---- Email -------------------------------------------------------------------

function EmailCard({ currentEmail, onSave, onToast }: { currentEmail: string; onSave: (e: string) => Promise<void>; onToast: (m: string) => void }) {
  const [email, setEmail] = useState(currentEmail);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    if (!/.+@.+\..+/.test(email)) return setErr("Cet email n'a pas l'air valide.");
    if (email === currentEmail) return setErr("C'est déjà ton email actuel.");
    setBusy(true);
    try {
      await onSave(email);
      onToast('Email de confirmation envoyé. Clique sur le lien reçu pour valider.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Email" subtitle="Changer ton email demande une confirmation par lien.">
      <Field label="Adresse email">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={textInput} />
      </Field>
      {err && <ErrorBanner>{err}</ErrorBanner>}
      <SaveButton busy={busy} onClick={save}>Mettre à jour l'email</SaveButton>
    </Card>
  );
}

// ---- Petits composants partagés ---------------------------------------------

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 24, margin: 0, textTransform: 'uppercase' }}>{title}</h2>
      <p style={{ margin: '6px 0 18px', fontSize: 13, color: 'rgba(242,240,230,.5)' }}>{subtitle}</p>
      {children}
    </section>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)', marginBottom: 8 }}>{label}</label>
      {children}
    </div>
  );
}

function UnitInput({ value, onChange, unit }: { value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#0E100C', border: '1px solid rgba(242,240,230,.12)', borderRadius: 12, padding: '0 12px' }}>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, padding: '13px 0', background: 'transparent', border: 'none', color: INK, fontSize: 16, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
      />
      <span style={{ fontSize: 12, color: 'rgba(242,240,230,.4)' }}>{unit}</span>
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: '11px 14px', background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.35)', borderRadius: 10, color: '#FF8080', fontSize: 13 }}>
      {children}
    </div>
  );
}

function SaveButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        marginTop: 20,
        padding: '13px 22px',
        background: LIME,
        border: 'none',
        borderRadius: 12,
        color: '#0E100C',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '.02em',
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? 'Un instant…' : children}
    </button>
  );
}

const textInput: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: '#0E100C',
  border: '1px solid rgba(242,240,230,.12)',
  borderRadius: 12,
  color: INK,
  fontSize: 15,
  outline: 'none',
};

const ghostBtn: React.CSSProperties = {
  padding: '11px 18px',
  background: 'transparent',
  border: '1px solid rgba(255,122,47,.5)',
  borderRadius: 999,
  color: ORANGE,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
