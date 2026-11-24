/*
 * Import quotidien des événements dans la base (Netlify Database, Postgres).
 *
 * Une fois par jour, la fonction lit les lots déposés dans Netlify Blobs par
 * evenement.mjs, les insère dans les tables fins et erreurs, puis vide le
 * tampon. La base, facturée au temps où elle est éveillée, ne se réveille
 * ainsi qu'une fois par jour.
 *
 * Dans la même transaction : mise à jour de la table especes depuis
 * data/species.json, et suppression des lignes de plus de 25 mois.
 *
 * L'import supporte d'être interrompu ou relancé : chaque lot importé est
 * noté dans la table lots_importes, et un lot déjà noté n'est plus compté.
 * Chaque valeur est revérifiée avant l'insertion : un lot invalide est
 * écarté seul, sans bloquer les autres.
 *
 * Seul le SQL standard de Postgres est utilisé, avec le pilote postgres : la
 * base peut être déplacée chez un autre hébergeur en changeant seulement la
 * chaîne de connexion. @netlify/database ne sert qu'à la lire ; sa présence
 * dans package.json indique aussi à Netlify de relier la base au site.
 */
import { getStore } from "@netlify/blobs";
import { getConnectionString } from "@netlify/database";
import postgres from "postgres";
import { ESPECES, ligneEnBase, nomDuTampon, numeroDuJour } from "../lib/evenements.mjs";

export const config = {
  // Tous les jours à 3 h 15 UTC (4 h 15 ou 5 h 15 à Paris), après minuit
  // à Paris : les parties de la veille sont toutes terminées.
  schedule: "15 3 * * *",
};

// Durée de conservation : 25 mois, arrondis à 761 jours.
const CONSERVATION_JOURS = 761;
// Les clés des lots importés sont gardées un mois : un lot resté dans le
// tampon plus longtemps est impossible, l'import passant chaque nuit.
const MEMOIRE_LOTS_JOURS = 30;
// Une fonction planifiée dispose de 30 secondes. La lecture s'arrête à
// 12 s et le vidage du tampon à 25 s : le reste attend l'import du
// lendemain, qui reconnaîtra les lots déjà importés.
const LECTURE_MAX_MS = 12000;
const DUREE_MAX_MS = 25000;
const LECTURES_SIMULTANEES = 50;

/** Lit les lots du tampon, par paquets, dans la limite de temps. */
async function lireTampon(tampon, debut) {
  const lots = [];
  const { blobs } = await tampon.list();
  for (let i = 0; i < blobs.length && Date.now() - debut < LECTURE_MAX_MS; i += LECTURES_SIMULTANEES) {
    const paquet = blobs.slice(i, i + LECTURES_SIMULTANEES).map((b) => b.key);
    const contenus = await Promise.all(paquet.map((cle) => tampon.get(cle, { type: "json" })));
    contenus.forEach((contenu, j) => lots.push({ cle: paquet[j], contenu }));
  }
  return { lots, restants: blobs.length - lots.length };
}

/**
 * Lignes à insérer pour un lot, ou null si une seule est invalide : le lot
 * est alors écarté en entier, comme à la réception.
 */
function lignesDuLot(contenu) {
  if (!Array.isArray(contenu)) return null;
  const lignes = contenu.map(ligneEnBase);
  return lignes.includes(null) ? null : lignes;
}

/** Lignes d'une table : uniquement les colonnes voulues. */
function lignes(evenements, type, colonnes) {
  return evenements
    .filter((e) => e.type === type)
    .map((e) => Object.fromEntries(colonnes.map((c) => [c, e[c]])));
}

/** Insère par paquets de 1 000 lignes (limite de paramètres de Postgres). */
async function inserer(sql, table, rangees) {
  for (let i = 0; i < rangees.length; i += 1000) {
    await sql`INSERT INTO ${sql(table)} ${sql(rangees.slice(i, i + 1000))}`;
  }
}

export default async (req, context) => {
  const debut = Date.now();
  const tampon = getStore({ name: nomDuTampon(context), consistency: "strong" });
  const { lots, restants } = await lireTampon(tampon, debut);
  const aujourdhui = numeroDuJour();
  let importes = 0;
  let ecartes = 0;
  let dejaVus = 0;

  const sql = postgres(getConnectionString(), { max: 1 });
  try {
    await sql.begin(async (sql) => {
      // Un lot déjà importé (import précédent interrompu avant le vidage du
      // tampon) n'est pas compté deux fois.
      const connus = new Set(
        (await sql`SELECT cle FROM lots_importes WHERE cle = ANY(${lots.map((l) => l.cle)})`).map((r) => r.cle)
      );
      const nouveaux = lots.filter((l) => !connus.has(l.cle));
      dejaVus = lots.length - nouveaux.length;

      const evenements = [];
      for (const { cle, contenu } of nouveaux) {
        const lignesLot = lignesDuLot(contenu);
        if (lignesLot) evenements.push(...lignesLot);
        else {
          ecartes += 1;
          console.warn(`Lot écarté : ${cle}`);
        }
      }
      importes = nouveaux.length - ecartes;

      await inserer(sql, "fins", lignes(evenements, "fin", ["jour", "oiseau", "gagne", "essais", "chant", "appareil", "anciennete", "serie"]));
      await inserer(sql, "erreurs", lignes(evenements, "erreur", ["jour", "oiseau", "propose"]));
      // Les lots écartés sont retenus aussi : ils ne seront pas relus.
      // Une clé commence par le n° du jour (voir evenement.mjs).
      await inserer(
        sql,
        "lots_importes",
        nouveaux.map(({ cle }) => ({ cle, jour: Number.parseInt(cle, 10) || aujourdhui }))
      );
      await sql`
        INSERT INTO especes ${sql(ESPECES)}
        ON CONFLICT (nom) DO UPDATE
          SET nom_scientifique = excluded.nom_scientifique, difficulte = excluded.difficulte`;
      const limite = aujourdhui - CONSERVATION_JOURS;
      await sql`DELETE FROM fins WHERE jour < ${limite}`;
      await sql`DELETE FROM erreurs WHERE jour < ${limite}`;
      await sql`DELETE FROM lots_importes WHERE jour < ${aujourdhui - MEMOIRE_LOTS_JOURS}`;
    });
  } finally {
    await sql.end();
  }

  // Le tampon n'est vidé qu'une fois les lignes enregistrées : en cas
  // d'échec, les lots restent pour l'import suivant.
  const cles = lots.map((l) => l.cle);
  let supprimes = 0;
  for (let i = 0; i < cles.length && Date.now() - debut < DUREE_MAX_MS; i += LECTURES_SIMULTANEES) {
    const paquet = cles.slice(i, i + LECTURES_SIMULTANEES);
    await Promise.all(paquet.map((cle) => tampon.delete(cle)));
    supprimes += paquet.length;
  }

  console.log(
    `Import (${nomDuTampon(context)}) : ${importes} lots importés, ${ecartes} écartés, ` +
      `${dejaVus} déjà importés, ${restants} reportés, ${cles.length - supprimes} encore à vider.`
  );
};
