// Self-check for buildTrophies. No test runner in this project, so run it with
// the esbuild that ships with vite:
//   npx esbuild src/lib/compute.check.ts --bundle --platform=node --outfile=check.mjs && node check.mjs && rm check.mjs
import { buildTrophies, dashboard, validateProfile } from './compute';
import type { Entry, Member } from '../types';

const D = (iso: string) => Date.parse(iso + 'T00:00:00Z');
// Week 0 = Mon 27 Jul 2026 (Monday of the week containing BASE_DATE).
const e = (week: number, iso: string, weight: number): Entry => ({
  id: iso, profileId: '', week, date: D(iso), weight,
  taille: null, hanches: null, poitrine: null, bras: null, cuisse: null, mg: null, note: '',
});
const member = (name: string, start: number, entries: Entry[], target = start - 10): Member => ({
  id: name, name, color: '#fff', start, target, roast: '', isMe: false, entries,
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

ok(who('Le patron') === 'Alice', 'meilleure progression vers son objectif');
ok(who('Coup de massue') === 'Alice', 'meilleure semaine');
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
const feedTextOf = (vm: ReturnType<typeof dashboard>, name: string) =>
  vm.feed.find((f) => f.name === name)?.text ?? '';
const feedOf = (name: string) => feedTextOf(feed, name);

ok(feedOf('Alice').includes('(−2 kg)'), 'note + poids + écart avec la pesée précédente');
ok(!feedOf('Solo').includes('kg)'), 'aucun écart affiché sur une première pesée');

// Chart: one dot per weigh-in, not just the last one.
const dots = feed.chart.series.find((s) => s.name === 'Alice')?.dots ?? [];
ok(dots.length === 4, `4 points pour 4 pesées, reçu ${dots.length}`);

// Profile rules, shared by onboarding and settings.
ok(validateProfile('Marco', 96, 84) === null, 'un profil valide passe');
ok(validateProfile('  ', 96, 84) !== null, 'nom vide refusé');
ok(validateProfile('Marco', NaN, 84) !== null, 'poids non numérique refusé');
ok(validateProfile('Marco', 20, 15) !== null, 'poids sous 30 kg refusé');
ok(validateProfile('Marco', 300, 84) !== null, 'poids au-dessus de 250 kg refusé');
ok(validateProfile('Marco', 96, 96) !== null, 'objectif égal au départ refusé');
ok(validateProfile('Théo', 60, 72) === null, 'un objectif au-dessus du départ est accepté');

// ---- Prise de poids : scoré sur son propre objectif, pas sur le déficit ----
// Théo vise +12 kg et en a pris 3 ; Alice vise −10 kg et en a perdu 4.
const theo = member('Théo', 60, [
  e(0, '2026-07-27', 60), e(1, '2026-08-03', 61), e(2, '2026-08-10', 60.5), e(3, '2026-08-17', 63),
], 72);
const mixed = dashboard([alice, theo], '', 'pct', {}, {});
const rankOf = (name: string) => mixed.ranking.find((r) => r.name.startsWith(name));

ok(rankOf('Théo')?.pct === '5%', `+3 kg sur 60 = 5 % de progression, reçu ${rankOf('Théo')?.pct}`);
ok(rankOf('Alice')?.pct === '5%', 'Alice a exactement la même progression avec −4 kg sur 80');
ok(rankOf('Théo')!.barWidth > 0, 'la barre du preneur de poids n’est pas écrasée');

// Sa semaine +2.5 kg est un progrès, pas une rechute : couleur neutre, pas orange.
ok(rankOf('Théo')?.delta === '+2.5 kg', 'l’écart brut reste affiché tel quel');
ok(rankOf('Théo')?.deltaColor !== '#FF7A2F', 'une prise de poids voulue n’est pas signalée en rouge');
ok(rankOf('Alice')?.deltaColor !== '#FF7A2F', 'une perte voulue non plus');

ok(mixed.bestWeekName === 'Théo', `meilleur de la semaine = +2.5 kg voulus, reçu ${mixed.bestWeekName}`);
ok(feedTextOf(mixed, 'Théo').includes('a pris 2.5 kg'), 'le feed dit « a pris », pas « a repris »');

// Le graphe de progression monte pour les deux : dernier point plus haut que le premier.
const theoDots = mixed.chart.series.find((s) => s.name === 'Théo')!.dots;
ok(theoDots[3].y < theoDots[0].y, 'la courbe du preneur de poids monte quand il progresse');

// Trophées : ses records se mesurent dans son sens à lui.
const tMixed = buildTrophies([alice, theo], 3);
const whoMixed = (title: string) => tMixed.find((x) => x.title === title)?.who ?? '';
const noteMixed = (title: string) => tMixed.find((x) => x.title === title)?.note ?? '';

ok(whoMixed('Coup de massue') === 'Théo', 'meilleure semaine = +2.5 kg voulus');
ok(noteMixed('Coup de massue').includes('+2.5 kg'), 'annoncé en positif pour lui');
ok(whoMixed('Effet yoyo') === 'Théo', 'sa semaine à −0.5 kg est la seule régression du groupe');
ok(noteMixed('Effet yoyo').includes('−0.5 kg'), 'annoncée en négatif pour lui');

// Objectif atteint dans les deux sens.
ok(buildTrophies([member('Grand', 60, [e(0, '2026-07-27', 75)], 72)], 0)
  .some((x) => x.title === 'Objectif atteint'), 'cible dépassée par le haut = atteinte');
ok(!buildTrophies([member('Petit', 60, [e(0, '2026-07-27', 61)], 72)], 0)
  .some((x) => x.title === 'Objectif atteint'), 'en dessous de sa cible haute = pas atteinte');

console.log(`OK — ${t.length} trophées, feed, graphe, validation et prise de poids vérifiés`);
