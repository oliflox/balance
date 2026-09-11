import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { errMessage, initialsOf, r1, validateProfile } from '../lib/compute';
import { hrefFor } from '../lib/route';
import { LIME, ORANGE, panel, primaryBtn } from '../theme';
import type { Member, Room } from '../types';
import { ColorPicker, ErrorBanner, Field, UnitInput, textInput } from './FormControls';

interface Props {
  onToast: (message: string) => void;
}

export default function Settings({ onToast }: Props) {
  const { me, room, members, updateMyProfile, removeMember } = useData();
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
        {room && <InviteCard room={room} onToast={onToast} />}
        {/* Le propriétaire seul voit ce panneau ; la base refuse de toute façon
            l'appel de quelqu'un d'autre. */}
        {room?.isMine && (
          <MembersCard members={members} meId={me.id} onRemove={removeMember} onToast={onToast} />
        )}
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

// ---- Inviter -----------------------------------------------------------------

function InviteCard({ room, onToast }: { room: Room; onToast: (m: string) => void }) {
  // The link carries the code so a friend with no account yet lands on the join
  // form already filled in, instead of having to retype six characters.
  const link = window.location.origin + window.location.pathname + hrefFor({ name: 'join', code: room.code });

  const copy = async (text: string, said: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onToast(said);
    } catch {
      onToast('Copie impossible — sélectionne le code à la main.');
    }
  };

  return (
    <Card title={room.name} subtitle="Ta room est privée : on n'y entre qu'avec ce code.">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            padding: '14px 22px',
            background: '#0E100C',
            border: '1px solid rgba(200,255,61,.3)',
            borderRadius: 14,
            fontFamily: 'Anton, sans-serif',
            fontSize: 30,
            letterSpacing: '.3em',
            color: LIME,
            userSelect: 'all',
          }}
        >
          {room.code}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={() => copy(room.code, 'Code copié. Balance-le à tes potes.')} style={ghostBtn}>
            Copier le code
          </button>
          <button onClick={() => copy(link, "Lien d'invitation copié.")} style={{ ...primaryBtn('pill'), padding: '11px 18px' }}>
            Copier le lien d'invitation
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---- Membres (propriétaire uniquement) --------------------------------------

function MembersCard({
  members,
  meId,
  onRemove,
  onToast,
}: {
  members: Member[];
  meId: string;
  onRemove: (profileId: string) => Promise<void>;
  onToast: (m: string) => void;
}) {
  // Retirer efface des pesées : un clic ne suffit pas, il en faut deux.
  const [pending, setPending] = useState('');
  const [busy, setBusy] = useState('');

  const remove = async (m: Member) => {
    setBusy(m.id);
    try {
      await onRemove(m.id);
      onToast(m.name + ' a été retiré de la room.');
    } catch (e) {
      onToast(errMessage(e, 'Erreur'));
    } finally {
      setBusy('');
      setPending('');
    }
  };

  const sorted = members.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Card title="Les membres" subtitle={sorted.length + ' dans la room. Toi seul, propriétaire, vois ce panneau.'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map((m) => {
          const isMe = m.id === meId;
          const asking = pending === m.id;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 14,
                background: asking ? 'rgba(255,122,47,.10)' : 'rgba(242,240,230,.04)',
                border: `1px solid ${asking ? 'rgba(255,122,47,.4)' : 'rgba(242,240,230,.09)'}`,
                transition: 'all .18s ease',
              }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: m.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12.5, flex: 'none' }}>
                {initialsOf(m.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {m.name}
                  {isMe && <span style={{ fontSize: 11, color: LIME, marginLeft: 8 }}>toi · propriétaire</span>}
                </div>
                <div style={{ fontSize: 11.5, color: 'rgba(242,240,230,.42)' }}>
                  {m.entries.length === 0 ? 'aucune pesée' : m.entries.length + (m.entries.length > 1 ? ' pesées' : ' pesée')}
                </div>
              </div>

              {isMe ? null : asking ? (
                <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                  <button onClick={() => remove(m)} disabled={busy === m.id} style={dangerBtn}>
                    {busy === m.id ? 'Retrait…' : 'Confirmer'}
                  </button>
                  <button onClick={() => setPending('')} style={{ ...ghostBtn, borderColor: 'rgba(242,240,230,.16)', color: 'rgba(242,240,230,.6)' }}>
                    Annuler
                  </button>
                </div>
              ) : (
                <button onClick={() => setPending(m.id)} style={{ ...ghostBtn, flex: 'none' }}>
                  Retirer
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ margin: '16px 0 0', fontSize: 12.5, color: 'rgba(242,240,230,.42)', lineHeight: 1.5 }}>
        Retirer quelqu'un supprime ses pesées de la room. Elles sont archivées en base, donc
        récupérables, mais plus par l'appli — et la personne pourra rejoindre à nouveau avec le code.
      </p>
    </Card>
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
    const bad = validateProfile(name, s, t);
    if (bad) return setErr(bad);
    setBusy(true);
    try {
      await onSave({ name: name.trim(), color, start: r1(s), target: r1(t) });
      onToast('Profil mis à jour.');
    } catch (e) {
      setErr(errMessage(e, 'Erreur'));
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
        <ColorPicker value={color} onChange={setColor} />
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
      setErr(errMessage(e, 'Erreur'));
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
      setErr(errMessage(e, 'Erreur'));
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

function SaveButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={busy} style={{ ...primaryBtn('pill', busy), marginTop: 20, padding: '13px 22px', borderRadius: 12 }}>
      {busy ? 'Un instant…' : children}
    </button>
  );
}

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

const dangerBtn: React.CSSProperties = {
  padding: '9px 15px',
  background: ORANGE,
  border: '1px solid ' + ORANGE,
  borderRadius: 999,
  color: '#0E100C',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};
