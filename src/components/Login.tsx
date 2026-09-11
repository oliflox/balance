import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errMessage } from '../lib/compute';
import { fetchPublicStats } from '../lib/data';
import type { PublicStats } from '../lib/data';
import { useRoute } from '../lib/route';
import { LIME, primaryBtn, tabStyle } from '../theme';
import { ErrorBanner } from './FormControls';

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '15px 16px',
  background: '#191C14',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 12,
  color: '#F2F0E6',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color .15s ease',
};

function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="auth-input" style={inputBase} />;
}

const STEPS = [
  { n: '01', title: 'Ouvre ta room', text: 'Un championnat privé, rien qu’à toi. Tu lui donnes un nom, il te rend un code.' },
  { n: '02', title: 'Invite tes potes', text: 'Le code, ou le lien. Personne d’autre ne voit vos poids, vos courbes ni vos excuses.' },
  { n: '03', title: 'Une pesée par semaine', text: 'Chacun son objectif, à la hausse comme à la baisse. Le classement fait le reste.' },
];

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [route] = useRoute();
  const invited = route.name === 'join';

  // Someone arriving on an invite link has no account yet, nine times out of ten.
  const [mode, setMode] = useState<'in' | 'up'>(invited ? 'up' : 'in');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [stats, setStats] = useState<PublicStats>({ totalLost: 0, memberCount: 0, weekNo: 0 });

  useEffect(() => {
    fetchPublicStats().then(setStats).catch(() => {});
  }, []);

  const submit = async () => {
    setErr('');
    setNotice('');
    if (!/.+@.+\..+/.test(email)) return setErr("Cet email n'a pas l'air très sérieux.");
    if (pwd.length < 6) return setErr('Mot de passe : 6 caractères minimum.');
    setBusy(true);
    try {
      if (mode === 'in') {
        await signIn(email, pwd);
      } else if (await signUp(email, pwd)) {
        // Confirmation required: nothing more happens here until they click the link.
        setNotice('Compte créé. Confirme ton email, puis reviens te connecter.');
        setMode('in');
      }
    } catch (e) {
      setErr(translateAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    setErr('');
    setNotice('');
    if (!/.+@.+\..+/.test(email)) return setErr('Entre ton email ci-dessus pour recevoir le lien.');
    setResetBusy(true);
    try {
      await resetPassword(email);
      setNotice('Lien envoyé — vérifie ta boîte mail.');
    } catch (e) {
      setErr(errMessage(e, 'Erreur'));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', minHeight: '100vh' }}>
      {/* Présentation */}
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
            Le championnat de pesée entre potes
          </span>
        </div>

        <div style={{ position: 'relative', animation: 'riseIn .7s cubic-bezier(.2,.8,.2,1) both' }}>
          <h1
            style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: 'clamp(64px, 11vw, 148px)',
              lineHeight: 0.84,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '-.02em',
            }}
          >
            Ba<span style={{ color: LIME }}>lan</span>ce
          </h1>
          <p style={{ maxWidth: '34ch', margin: '22px 0 0', fontSize: 'clamp(16px, 1.6vw, 20px)', lineHeight: 1.45, color: 'rgba(242,240,230,.68)' }}>
            On se pèse une fois par semaine, dans une room privée, entre gens qui se connaissent.
            Courbes, classement, trophées et petites piques. Les chiffres ne mentent pas — vous, si.
          </p>

          <div style={{ display: 'grid', gap: 14, marginTop: 30, maxWidth: 460 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, color: LIME, paddingTop: 2, flex: 'none' }}>{s.n}</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(242,240,230,.5)', lineHeight: 1.45 }}>{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 28, animation: 'riseIn .9s cubic-bezier(.2,.8,.2,1) both' }}>
          <HeroStat value={stats.totalLost} label="kg envolés" accent />
          <HeroStat value={stats.memberCount} label="concurrents" />
          <HeroStat value={stats.weekNo} label="semaines de lutte" />
        </div>
      </div>

      {/* Accès */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px clamp(24px, 5vw, 72px)' }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'popIn .6s cubic-bezier(.2,.8,.2,1) both' }}>
          {invited && (
            <div style={{ marginBottom: 22, padding: '13px 15px', background: 'rgba(200,255,61,.08)', border: '1px solid rgba(200,255,61,.3)', borderRadius: 12, fontSize: 13, color: LIME, lineHeight: 1.5 }}>
              Tu es invité dans une room. Crée ton compte, on t'y emmène juste après.
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, padding: 4, background: '#191C14', border: '1px solid rgba(242,240,230,.10)', borderRadius: 999, marginBottom: 26 }}>
            <button onClick={() => { setMode('in'); setErr(''); }} style={{ ...tabStyle(mode === 'in'), flex: 1 }}>Se connecter</button>
            <button onClick={() => { setMode('up'); setErr(''); }} style={{ ...tabStyle(mode === 'up'), flex: 1 }}>Créer un compte</button>
          </div>

          <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: 38, lineHeight: 1, margin: '0 0 26px', textTransform: 'uppercase' }}>
            {mode === 'in' ? 'On se connecte' : 'On se lance'}
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
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          />

          {mode === 'in' && (
            <div style={{ textAlign: 'right', marginTop: 10 }}>
              <button type="button" onClick={forgotPassword} disabled={resetBusy} style={forgotLinkStyle}>
                {resetBusy ? 'Envoi…' : 'Mot de passe oublié ?'}
              </button>
            </div>
          )}

          {err && <ErrorBanner>{err}</ErrorBanner>}

          {notice && (
            <div style={{ marginTop: 14, padding: '11px 14px', background: 'rgba(200,255,61,.08)', border: '1px solid rgba(200,255,61,.3)', borderRadius: 10, color: LIME, fontSize: 13 }}>
              {notice}
            </div>
          )}

          <button onClick={submit} disabled={busy} style={{ ...primaryBtn('hero', busy), width: '100%', marginTop: 24 }}>
            {busy ? 'Un instant…' : mode === 'in' ? 'Monter sur la balance' : 'Créer mon compte'}
          </button>

          <div style={{ marginTop: 22, fontSize: 13, color: 'rgba(242,240,230,.45)', lineHeight: 1.5 }}>
            {mode === 'in'
              ? "Pas encore de compte ? Crées-en un, puis ouvre ta room ou rejoins celle d'un ami."
              : 'Juste après, tu choisis : créer ta room, ou entrer dans celle où on t’a invité.'}
          </div>
          <div style={{ marginTop: 28, padding: '13px 15px', border: '1px dashed rgba(242,240,230,.18)', borderRadius: 12, fontSize: 12.5, color: 'rgba(242,240,230,.5)', lineHeight: 1.5 }}>
            Chaque room est cloisonnée côté base de données (Supabase, RLS) : personne n'accède
            aux pesées d'une room où il n'a pas été invité.
          </div>
        </div>
      </div>
    </div>
  );
}

const forgotLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'rgba(242,240,230,.5)',
  fontSize: 13,
  textDecoration: 'underline',
  cursor: 'pointer',
};

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
  const msg = errMessage(e, '');
  if (/invalid login credentials/i.test(msg)) return 'Email ou mot de passe incorrect.';
  if (/already registered|already exists/i.test(msg)) return 'Un compte existe déjà avec cet email. Connecte-toi.';
  if (/signups? not allowed|disabled/i.test(msg)) return "Les inscriptions sont fermées côté Supabase. Active-les dans Authentication → Sign In / Providers.";
  if (/email/i.test(msg) && /confirm/i.test(msg)) return 'Confirme ton email avant de te connecter.';
  return msg;
}
