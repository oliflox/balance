import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { gridLines, hasEntries, initialsOf, personVals } from '../lib/compute';
import { LIME, ORANGE, PANEL } from '../theme';

interface Props {
  focusId: string;
  onNewWeighIn: () => void;
}

const panel: React.CSSProperties = {
  background: PANEL,
  border: '1px solid rgba(242,240,230,.10)',
  borderRadius: 22,
  padding: 'clamp(18px, 2vw, 26px)',
};

const TABLE_HEAD = ['Date', 'Poids', 'Δ', 'Taille', 'Hanches', 'Bras', 'Cuisse', 'Poitrine', '% MG'];

export default function MonSuivi({ focusId, onNewWeighIn }: Props) {
  const { members, me } = useData();
  const member = useMemo(() => members.find((m) => m.id === focusId) ?? me, [members, focusId, me]);
  const grid = gridLines();

  if (!member) return null;

  if (!hasEntries(member)) {
    const isMe = member.id === me?.id;
    return (
      <main style={mainStyle}>
        <div style={{ ...panel, textAlign: 'center', padding: 48 }}>
          <div style={{ width: 74, height: 74, borderRadius: 22, background: member.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontFamily: 'Anton, sans-serif', fontSize: 30, margin: '0 auto 16px' }}>
            {initialsOf(member.name)}
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', fontSize: 30, margin: 0 }}>{member.name}</h1>
          <p style={{ color: 'rgba(242,240,230,.5)' }}>
            {isMe ? "Tu n'as pas encore de pesée. Le premier chiffre, c'est le plus dur." : "Ce membre ne s'est pas encore pesé."}
          </p>
          {isMe && (
            <button onClick={onNewWeighIn} style={{ marginTop: 12, padding: '12px 20px', background: LIME, border: 'none', borderRadius: 999, color: '#0E100C', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              + Ma première pesée
            </button>
          )}
        </div>
      </main>
    );
  }

  const p = personVals(member, me?.id ?? '');
  const gradId = `fillMe-${member.id}`;

  return (
    <main style={mainStyle}>
      {/* Profile header */}
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20, animation: 'riseIn .5s ease both' }}>
        <div style={{ width: 74, height: 74, borderRadius: 22, background: p.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontFamily: 'Anton, sans-serif', fontSize: 30, flex: 'none' }}>{p.initials}</div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: ORANGE }}>{p.subtitle}</div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 0.95, margin: '8px 0 0', textTransform: 'uppercase' }}>{p.name}</h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {p.stats.map((s, i) => (
            <div key={i} style={{ padding: '14px 18px', background: PANEL, border: '1px solid rgba(242,240,230,.10)', borderRadius: 16, minWidth: 122 }}>
              <div style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(242,240,230,.45)' }}>{s.label}</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 25, marginTop: 7, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Chart + side column */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ ...panel, gridColumn: 'span 2', minWidth: 0, animation: 'riseIn .6s ease both' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={sectionTitle}>Poids dans le temps</h2>
            <div style={{ fontSize: 13, color: 'rgba(242,240,230,.5)' }}>{p.range}</div>
          </div>
          <svg viewBox="0 0 900 300" preserveAspectRatio="none" style={{ width: '100%', height: 'clamp(220px, 30vw, 300px)', display: 'block', marginTop: 18, overflow: 'visible' }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={p.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {grid.map((g, i) => (
              <line key={i} x1={0} y1={g.y2} x2={900} y2={g.y2} stroke="rgba(242,240,230,.09)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            <path d={p.area} fill={`url(#${gradId})`} />
            <path d={p.targetLine} fill="none" stroke={ORANGE} strokeWidth={1.5} strokeDasharray="7 6" vectorEffect="non-scaling-stroke" />
            <path d={p.line} fill="none" stroke={p.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {p.dots.map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={3.5} fill="#0E100C" stroke={p.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,240,230,.35)' }}>
            {xLabelsForPerson(p.range)}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 16, fontSize: 12, color: 'rgba(242,240,230,.5)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 18, height: 3, background: p.color, borderRadius: 2 }} />Poids réel
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 18, height: 0, borderTop: `2px dashed ${ORANGE}` }} />Objectif {p.target} kg
            </span>
          </div>
        </div>

        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20, animation: 'riseIn .7s ease both' }}>
          <div style={{ ...panel, display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg viewBox="0 0 120 120" style={{ width: 108, height: 108, flex: 'none', transform: 'rotate(-90deg)' }}>
              <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(242,240,230,.10)" strokeWidth={12} />
              <circle cx={60} cy={60} r={50} fill="none" stroke={p.color} strokeWidth={12} strokeLinecap="round" strokeDasharray={p.ring} style={{ transition: 'stroke-dasharray .6s ease' }} />
            </svg>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(242,240,230,.45)' }}>Vers l'objectif</div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 38, lineHeight: 1.05, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{p.progress}%</div>
              <div style={{ fontSize: 12.5, color: 'rgba(242,240,230,.5)', marginTop: 4 }}>{p.remaining}</div>
            </div>
          </div>
          <div style={{ padding: 'clamp(18px, 2vw, 26px)', background: 'linear-gradient(160deg, rgba(200,255,61,.13), rgba(25,28,20,.9))', border: '1px solid rgba(200,255,61,.24)', borderRadius: 22 }}>
            <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: LIME }}>Série en cours</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
              <span style={{ fontFamily: 'Anton, sans-serif', fontSize: 46, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.streak}</span>
              <span style={{ fontSize: 14, color: 'rgba(242,240,230,.6)' }}>lundis d'affilée</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 16 }}>
              {p.weeks.map((w, i) => (
                <span key={i} title={w.label} style={{ width: 16, height: 16, borderRadius: 5, background: w.color, display: 'inline-block' }} />
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(242,240,230,.55)', marginTop: 14 }}>{p.streakNote}</div>
          </div>
        </div>
      </section>

      {/* Measurements */}
      <section style={{ ...panel, marginTop: 20 }}>
        <h2 style={{ ...sectionTitle, marginBottom: 18 }}>Toutes les mensurations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 218px), 1fr))', gap: 12 }}>
          {p.measures.map((m, i) => (
            <div key={i} style={{ padding: 16, background: '#0E100C', border: '1px solid rgba(242,240,230,.09)', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,240,230,.5)' }}>{m.label}</span>
                <span style={{ fontSize: 11.5, color: m.deltaColor, fontVariantNumeric: 'tabular-nums' }}>{m.delta}</span>
              </div>
              <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 28, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                {m.value}
                <span style={{ fontSize: 14, color: 'rgba(242,240,230,.45)', fontFamily: "'Space Grotesk', sans-serif" }}> {m.unit}</span>
              </div>
              <svg viewBox="0 0 200 56" preserveAspectRatio="none" style={{ width: '100%', height: 52, marginTop: 8, display: 'block' }}>
                <path d={m.d} fill="none" stroke={m.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      <section style={{ ...panel, marginTop: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={sectionTitle}>Historique des pesées</h2>
          {p.isMe && (
            <button onClick={onNewWeighIn} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid rgba(200,255,61,.4)', borderRadius: 999, color: LIME, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + Ajouter une pesée
            </button>
          )}
        </div>
        <div style={{ overflowX: 'auto', marginTop: 18 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720, fontVariantNumeric: 'tabular-nums' }}>
            <thead>
              <tr>
                {TABLE_HEAD.map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '0 12px 12px 0', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(242,240,230,.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.history.map((h, i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(242,240,230,.07)' }}>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)', whiteSpace: 'nowrap' }}>{h.date}</td>
                  <td style={{ ...td, fontSize: 15, fontWeight: 600 }}>{h.weight}</td>
                  <td style={{ ...td, color: h.deltaColor }}>{h.delta}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.taille}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.hanches}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.bras}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.cuisse}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.poitrine}</td>
                  <td style={{ ...td, color: 'rgba(242,240,230,.65)' }}>{h.mg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3.5vw, 40px) 80px',
  maxWidth: 1560,
  margin: '0 auto',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'Anton, sans-serif',
  fontSize: 26,
  margin: 0,
  textTransform: 'uppercase',
};

const td: React.CSSProperties = { padding: '13px 12px 13px 0', fontSize: 13.5 };

// The personal chart x-axis simply shows the tracked range endpoints.
function xLabelsForPerson(range: string) {
  const [from, to] = range.split(' → ');
  return (
    <>
      <span>{from}</span>
      <span>{to}</span>
    </>
  );
}
