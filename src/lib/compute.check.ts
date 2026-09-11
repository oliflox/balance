// Self-check for buildTrophies. No test runner in this project, so run it with
// the esbuild that ships with vite:
//   npx esbuild src/lib/compute.check.ts --bundle --platform=node --outfile=check.mjs && node check.mjs && rm check.mjs
import { buildTrophies, calWeek, dashboard, errMessage, personVals, validateProfile } from './compute';
import { hrefFor, parseRoute } from './route';
import type { Entry, Member } from '../types';

const D = (iso: string) => Date.parse(iso + 'T00:00:00Z');
// Week 0 = Mon 27 Jul 2026 (Monday of the week containing BASE_DATE). The week
// a weigh-in belongs to is derived from its date, exactly as data.ts does it.
const e = (iso: string, weight: number): Entry => ({
  id: iso, profileId: '', week: calWeek(D(iso)), date: D(iso), weight,
  taille: null, hanches: null, poitrine: null, bras: null, cuisse: null, mg: null, note: '',
});
// joined defaults to the first weigh-in, like a profile with no creation date.
const member = (name: string, start: number, entries: Entry[], target = start - 10, joined = entries[0]?.date ?? 0): Member => ({
  id: name, name, color: '#fff', start, target, roast: '', joined, isMe: false, entries,
});

const alice = member('Alice', 80, [
  e('2026-07-27', 80), e('2026-08-03', 79), e('2026-08-10', 78), e('2026-08-17', 76),
]);
// Joined in week 2, second weigh-in on a Wednesday.
const bob = member('Bob', 100, [e('2026-08-10', 100), e('2026-08-19', 99)]);
// Skipped week 2, weighed on a Saturday then a Sunday: a confirmed break.
const carol = member('Carol', 60, [e('2026-07-27', 60), e('2026-08-08', 59.8), e('2026-08-23', 59.5)]);

// nowWeek = 3: the league is in the week of Carol's comeback.
const t = buildTrophies([alice, bob, carol], 3);
const who = (title: string) => t.find((x) => x.title === title)?.who ?? '';

const ok = (cond: boolean, msg: string) => {
  if (!cond) throw new Error('FAIL: ' + msg + '\n' + t.map((x) => `${x.title} → ${x.who}`).join('\n'));
};

ok(who('Le patron') === 'Alice', 'meilleure progression vers son objectif');
ok(who('Coup de massue') === 'Alice', 'meilleure semaine');
ok(who('Métronome') === 'Alice', 'plus longue série');
ok(who('Sans faute') === 'Alice, Bob', 'Bob a rejoint tard mais n’a rien loupé depuis');
ok(who('Petit nouveau') === 'Bob', 'seul arrivé il y a moins de deux semaines');
ok(who('Le fantôme') === 'Carol', 'seule à avoir sauté une semaine puis refait surface');
ok(who('Rattrapage du dimanche') === 'Carol', 'pesée un dimanche');
ok(!t.some((x) => x.title === 'Le retardataire'), 'plus de trophée lié au jour de la pesée');
ok(who('Le pilier') === 'Alice', '4 pesées');
ok(!t.some((x) => x.title === 'Objectif atteint'), 'personne n’a atteint sa cible');

// ---- Les trophées récents sortent de la liste au bout de deux semaines ----
// Chacun compte ses deux semaines depuis son propre événement : l'arrivée pour
// Bob (semaine 2), le retour et le dimanche pour Carol (semaine 3).
const titlesAt = (nowWeek: number) => buildTrophies([alice, bob, carol], nowWeek).map((x) => x.title);

ok(titlesAt(3).includes('Petit nouveau'), 'nouveau la semaine qui suit son arrivée');
ok(!titlesAt(4).includes('Petit nouveau'), 'plus nouveau deux semaines après son arrivée');
ok(titlesAt(4).includes('Le fantôme'), 'la coupure colle encore la semaine suivante');
ok(!titlesAt(5).includes('Le fantôme'), 'la coupure sort de la liste deux semaines après');
ok(titlesAt(4).includes('Rattrapage du dimanche'), 'le dimanche colle encore la semaine suivante');
ok(!titlesAt(5).includes('Rattrapage du dimanche'), 'le dimanche sort de la liste deux semaines après');
// Carol reste assidue depuis son retour : ça ne l'absout pas plus tôt.
ok(buildTrophies([alice, bob, { ...carol, entries: [...carol.entries, e('2026-08-31', 59.2)] }], 4)
  .some((x) => x.title === 'Le fantôme'), 'redevenir assidu n’efface pas la coupure avant deux semaines');
// Un trou pas encore refermé n'est pas une coupure : elle peut encore se peser.
ok(!buildTrophies([member('Absente', 70, [e('2026-07-27', 70), e('2026-08-03', 70)])], 5)
  .some((x) => x.title === 'Le fantôme'), 'une absence en cours n’est pas encore une coupure');

// Feed: a note must carry the delta, but only when there is a previous weigh-in.
const solo = member('Solo', 90, [e('2026-08-17', 89)]);
solo.entries[0].note = 'première';
alice.entries[3].note = 'raclette';
const feed = dashboard([alice, solo], '', 'pct', {}, {}, 3);
const feedTextOf = (vm: ReturnType<typeof dashboard>, name: string) =>
  vm.feed.find((f) => f.name === name)?.text ?? '';
const feedOf = (name: string) => feedTextOf(feed, name);

ok(feedOf('Alice') === '« raclette » — 76 kg (−2 kg)', `note, poids, écart : reçu ${feedOf('Alice')}`);
ok(feedOf('Solo') === '« première » — 89 kg', `aucun écart sur une première pesée : reçu ${feedOf('Solo')}`);

// Chart: one dot per weigh-in, not just the last one.
const dotsOf = (vm: ReturnType<typeof dashboard>, name: string) =>
  vm.chart.dots.filter((d) => d.items.some((i) => i.name === name));
ok(dotsOf(feed, 'Alice').length === 4, `4 points pour 4 pesées, reçu ${dotsOf(feed, 'Alice').length}`);

// ---- Points superposés : un seul point, tout le monde dans l'infobulle ----
const clone = member('Clone', 80, alice.entries.slice(), 70);
const stacked = dashboard([alice, clone], '', 'kg', {}, {}, 3);
ok(stacked.chart.dots.length === 4, `4 points fusionnés pour 2 courbes identiques, reçu ${stacked.chart.dots.length}`);
ok(stacked.chart.dots.every((d) => d.items.length === 2), 'chaque point porte les deux membres');
ok(stacked.chart.dots[0].items.map((i) => i.name).join() === 'Alice,Clone', 'les deux noms, avec leur poids');

// Écartés de plus de deux rayons : deux points distincts, pas de fusion abusive.
const apart = dashboard([alice, member('Loin', 120, [e('2026-07-27', 120)], 110)], '', 'kg', {}, {}, 3);
ok(apart.chart.dots.filter((d) => d.x === apart.chart.dots[0].x).every((d) => d.items.length === 1),
  'deux poids éloignés gardent chacun leur point');

// Un membre masqué sort des points : plus d'infobulle fantôme.
const masked = dashboard([alice, clone], '', 'kg', { [clone.id]: true }, {}, 3);
ok(masked.chart.dots.every((d) => d.items.length === 1 && d.items[0].name === 'Alice'), 'le membre masqué n’a plus de point');

// ---- Pesées possibles : comptées depuis l'arrivée de chacun ----
// Alice est là depuis la semaine 0 (4 dues à la semaine 3), Bob depuis la 2 (2 dues).
const owed = dashboard([alice, bob], '', 'kg', {}, {}, 3);
ok(owed.totalPossible === 6, `4 + 2 pesées dues, pas 2 × 4, reçu ${owed.totalPossible}`);
ok(owed.totalEntries === 6, '6 pesées enregistrées');

// Inscrit en semaine 0 mais première pesée en semaine 2 : les deux semaines
// sans pesée lui sont comptées, elles n'étaient pas hors de sa portée.
const tardif = member('Tardif', 90, [e('2026-08-10', 90), e('2026-08-17', 89)], 80, D('2026-07-27'));
ok(dashboard([tardif], '', 'kg', {}, {}, 3).totalPossible === 4, 'compté depuis la création du compte');
ok(buildTrophies([tardif], 3).every((x) => x.title !== 'Sans faute'), 'deux semaines sautées après son inscription');
ok(buildTrophies([tardif], 3).every((x) => x.title !== 'Petit nouveau'), 'inscrit depuis trop longtemps pour être nouveau');

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
  e('2026-07-27', 60), e('2026-08-03', 61), e('2026-08-10', 60.5), e('2026-08-17', 63),
], 72);
const mixed = dashboard([alice, theo], '', 'pct', {}, {}, 3);
const rankOf = (name: string) => mixed.ranking.find((r) => r.name.startsWith(name));

ok(rankOf('Théo')?.pct === '5%', `+3 kg sur 60 = 5 % de progression, reçu ${rankOf('Théo')?.pct}`);
ok(rankOf('Alice')?.pct === '5%', 'Alice a exactement la même progression avec −4 kg sur 80');
ok(rankOf('Théo')!.barWidth > 0, 'la barre du preneur de poids n’est pas écrasée');

// Sous le %, les kilos du parcours entier — pas ceux de la dernière semaine.
ok(rankOf('Théo')?.delta === '+3 kg', `+3 kg pris au total (et non +2.5 la semaine), reçu ${rankOf('Théo')?.delta}`);
ok(rankOf('Alice')?.delta === '-4 kg', `−4 kg perdus au total, reçu ${rankOf('Alice')?.delta}`);
// Une prise de poids voulue reste un progrès : couleur neutre, pas orange.
ok(rankOf('Théo')?.deltaColor !== '#FF7A2F', 'une prise de poids voulue n’est pas signalée en rouge');
ok(rankOf('Alice')?.deltaColor !== '#FF7A2F', 'une perte voulue non plus');

ok(mixed.bestWeekName === 'Théo', `meilleur de la semaine = +2.5 kg voulus, reçu ${mixed.bestWeekName}`);
ok(feedTextOf(mixed, 'Théo') === 'a pris du galon — 63 kg (+2.5 kg)',
  `une prise voulue se lit comme un progrès : reçu ${feedTextOf(mixed, 'Théo')}`);
// Toutes les lignes finissent pareil : poids, puis écart. La vanne suit, si elle existe.
ok(mixed.feed.every((f) => / — [\d.]+ kg( \([+−±][\d.]+ kg\))?(\.|$)/.test(f.text)),
  'même fin pour toutes les lignes du fil');

// Le graphe de progression monte pour les deux : dernier point plus haut que le premier.
const theoDots = dotsOf(mixed, 'Théo');
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
ok(buildTrophies([member('Grand', 60, [e('2026-07-27', 75)], 72)], 0)
  .some((x) => x.title === 'Objectif atteint'), 'cible dépassée par le haut = atteinte');
ok(!buildTrophies([member('Petit', 60, [e('2026-07-27', 61)], 72)], 0)
  .some((x) => x.title === 'Objectif atteint'), 'en dessous de sa cible haute = pas atteinte');

// ---- Une room neuve démarre à la semaine 1, pas à celle de l'appli ----
// Room ouverte en semaine 6 (absolue), une seule pesée, on est en semaine 6.
const neuf = member('Neuf', 90, [e('2026-09-07', 90)], 80, D('2026-09-07'));
const perso = personVals(neuf, neuf.id, 6, 6);
ok(perso.weeks.length === 1, `une seule case pour une room d'une semaine, reçu ${perso.weeks.length}`);
ok(perso.weeks[0].on, 'et elle est cochée, la pesée est faite');
ok(perso.weeks[0].label.startsWith('S1'), `la première case est S1, reçu ${perso.weeks[0].label}`);
ok(dashboard([neuf], neuf.id, 'kg', {}, {}, 6, 6).weekNo === 1, 'le bandeau annonce la semaine 1');

// Deux semaines plus tard, sans nouvelle pesée : le trou doit se voir.
const troue = personVals(neuf, neuf.id, 8, 6);
ok(troue.weeks.length === 3, `trois cases en semaine 3, reçu ${troue.weeks.length}`);
ok(troue.weeks.filter((w) => !w.on).length === 2, 'deux semaines sautées, visibles comme telles');
ok(troue.weeks[2].label.endsWith('absent'), 'la semaine en cours est marquée absente');

// Arrivé en semaine 3 d'une room ouverte en semaine 6 absolue : on ne lui
// compte pas les semaines d'avant, mais son étiquette reste celle de la room.
const tardif2 = member('Tardif', 70, [e('2026-09-21', 70)], 60, D('2026-09-21'));
const vuTardif = personVals(tardif2, tardif2.id, 8, 6);
ok(vuTardif.weeks.length === 1, `une case pour qui vient d'arriver, reçu ${vuTardif.weeks.length}`);
ok(vuTardif.weeks[0].label.startsWith('S3'), `étiquetée S3, la semaine de la room, reçu ${vuTardif.weeks[0].label}`);

// ---- Messages d'erreur : ne jamais avaler ce que Postgres a dit ----
ok(errMessage(new Error('boum')) === 'boum', 'une vraie Error');
ok(errMessage({ message: 'new row violates row-level security policy', code: '42501' })
  === 'new row violates row-level security policy (42501)', 'un objet nu Supabase, code compris');
ok(errMessage({ message: 'permission denied', hint: 'GRANT SELECT…' }).includes('GRANT SELECT'),
  'le hint est conservé, c’est souvent lui qui donne la solution');
ok(errMessage({}, 'repli') === 'repli', 'un objet vide retombe sur le repli');
ok(errMessage(undefined, 'repli') === 'repli', 'undefined aussi');

// ---- Routes : l'URL doit survivre à l'aller-retour, et l'inconnu tomber en 404 ----
const roundTrip = (r: Parameters<typeof hrefFor>[0]) => JSON.stringify(parseRoute(hrefFor(r))) === JSON.stringify(r);

ok(roundTrip({ name: 'dash' }), 'le groupe');
ok(roundTrip({ name: 'me' }), 'mon suivi');
ok(roundTrip({ name: 'me', id: 'abc-123' }), 'le suivi de quelqu’un d’autre');
ok(roundTrip({ name: 'settings' }), 'les réglages');
ok(parseRoute('').name === 'dash', 'une URL sans hash ouvre le groupe');
ok(parseRoute('#/inconnu').name === '404', 'une route inconnue tombe en 404');
ok(parseRoute('#/membre').name === '404', 'un suivi sans identifiant aussi');
// Supabase pose ses jetons dans le hash : ce n'est pas une route, pas un 404.
ok(parseRoute('#access_token=xyz&type=recovery').name === 'dash', 'les jetons Supabase ne sont pas une route');

console.log(`OK — ${t.length} trophées, feed, graphe, routes, validation et prise de poids vérifiés`);
