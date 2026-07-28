import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { dashboard, gridLines } from '../lib/compute';
import { LIME, ORANGE, PANEL } from '../theme';

interface Props {
  onOpenPerson: (id: string) => void;
  onNewWeighIn: () => void;
}

const panel: React.CSSProperties = {
  background: PANEL,
  border: '1px solid rgba(242,240,230,.10)',
  borderRadius: 22,
  padding: 'clamp(18px, 2vw, 26px)',
};

export default function Dashboard({ onOpenPerson, onNewWeighIn }: Props) {
  const { activeMembers, me, reactions, react } = useData();
  const [metric, setMetric] = useState<'pct' | 'kg'>('pct');
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const vm = useMemo(
    () => dashboard(activeMembers, me?.id ?? '', metric, hidden, reactions),
    [activeMembers, me?.id, metric, hidden, reactions]
  );
  const grid = gridLines();
  const meNoEntries = me && me.entries.length === 0;

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

  if (activeMembers.length === 0) {
    return (
      <main style={mainStyle}>
        <div style={{ ...panel, textAlign: 'center', padding: 48 }}>
          <h1 style={{ fontFamily: 'Anton, sans-serif', textTransform: 'uppercase', fontSize: 32 }}>La ligue attend son premier héros</h1>
          <p style={{ color: 'rgba(242,240,230,.5)' }}>Personne ne s'est encore pesé. Ouvre le bal.</p>
          <button onClick={onNewWeighIn} style={ctaBtn}>+ Première pesée</button>
        </div>
      </main>
    );
  }

  return (
    <main style={mainStyle}>
      {meNoEntries && (
        <div style={{ ...panel, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 20, borderColor: 'rgba(200,255,61,.24)', background: 'linear-gradient(160deg, rgba(200,255,61,.10), rgba(25,28,20,.9))' }}>
          <div>
            <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 20, textTransform: 'uppercase' }}>Tu n'es pas encore sur la balance</div>
            <div style={{ fontSize: 13, color: 'rgba(242,240,230,.6)' }}>Ajoute ta première pesée pour apparaître au classement.</div>
          </div>
          <button onClick={onNewWeighIn} style={ctaBtn}>+ Ma première pesée</button>
        </div>
      )}

      {/* Hero */}
      <section style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingBottom: 26, borderBottom: '1px solid rgba(242,240,230,.10)', animation: 'riseIn .5s ease both' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: ORANGE }}>
            Semaine {vm.weekNo} · pesée du lundi
          </div>
          <h1 style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(38px, 6vw, 78px)', lineHeight: 0.9, margin: '10px 0 0', textTransform: 'uppercase' }}>
            {vm.totalLost} kg de moins
            <br />
            <span style={{ color: 'rgba(242,240,230,.34)' }}>qu'au premier jour</span>
          </h1>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <StatCard label="Meilleur de la semaine" big={vm.bestWeekName} small={`${vm.bestWeekDelta} kg`} smallColor={LIME} />
          <StatCard label="Le boulet" big={vm.worstName} small={`${vm.worstDelta} kg`} smallColor={ORANGE} />
          <StatCard label="Pesées enregistrées" big={String(vm.totalEntries)} small={`sur ${vm.totalPossible} possibles`} smallColor="rgba(242,240,230,.45)" />
        </div>
      </section>

      {/* Chart + ranking */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, marginTop: 26, alignItems: 'start' }}>
        <div style={{ ...panel, gridColumn: 'span 2', minWidth: 0, animation: 'riseIn .6s ease both' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <h2 style={sectionTitle}>Toutes les courbes</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(242,240,230,.5)' }}>{vm.chartHint}</p>
            </div>
            <div style={{ display: 'flex', gap: 4, padding: 4, background: '#0E100C', border: '1px solid rgba(242,240,230,.10)', borderRadius: 999 }}>
              <button onClick={() => setMetric('pct')} style={tab(metric === 'pct')}>% perdu</button>
              <button onClick={() => setMetric('kg')} style={tab(metric === 'kg')}>Poids (kg)</button>
            </div>
          </div>

          <div style={{ position: 'relative', marginTop: 20 }}>
            <svg viewBox="0 0 900 330" preserveAspectRatio="none" style={{ width: '100%', height: 'clamp(240px, 34vw, 340px)', display: 'block', overflow: 'visible' }}>
              {grid.map((g, i) => (
                <line key={i} x1={0} y1={g.y} x2={900} y2={g.y} stroke="rgba(242,240,230,.09)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
              ))}
              {vm.chart.series.map((s) => (
                <path key={s.id} d={s.d} fill="none" stroke={s.color} strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" opacity={s.op} vectorEffect="non-scaling-stroke" style={{ transition: 'opacity .25s ease' }} />
              ))}
              {vm.chart.series.map((s) => (
                <circle key={s.id + '-d'} cx={s.lx} cy={s.ly} r={4} fill={s.color} opacity={s.op} vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(242,240,230,.35)' }}>
              {vm.chart.xLabels.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, height: 'clamp(240px, 34vw, 340px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
              {vm.chart.yLabels.map((l, i) => (
                <span key={i} style={{ fontSize: 10.5, color: 'rgba(242,240,230,.35)', background: PANEL, padding: '0 5px', fontVariantNumeric: 'tabular-nums' }}>{l}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(242,240,230,.10)' }}>
            {vm.legend.map((m) => (
              <button
                key={m.id}
                onClick={() => setHidden((h) => ({ ...h, [m.id]: !h[m.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '7px 13px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                  background: m.hidden ? 'transparent' : 'rgba(242,240,230,.06)',
                  border: `1px solid ${m.hidden ? 'rgba(242,240,230,.10)' : 'rgba(242,240,230,.2)'}`,
                  color: m.hidden ? 'rgba(242,240,230,.35)' : '#F2F0E6',
                }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: m.color }} />
                {m.name}
                <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.6 }}>{m.pct}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div style={{ ...panel, minWidth: 0, animation: 'riseIn .7s ease both' }}>
          <h2 style={sectionTitle}>Le classement</h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(242,240,230,.5)' }}>Par pourcentage perdu depuis le départ.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vm.ranking.map((r) => (
              <div
                key={r.id}
                onClick={() => onOpenPerson(r.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: 12,
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'background .18s ease',
                  background: r.isMe ? 'rgba(200,255,61,.07)' : 'transparent',
                  border: `1px solid ${r.isMe ? 'rgba(200,255,61,.22)' : 'transparent'}`,
                }}
              >
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 21, width: 30, color: r.rankColor, fontVariantNumeric: 'tabular-nums' }}>{r.rank}</div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13, flex: 'none' }}>{r.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                    <span style={{ fontSize: 11, color: 'rgba(242,240,230,.4)', fontVariantNumeric: 'tabular-nums' }}>{r.weight} kg</span>
                    {r.badge && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(200,255,61,.14)', color: LIME, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{r.badge}</span>
                    )}
                  </div>
                  <div style={{ marginTop: 7, height: 6, background: 'rgba(242,240,230,.09)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 999, background: r.color, width: `${r.barWidth}%`, transition: 'width .5s ease' }} />
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11.5, color: 'rgba(242,240,230,.42)' }}>{r.roast}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 21, color: r.pctColor, fontVariantNumeric: 'tabular-nums' }}>{r.pct}</div>
                  <div style={{ fontSize: 11.5, color: r.deltaColor, fontVariantNumeric: 'tabular-nums' }}>{r.delta}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feed + trophies */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20, marginTop: 20, alignItems: 'start' }}>
        <div style={panel}>
          <h2 style={{ ...sectionTitle, marginBottom: 18 }}>Dernières pesées</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {vm.feed.map((f) => (
              <div key={f.entryId} style={{ display: 'flex', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(242,240,230,.07)' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: f.color, color: '#0E100C', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12.5, flex: 'none' }}>{f.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 600 }}>{f.name}</span> {f.text}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(242,240,230,.35)', marginTop: 3 }}>{f.when}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
                    {f.reactions.map((x) => (
                      <button
                        key={x.emoji}
                        onClick={() => react(f.entryId, x.emoji, x.mine)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 999,
                          cursor: 'pointer',
                          fontSize: 13,
                          transition: 'all .18s ease',
                          background: x.mine ? 'rgba(200,255,61,.16)' : '#0E100C',
                          border: `1px solid ${x.mine ? 'rgba(200,255,61,.5)' : 'rgba(242,240,230,.10)'}`,
                          color: x.mine ? LIME : 'rgba(242,240,230,.6)',
                        }}
                      >
                        {x.emoji}
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>{x.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={panel}>
          <h2 style={{ ...sectionTitle, marginBottom: 6 }}>Le mur des trophées</h2>
          <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(242,240,230,.5)' }}>Ça ne se mange pas, mais ça se ressort au barbecue.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10 }}>
            {vm.trophies.map((t, i) => (
              <div
                key={i}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: t.highlight ? 'rgba(200,255,61,.10)' : '#0E100C',
                  border: `1px solid ${t.highlight ? 'rgba(200,255,61,.3)' : 'rgba(242,240,230,.09)'}`,
                }}
              >
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 15, marginTop: 8, textTransform: 'uppercase', letterSpacing: '.03em' }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(242,240,230,.5)', marginTop: 3 }}>{t.who}</div>
              </div>
            ))}
          </div>
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

const ctaBtn: React.CSSProperties = {
  marginTop: 16,
  padding: '12px 20px',
  background: LIME,
  border: 'none',
  borderRadius: 999,
  color: '#0E100C',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

function StatCard({ label, big, small, smallColor }: { label: string; big: string; small: string; smallColor: string }) {
  return (
    <div style={{ padding: '16px 20px', background: PANEL, border: '1px solid rgba(242,240,230,.10)', borderRadius: 16, minWidth: 148 }}>
      <div style={{ fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(242,240,230,.45)' }}>{label}</div>
      <div style={{ fontFamily: 'Anton, sans-serif', fontSize: 27, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{big}</div>
      <div style={{ fontSize: 13, color: smallColor, fontVariantNumeric: 'tabular-nums' }}>{small}</div>
    </div>
  );
}
