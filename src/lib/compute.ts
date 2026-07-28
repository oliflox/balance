// Pure view-model builders ported faithfully from the original Balance mockup logic.
import { ACCENT, BASE_DATE, FIELDS, INK, LIME, ORANGE, SHOW_ROASTS, WEEK_MS } from '../theme';
import type { Member, ReactionIndex } from '../types';

export const r1 = (n: number) => Math.round(n * 10) / 10;

export const initialsOf = (name: string) => name.slice(0, 2).toUpperCase();

export function fmtDate(ts: number, long = false): string {
  return new Date(ts).toLocaleDateString(
    'fr-FR',
    long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: '2-digit', month: 'short' }
  );
}

export const last = (m: Member) => m.entries[m.entries.length - 1];
export const hasEntries = (m: Member) => m.entries.length > 0;

export function pctLost(m: Member): number {
  const l = last(m);
  return ((m.start - l.weight) / m.start) * 100;
}

export const path = (pts: number[][]) =>
  pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');

// ---- Group chart (all members' curves) ---------------------------------------

export interface Series {
  id: string;
  color: string;
  d: string;
  w: number;
  op: number;
  lx: number;
  ly: number;
}

export function groupChart(members: Member[], metric: 'pct' | 'kg', hidden: Record<string, boolean>, meId: string) {
  const W = 900, H = 330, PAD = 14;
  const maxWeek = members.length ? Math.max(...members.map((m) => last(m).week)) : 0;
  let lo: number, hi: number;
  if (metric === 'pct') {
    lo = -2;
    hi = Math.max(6, Math.ceil(Math.max(...members.map((m) => pctLost(m)), 0) + 1.5));
  } else {
    const all = members.reduce<number[]>((a, m) => a.concat(m.entries.map((e) => e.weight)), []);
    lo = Math.floor(Math.min(...all) - 3);
    hi = Math.ceil(Math.max(...all) + 3);
  }
  const x = (w: number) => (w / Math.max(1, maxWeek)) * (W - 8) + 4;
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);

  const series: Series[] = members.map((m) => {
    const pts = m.entries.map((e) => [x(e.week), y(metric === 'pct' ? ((m.start - e.weight) / m.start) * 100 : e.weight)]);
    const off = !!hidden[m.id];
    const lp = pts[pts.length - 1];
    return { id: m.id, color: m.color, d: path(pts), w: m.id === meId ? 3.5 : 2, op: off ? 0.06 : 1, lx: lp[0], ly: lp[1] };
  });

  const yLabels: string[] = [];
  for (let i = 0; i < 5; i++) {
    const v = hi - ((hi - lo) * i) / 4;
    yLabels.push(metric === 'pct' ? r1(v) + '%' : Math.round(v) + ' kg');
  }
  const xLabels: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const wk = Math.round((maxWeek * i) / 4);
    xLabels.push(fmtDate(BASE_DATE + wk * WEEK_MS));
  }
  return { series, yLabels, xLabels, maxWeek };
}

export const gridLines = () => [0, 1, 2, 3, 4].map((i) => ({ y: 14 + (i * (330 - 28)) / 4, y2: 16 + (i * (300 - 32)) / 4 }));

// ---- Personal page -----------------------------------------------------------

export function personVals(m: Member, meId: string) {
  const es = m.entries;
  const l = es[es.length - 1];
  const W = 900, H = 300, PAD = 16;
  const maxWeek = l.week;
  const all = es.map((e) => e.weight).concat([m.target]);
  const lo = Math.floor(Math.min(...all) - 1.5);
  const hi = Math.ceil(Math.max(...all) + 1.5);
  const x = (w: number) => (w / Math.max(1, maxWeek)) * (W - 10) + 5;
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);
  const pts = es.map((e) => [x(e.week), y(e.weight)]);

  const lost = m.start - l.weight;
  const need = m.start - m.target;
  const progress = Math.max(0, Math.min(100, Math.round((lost / need) * 100)));
  const C = 2 * Math.PI * 50;

  let streak = 1;
  for (let i = es.length - 1; i > 0; i--) {
    if (es[i].week - es[i - 1].week === 1) streak++;
    else break;
  }

  const weekSet: Record<number, (typeof es)[number]> = {};
  es.forEach((e) => (weekSet[e.week] = e));
  const weeks: { on: boolean; label: string; color: string }[] = [];
  for (let k = 0; k <= maxWeek; k++) {
    const on = !!weekSet[k];
    weeks.push({
      on,
      color: on ? m.color : 'rgba(242,240,230,.12)',
      label: 'S' + (k + 1) + (on ? ' · ' + weekSet[k].weight + ' kg' : ' · absent'),
    });
  }

  const measures = FIELDS.map((f) => {
    const vals = es.map((e) => (e[f.key] ?? 0) as number);
    const mn = Math.min(...vals), mx = Math.max(...vals), sp = mx - mn || 1;
    const sp2 = vals.map((v, i) => [(i / Math.max(1, vals.length - 1)) * 196 + 2, 50 - ((v - mn) / sp) * 42]);
    const d = r1(vals[vals.length - 1] - vals[0]);
    return {
      label: f.label,
      unit: f.unit,
      value: vals[vals.length - 1],
      color: m.color,
      d: path(sp2),
      delta: (d > 0 ? '+' : '') + d + ' ' + f.unit,
      deltaColor: d <= 0 ? LIME : ORANGE,
    };
  });

  const history = es
    .slice()
    .reverse()
    .map((e, i, arr) => {
      const prev = arr[i + 1];
      const d = prev ? r1(e.weight - prev.weight) : 0;
      return {
        date: fmtDate(e.date),
        weight: e.weight + ' kg',
        delta: prev ? (d > 0 ? '+' : '') + d : '—',
        deltaColor: !prev ? 'rgba(242,240,230,.4)' : d <= 0 ? LIME : ORANGE,
        taille: e.taille ?? '—',
        hanches: e.hanches ?? '—',
        bras: e.bras ?? '—',
        cuisse: e.cuisse ?? '—',
        poitrine: e.poitrine ?? '—',
        mg: e.mg != null ? e.mg + ' %' : '—',
      };
    });

  return {
    name: m.name,
    color: m.color,
    initials: initialsOf(m.name),
    isMe: m.id === meId,
    subtitle: m.id === meId ? 'Mon suivi personnel' : 'Suivi de ' + m.name + ' (mode espion)',
    target: m.target,
    range: fmtDate(es[0].date) + ' → ' + fmtDate(l.date),
    line: path(pts),
    area:
      path(pts) +
      ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - PAD) +
      ' L' + pts[0][0].toFixed(1) + ' ' + (H - PAD) + ' Z',
    targetLine: 'M5 ' + y(m.target).toFixed(1) + ' L895 ' + y(m.target).toFixed(1),
    dots: pts.map((p) => ({ x: p[0], y: p[1] })),
    progress,
    ring: ((C * progress) / 100).toFixed(1) + ' ' + C.toFixed(1),
    remaining:
      l.weight <= m.target
        ? 'Objectif atteint. Insupportable.'
        : 'Encore ' + r1(l.weight - m.target) + ' kg avant de crier victoire.',
    streak,
    streakNote:
      streak >= 5 ? 'Impressionnant. On attend la chute.' : streak >= 3 ? 'Ça tient. Pour l’instant.' : 'On a vu mieux, franchement.',
    weeks,
    measures,
    history,
    stats: [
      { label: 'Poids actuel', value: l.weight + ' kg', color: INK },
      { label: 'Depuis le début', value: (lost > 0 ? '−' : '+') + r1(Math.abs(lost)) + ' kg', color: lost > 0 ? LIME : ORANGE },
      { label: '% perdu', value: r1((lost / m.start) * 100) + ' %', color: LIME },
      { label: 'Masse grasse', value: (l.mg ?? '—') + ' %', color: INK },
    ],
  };
}

// ---- Dashboard ---------------------------------------------------------------

export function dashboard(members: Member[], meId: string, metric: 'pct' | 'kg', hidden: Record<string, boolean>, reactions: ReactionIndex) {
  const chart = groupChart(members, metric, hidden, meId);
  const maxWeek = chart.maxWeek;
  const sorted = members.slice().sort((a, b) => pctLost(b) - pctLost(a));
  const maxPct = (sorted.length ? pctLost(sorted[0]) : 0) || 1;

  const deltas = members.map((m) => {
    const es = m.entries, l = es[es.length - 1], p = es[es.length - 2];
    return { m, d: p ? r1(l.weight - p.weight) : 0 };
  });
  const best = deltas.slice().sort((a, b) => a.d - b.d)[0];
  const worst = deltas.slice().sort((a, b) => b.d - a.d)[0];
  const totalLost = r1(members.reduce((a, m) => a + (m.start - last(m).weight), 0));
  const totalEntries = members.reduce((a, m) => a + m.entries.length, 0);

  const feed = deltas
    .slice()
    .sort((a, b) => last(b.m).date - last(a.m).date || a.d - b.d)
    .slice(0, 6)
    .map((x) => {
      const m = x.m, l = last(m);
      const txt = l.note
        ? '« ' + l.note + ' » — ' + l.weight + ' kg'
        : x.d < 0
        ? 'a lâché ' + Math.abs(x.d) + ' kg cette semaine. ' + l.weight + ' kg au compteur.'
        : x.d > 0
        ? 'a repris ' + x.d + ' kg. Personne n’est dupe. ' + l.weight + ' kg.'
        : 'stagne à ' + l.weight + ' kg. Le plateau, ce grand classique.';
      return {
        color: m.color,
        initials: initialsOf(m.name),
        name: m.name,
        text: txt,
        when: 'Semaine ' + (l.week + 1) + ' · ' + fmtDate(l.date),
        entryId: l.id,
        reactions: (['🔥', '💪', '😂', '🐐'] as const).map((emoji) => {
          const r = reactions[l.id]?.[emoji];
          return { emoji, count: r?.count ?? 0, mine: r?.mine ?? false };
        }),
      };
    });

  const ranking = sorted.map((m, i) => {
    const pct = pctLost(m);
    const d = deltas.find((x) => x.m.id === m.id)!.d;
    return {
      id: m.id,
      rank: i + 1,
      rankColor: i === 0 ? ACCENT : i === 1 ? INK : i === 2 ? ORANGE : 'rgba(242,240,230,.3)',
      name: m.name + (m.id === meId ? ' (toi)' : ''),
      initials: initialsOf(m.name),
      color: m.color,
      weight: last(m).weight,
      pct: r1(pct) + '%',
      pctColor: pct > 0 ? ACCENT : ORANGE,
      delta: (d > 0 ? '+' : '') + d + ' kg',
      deltaColor: d <= 0 ? 'rgba(242,240,230,.5)' : ORANGE,
      badge: i === 0 ? 'Leader' : m.entries.length === maxWeek + 1 ? 'Assidu' : '',
      roast: SHOW_ROASTS ? m.roast : last(m).note || m.entries.length + ' pesées enregistrées',
      barWidth: Math.max(3, (pct / maxPct) * 100),
      isMe: m.id === meId,
    };
  });

  const legend = members.map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
    pct: r1(pctLost(m)) + '%',
    hidden: !!hidden[m.id],
  }));

  const trophies = members.slice(0, 8).map((m, i) => ({
    icon: m.trophy[0] || '🥇',
    title: m.trophy[1] || 'Membre',
    who: m.name,
    highlight: i === 0,
  }));

  return {
    chart,
    weekNo: maxWeek + 1,
    totalLost,
    totalEntries,
    totalPossible: members.length * (maxWeek + 1),
    bestWeekName: best ? best.m.name : '—',
    bestWeekDelta: best ? best.d : 0,
    worstName: worst ? worst.m.name : '—',
    worstDelta: worst ? (worst.d > 0 ? '+' : '') + worst.d : '0',
    chartHint:
      metric === 'pct'
        ? 'Chacun part de son propre poids : le % perdu remet tout le monde à égalité.'
        : 'Poids brut, semaine par semaine. Cliquez sur un nom pour l’isoler.',
    feed,
    ranking,
    legend,
    trophies,
  };
}
