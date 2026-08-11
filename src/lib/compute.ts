// Pure view-model builders ported faithfully from the original Balance mockup logic.
import { ACCENT, BASE_DATE, FIELDS, INK, LIME, ORANGE, WEEK_MS } from '../theme';
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
  name: string;
  weight: number;
  color: string;
  d: string;
  w: number;
  op: number;
  lx: number;
  ly: number;
}

// Monday of the week containing BASE_DATE — the group weighs in on Mondays,
// so calendar weeks are bucketed Mon-Sun rather than from BASE_DATE itself.
const WEEK_ANCHOR = BASE_DATE - ((new Date(BASE_DATE).getUTCDay() + 6) % 7) * 86400000;
const calWeek = (date: number) => Math.floor((date - WEEK_ANCHOR) / WEEK_MS);

export function groupChart(members: Member[], metric: 'pct' | 'kg', hidden: Record<string, boolean>, meId: string) {
  const W = 900, H = 330, PAD = 14;
  const maxWeek = members.length ? Math.max(...members.map((m) => calWeek(last(m).date))) : 0;
  let lo: number, hi: number;
  if (metric === 'pct') {
    lo = -2;
    hi = Math.max(6, Math.ceil(Math.max(...members.map((m) => pctLost(m)), 0) + 1.5));
  } else {
    const all = members.reduce<number[]>((a, m) => a.concat(m.entries.map((e) => e.weight)), []);
    lo = Math.floor(Math.min(...all) - 3);
    hi = Math.ceil(Math.max(...all) + 3);
  }
  const x = (wk: number) => (wk / Math.max(1, maxWeek)) * (W - 8) + 4;
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);

  const series: Series[] = members.map((m) => {
    const pts = m.entries.map((e) => [x(calWeek(e.date)), y(metric === 'pct' ? ((m.start - e.weight) / m.start) * 100 : e.weight)]);
    const off = !!hidden[m.id];
    const lp = pts[pts.length - 1];
    return { id: m.id, name: m.name, weight: last(m).weight, color: m.color, d: path(pts), w: m.id === meId ? 3.5 : 2, op: off ? 0.06 : 1, lx: lp[0], ly: lp[1] };
  });

  const yLabels: string[] = [];
  for (let i = 0; i < 5; i++) {
    const v = hi - ((hi - lo) * i) / 4;
    yLabels.push(metric === 'pct' ? r1(v) + '%' : Math.round(v) + ' kg');
  }

  // One label per week: they naturally dedupe and pack closer together
  // (space-between layout) as the contest runs for more weeks.
  const xLabels: string[] = [];
  for (let wk = 0; wk <= maxWeek; wk++) xLabels.push(String(wk + 1));
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
    dots: pts.map((p, i) => ({ x: p[0], y: p[1], label: fmtDate(es[i].date) + ' — ' + es[i].weight + ' kg' })),
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

// ---- Trophies ----------------------------------------------------------------

export interface Trophy {
  icon: string;
  title: string;
  who: string;
  note: string;
  tone: 'good' | 'bad';
}

// Everything is derived from the entries: no trophy is stored anywhere.
// "Due" weeks start at each member's own first weigh-in, so people who joined
// in week 2 or 3 are never blamed for the weeks before they existed.
export function buildTrophies(members: Member[], maxWeek: number): Trophy[] {
  const stats = members.filter(hasEntries).map((m) => {
    const es = m.entries;
    const weeks = [...new Set(es.map((e) => calWeek(e.date)))].sort((a, b) => a - b);
    let run = 1, bestStreak = 1;
    for (let i = 1; i < weeks.length; i++) {
      run = weeks[i] - weeks[i - 1] === 1 ? run + 1 : 1;
      if (run > bestStreak) bestStreak = run;
    }
    let drop = 0, gain = 0;
    for (let i = 1; i < es.length; i++) {
      const d = es[i].weight - es[i - 1].weight;
      if (d < drop) drop = d;
      if (d > gain) gain = d;
    }
    // Weigh-in dates are date-only columns parsed as UTC midnight, so UTC day
    // is the real day. calWeek() buckets Mon-Sun, hence Sunday = last minute.
    const days = es.map((e) => new Date(e.date).getUTCDay());
    const taille = es.map((e) => e.taille).filter((v): v is number => v != null);
    const w3 = es.slice(-3).map((e) => e.weight);
    return {
      m,
      pct: pctLost(m),
      count: es.length,
      joinWeek: weeks[0],
      missed: maxWeek - weeks[0] + 1 - weeks.length,
      bestStreak,
      drop: r1(drop),
      gain: r1(gain),
      late: days.filter((d) => d !== 1).length,
      sundays: days.filter((d) => d === 0).length,
      tailleLost: taille.length > 1 ? r1(taille[0] - taille[taille.length - 1]) : 0,
      flat: w3.length === 3 && Math.max(...w3) - Math.min(...w3) <= 0.3,
      reached: last(m).weight <= m.target,
    };
  });

  type Stat = (typeof stats)[number];
  const out: Trophy[] = [];
  const add = (icon: string, title: string, who: string, note: string, tone: Trophy['tone'] = 'good') => {
    if (who) out.push({ icon, title, who, note, tone });
  };
  const top = (score: (s: Stat) => number) => {
    const w = stats.slice().sort((a, b) => score(b) - score(a))[0];
    return w && score(w) > 0 ? w : null;
  };
  const all = (ok: (s: Stat) => boolean) => stats.filter(ok).map((s) => s.m.name).join(', ');

  const boss = top((s) => s.pct);
  if (boss) add('🥇', 'Le patron', boss.m.name, r1(boss.pct) + ' % envolés depuis le début');

  const smash = top((s) => -s.drop);
  if (smash) add('💥', 'Coup de massue', smash.m.name, smash.drop + ' kg en une seule semaine');

  add('🎯', 'Objectif atteint', all((s) => s.reached), 'La cible est déjà dans le rétroviseur');

  const metro = top((s) => s.bestStreak - 1);
  if (metro) add('🔗', 'Métronome', metro.m.name, metro.bestStreak + ' semaines d’affilée sans faillir');

  add('⏰', 'Pile à l’heure', all((s) => s.count > 1 && s.late === 0), 'Toujours le lundi. Jamais un jour de plus.');
  add('💯', 'Sans faute', all((s) => s.count > 1 && s.missed === 0), 'Zéro semaine sautée depuis son arrivée');

  const pilier = top((s) => s.count);
  if (pilier) add('🏋️', 'Le pilier', pilier.m.name, pilier.count + ' pesées au compteur');

  const ruban = top((s) => s.tailleLost);
  if (ruban) add('📏', 'Le mètre ruban', ruban.m.name, '−' + ruban.tailleLost + ' cm de tour de taille');

  add('🌱', 'Petit nouveau', all((s) => s.joinWeek > 0), 'Arrivé après le coup d’envoi, et ça se voit');

  const slow = top((s) => s.late);
  if (slow) add('🐌', 'Le retardataire', slow.m.name, slow.late + ' pesées un autre jour que lundi', 'bad');

  add('👻', 'Le fantôme', all((s) => s.missed > 0), 'Au moins une semaine portée disparue', 'bad');

  const yoyo = top((s) => s.gain);
  if (yoyo) add('🎢', 'Effet yoyo', yoyo.m.name, '+' + yoyo.gain + ' kg repris d’un coup', 'bad');

  add('🛋️', 'Le plateau', all((s) => s.flat), 'Trois pesées, la même balance, aucun suspense', 'bad');
  add('🌙', 'Rattrapage du dimanche', all((s) => s.sundays > 0), 'Pesée in extremis avant la fin de semaine', 'bad');

  return out;
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
      roast: m.roast,
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

  const trophies = buildTrophies(members, maxWeek);

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
