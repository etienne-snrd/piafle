// Tests de la logique du jeu : node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const especes = require("../data/species.json");
const { creerJeu, oiseauDuJour, dateDuJour, normaliser, comparerTailles } = require("../site/js/jeu.js");

function stockage() {
  const d = {};
  return { getItem: (k) => (k in d ? d[k] : null), setItem: (k, v) => (d[k] = String(v)) };
}
const jour = (iso) => () => new Date(iso);

test("la date suit l'heure de Paris", () => {
  assert.strictEqual(dateDuJour(new Date("2026-11-09T22:59:00Z")), "2026-11-09");
  assert.strictEqual(dateDuJour(new Date("2026-11-09T23:01:00Z")), "2026-11-10");
});

test("chaque espèce passe une fois par cycle de 100 jours", () => {
  const vus = new Set();
  for (let n = 1; n <= especes.length; n++) vus.add(oiseauDuJour(especes, n).id);
  assert.strictEqual(vus.size, especes.length);
});

test("tout le monde a le même oiseau le même jour", () => {
  const a = creerJeu({ especes, maintenant: jour("2026-11-12T08:00:00Z"), stockage: stockage() });
  const b = creerJeu({ especes, maintenant: jour("2026-11-12T20:00:00Z"), stockage: stockage() });
  a.proposer("Merle noir"); b.proposer("Merle noir");
  assert.deepStrictEqual(a.etat().essais, b.etat().essais);
  assert.strictEqual(a.etat().numero, 4);
});

test("victoire, indices et stats", () => {
  const s = stockage();
  const maintenant = jour("2026-11-09T10:00:00Z");
  const jeu = creerJeu({ especes, maintenant, stockage: s });
  const mystere = oiseauDuJour(especes, 1);
  const autre = especes.find((e) => e !== mystere);
  assert.deepStrictEqual(jeu.proposer(autre.nom_fr), { ok: true });
  let e = jeu.etat();
  assert.strictEqual(e.statut, "en_cours");
  assert.strictEqual(e.recadrage, 1);
  assert.deepStrictEqual(e.indices.map((i) => i.type), ["taille"]);
  assert.strictEqual(e.son, null);
  assert.strictEqual(e.oiseau, null);
  assert.strictEqual(jeu.proposer(autre.nom_fr).ok, false); // déjà proposé
  assert.strictEqual(jeu.proposer("Dodo").ok, false); // pas dans la liste
  assert.strictEqual(jeu.proposer(normaliser(mystere.nom_fr).toUpperCase()).ok, true); // accents/majuscules ignorés
  e = jeu.etat();
  assert.strictEqual(e.statut, "gagne");
  assert.strictEqual(e.oiseau.id, mystere.id);
  assert.strictEqual(e.recadrage, 5);
  assert.deepStrictEqual(e.stats, { joues: 1, gagnes: 1, serie: 1, meilleureSerie: 1, repartition: [0, 1, 0, 0, 0, 0] });
  assert.match(jeu.partage(), /^Piafle n°1 : 2\/6\n/);
  // La partie est retrouvée au rechargement de la page.
  const recharge = creerJeu({ especes, maintenant, stockage: s });
  assert.strictEqual(recharge.etat().statut, "gagne");
  assert.strictEqual(recharge.proposer(autre.nom_fr).ok, false);
});

test("défaite après 6 essais, série remise à zéro", () => {
  const s = stockage();
  s.setItem("piafle:stats", JSON.stringify({ joues: 3, gagnes: 3, serie: 3, meilleureSerie: 3, repartition: [1, 1, 1, 0, 0, 0], dernierJour: "2026-11-09" }));
  const jeu = creerJeu({ especes, maintenant: jour("2026-11-10T10:00:00Z"), stockage: s });
  const mystere = oiseauDuJour(especes, 2);
  const autres = especes.filter((e) => e !== mystere).slice(0, 7);
  for (const e of autres.slice(0, 6)) assert.ok(jeu.proposer(e.nom_fr).ok);
  assert.strictEqual(jeu.proposer(autres[6].nom_fr).ok, false);
  const e = jeu.etat();
  assert.strictEqual(e.statut, "perdu");
  assert.strictEqual(e.indices.length, 5);
  assert.ok(e.son);
  assert.strictEqual(e.stats.serie, 0);
  assert.strictEqual(e.stats.meilleureSerie, 3);
  assert.match(jeu.partage(), /X\/6/);
});

test("autocomplétion sans accents, début de nom d'abord", () => {
  const jeu = creerJeu({ especes, maintenant: jour("2026-11-09T10:00:00Z"), stockage: stockage() });
  const noms = jeu.suggestions("mesange").map((s) => s.nom_fr);
  assert.ok(noms.length >= 5 && noms.every((n) => n.startsWith("Mésange")));
  assert.strictEqual(jeu.suggestions("charbon")[0].nom_fr, "Mésange charbonnière");
  assert.strictEqual(jeu.suggestions("parus major")[0].nom_fr, "Mésange charbonnière");
  assert.deepStrictEqual(jeu.suggestions(""), []);
});

test("comparaison des tailles", () => {
  assert.strictEqual(comparerTailles({ envergure_cm: 20 }, { envergure_cm: 40 }), "plus_grand");
  assert.strictEqual(comparerTailles({ envergure_cm: 40 }, { envergure_cm: 20 }), "plus_petit");
  assert.strictEqual(comparerTailles({ envergure_cm: 21 }, { envergure_cm: 20 }), "proche");
  assert.strictEqual(comparerTailles({}, { envergure_cm: 20 }), null);
});

test("chaque espèce a au moins une photo", () => {
  assert.deepStrictEqual(especes.filter((e) => !e.photos.length).map((e) => e.nom_fr), []);
});

test("texte de partage : un œuf par essai raté, un poussin pour le bon", () => {
  const jeu = creerJeu({ especes, maintenant: jour("2026-11-09T10:00:00Z"), stockage: stockage() });
  const mystere = oiseauDuJour(especes, 1);
  const autres = especes.filter((e) => e !== mystere).slice(0, 2);
  autres.forEach((e) => jeu.proposer(e.nom_fr));
  jeu.proposer(mystere.nom_fr);
  assert.strictEqual(jeu.partage().split("\n").slice(0, 2).join("\n"), "Piafle n°1 : 3/6\n🥚🥚🐣");
});
