// Self-check for buildTrophies. No test runner in this project, so run it with
// the esbuild that ships with vite:
//   npx esbuild src/lib/compute.check.ts --bundle --platform=node --outfile=check.mjs && node check.mjs && rm check.mjs
import { buildTrophies, dashboard } from './compute';
import type { Entry, Member } from '../types';

const D = (iso: string) => Date.parse(iso + 'T00:00:00Z');
// Week 0 = Mon 27 Jul 2026 (Monday of the week containing BASE_DATE).
const e = (week: number, iso: string, weight: number): Entry => ({
  id: iso, profileId: '', week, date: D(iso), weight,
  taille: null, hanches: null, poitrine: null, bras: null, cuisse: null, mg: null, note: '',
});
const member = (name: string, start: number, entries: Entry[]): Member => ({
  id: name, name, color: '#fff', start, target: start - 10, roast: '', isMe: false, entries,
});

const alice = member('Alice', 80, [
  e(0, '2026-07-27', 80), e(1, '2026-08-03', 79), e(2, '2026-08-10', 78), e(3, '2026-08-17', 76),
]);
// Joined in week 2, one weigh-in on a Wednesday.
const bob = member('Bob', 100, [e(2, '2026-08-10', 100), e(3, '2026-08-19', 99)]);
// Skipped week 2, weighed on a Saturday then a Sunday.
const carol = member('Carol', 60, [e(0, '2026-07-27', 60), e(1, '2026-08-08', 59.8), e(3, '2026-08-23', 59.5)]);

const t = buildTrophies([alice, bob, carol], 3);
const who = (title: string) => t.find((x) => x.title === title)?.who ?? '';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error('FAIL: ' + msg + '\n' + t.map((x) => `${x.title} → ${x.who}`).join('\n'));
};

ok(who('Le patron') === 'Alice', 'meilleur % perdu');
ok(who('Coup de massue') === 'Alice', 'plus grosse perte hebdo');
ok(who('Métronome') === 'Alice', 'plus longue série');
ok(who('Pile à l’heure') === 'Alice', 'seule à ne peser que le lundi');
ok(who('Sans faute') === 'Alice, Bob', 'Bob a rejoint tard mais n’a rien loupé depuis');
ok(who('Petit nouveau') === 'Bob', 'seul à être arrivé après la semaine 1');
ok(who('Le fantôme') === 'Carol', 'seule à avoir sauté une semaine depuis son arrivée');
ok(who('Le retardataire') === 'Carol', '2 pesées hors lundi contre 1 pour Bob');
ok(who('Rattrapage du dimanche') === 'Carol', 'pesée un dimanche');
ok(who('Le pilier') === 'Alice', '4 pesées');
ok(!t.some((x) => x.title === 'Objectif atteint'), 'personne n’a atteint sa cible');

// Feed: a note must carry the delta, but only when there is a previous weigh-in.
const solo = member('Solo', 90, [e(3, '2026-08-17', 89)]);
solo.entries[0].note = 'première';
alice.entries[3].note = 'raclette';
const feed = dashboard([alice, solo], '', 'pct', {}, {});
const feedOf = (name: string) => feed.feed.find((f) => f.name === name)?.text ?? '';

ok(feedOf('Alice').includes('(−2 kg)'), 'note + poids + écart avec la pesée précédente');
ok(!feedOf('Solo').includes('kg)'), 'aucun écart affiché sur une première pesée');

// Chart: one dot per weigh-in, not just the last one.
const dots = feed.chart.series.find((s) => s.name === 'Alice')?.dots ?? [];
ok(dots.length === 4, `4 points pour 4 pesées, reçu ${dots.length}`);

console.log(`OK — ${t.length} trophées, feed et points du graphe vérifiés`);
