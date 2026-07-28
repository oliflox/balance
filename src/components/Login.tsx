import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicStats } from '../lib/data';
import type { PublicStats } from '../lib/data';
import { GROUP_NAME, LIME } from '../theme';

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  background: '#191C14',
  border: '1px solid rgba(242,240,230,.14)',
  borderRadius: 12,
  color: '#F2F0E6',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color .15s ease',
};

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      onFocus={(e) => {
        setFocus(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        props.onBlur?.(e);
      }}
      style={{ ...inputBase, borderColor: focus ? LIME : 'rgba(242,240,230,.14)' }}
    />
  );
}

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<PublicStats>({ totalLost: 0, memberCount: 0, weekNo: 0 });

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(() => {});
  }, []);

  const submit = async () => {
    setErr('');
    if (!/.+@.+\..+/.test(email)) return setErr("Cet email n'a pas l'air très sérieux.");
    if (pwd.length < 6) return setErr('Mot de passe : 6 caractères minimum.');
    setBusy(true);
    try {
      await signIn(email, pwd);
    } catch (e) {
      setErr(translateAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '48px clamp(24px, 5vw, 72px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 40,
          borderRight: '1px solid rgba(242,240,230,.10)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(242,240,230,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242,240,230,.05) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(70% 70% at 30% 40%, #000, transparent)',
            WebkitMaskImage: 'radial-gradient(70% 70% at 30% 40%, #000, transparent)',
          }}
        />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 13, height: 13, background: LIME, borderRadius: 3 }} />
          <span style={{ fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(242,240,230,.6)' }}>
            {GROUP_NAME}
          </span>
        </div>
        <div style={{ position: 'relative', animation: 'riseIn .7s cubic-bezier(.2,.8,.2,1) both' }}>
          <h1
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(72px, 13vw, 168px)',
              lineHeight: 0.84,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-.02em',
            }}
          >
            Ba<span style={{ color: LIME }}>lan</span>ce
          </h1>
          <p style={{ maxWidth: '30ch', margin: '22px 0 0', fontSize: 'clamp(16px, 1.6vw, 20px)', lineHeight: 1.45, color: 'rgba(242,240,230,.68)' }}>
            Le championnat du lundi matin. On se pèse, on note, on se chambre. Les chiffres ne mentent pas — vous, si.
          </p>
        </div>
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 28, animation: 'riseIn .9s cubic-bezier(.2,.8,.2,1) both' }}>
          <HeroStat value={stats.totalLost} label="kg envolés" accent />
          <HeroStat value={stats.memberCount} label="concurrents" />
          <HeroStat value={stats.weekNo} label="semaines de lutte" />
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px clamp(24px, 5vw, 72px)' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'popIn .6s cubic-bezier(.2,.8,.2,1) both' }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: LIME }}>Accès membres</div>
          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 42, lineHeight: 1, margin: '12px 0 28px', textTransform: 'uppercase' }}>
            On se connecte
          </h2>

          <label style={labelStyle}>Email</label>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="marco@balance.club"
            autoComplete="email"
          />

          <label style={{ ...labelStyle, margin: '18px 0 8px' }}>Mot de passe</label>
          <AuthInput
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {err && (
            <div style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(255,77,77,.12)', border: '1px solid rgba(255,77,77,.35)', borderRadius: 10, color: '#FF8080', fontSize: 13 }}>
              {err}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            style={{
              width: '100%',
              marginTop: 24,
              padding: 17,
              background: LIME,
              border: 'none',
              borderRadius: 12,
              color: '#0E100C',
              fontFamily: 'Anton, sans-serif',
              fontSize: 19,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              cursor: busy ? 'wait' : 'pointer',
              opacity: busy ? 0.7 : 1,
              transition: 'transform .15s ease, box-shadow .2s ease',
            }}
          >
            {busy ? 'Un instant…' : 'Monter sur la balance'}
          </button>

          <div style={{ marginTop: 22, fontSize: 13, color: 'rgba(242,240,230,.45)' }}>
            Pas de compte ? Demande à l'admin de t'en créer un.
          </div>
          <div style={{ marginTop: 28, padding: '13px 15px', border: '1px dashed rgba(242,240,230,.18)', borderRadius: 12, fontSize: 12.5, color: 'rgba(242,240,230,.5)', lineHeight: 1.5 }}>
            Comptes gérés par l'admin. Tes données sont protégées par Supabase (RLS).
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'rgba(242,240,230,.5)',
  marginBottom: 8,
};

function HeroStat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'Anton, sans-serif',
          fontSize: 40,
          lineHeight: 1,
          color: accent ? LIME : '#F2F0E6',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(242,240,230,.45)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function translateAuthError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.';
  if (/email/i.test(msg) && /confirm/i.test(msg)) return 'Confirme ton email avant de te connecter.';
  return msg;
}
