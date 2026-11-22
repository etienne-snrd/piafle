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
 * Seul le SQL standard de Postgres est utilisé, avec le pilote postgres : la
 * base peut être déplacée chez un autre hébergeur en changeant seulement la
 * chaîne de connexion. @netlify/database ne sert qu'à la lire ; sa présence
 * dans package.json indique aussi à Netlify de relier la base au site.
 */
import { getStore } from "@netlify/blobs";
import { getConnectionString } from "@netlify/database";
import postgres from "postgres";
import { ESPECES, nomDuTampon, numeroDuJour } from "../lib/evenements.mjs";

export const config = {
  // Tous les jours à 3 h 15 UTC (4 h 15 ou 5 h 15 à Paris), après minuit
  // à Paris : les parties de la veille sont toutes terminées.
  schedule: "15 3 * * *",
};

// Durée de conservation : 25 mois, arrondis à 761 jours.
const CONSERVATION_JOURS = 761;
// Une fonction planifiée dispose de 30 secondes : passé ce délai de lecture,
// les lots restants attendent l'import du lendemain.
const LECTURE_MAX_MS = 15000;
const LECTURES_SIMULTANEES = 50;

/** Lit les lots du tampon, par paquets, dans la limite de temps. */
async function lireTampon(tampon) {
  const debut = Date.now();
  const lots = [];
  const cles = [];
  const { blobs } = await tampon.list();
  for (let i = 0; i < blobs.length && Date.now() - debut < LECTURE_MAX_MS; i += LECTURES_SIMULTANEES) {
    const paquet = blobs.slice(i, i + LECTURES_SIMULTANEES).map((b) => b.key);
    const contenus = await Promise.all(paquet.map((cle) => tampon.get(cle, { type: "json" })));
    contenus.forEach((lot, j) => {
      cles.push(paquet[j]);
      if (Array.isArray(lot)) lots.push(...lot);
    });
  }
  return { evenements: lots, cles, restants: blobs.length - cles.length };
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
  const tampon = getStore({ name: nomDuTampon(context), consistency: "strong" });
  const { evenements, cles, restants } = await lireTampon(tampon);

  const fins = lignes(evenements, "fin", ["jour", "oiseau", "gagne", "essais", "chant", "appareil", "anciennete", "serie"]);
  const erreurs = lignes(evenements, "erreur", ["jour", "oiseau", "propose"]);

  const sql = postgres(getConnectionString(), { max: 1 });
  try {
    await sql.begin(async (sql) => {
      await inserer(sql, "fins", fins);
      await inserer(sql, "erreurs", erreurs);
      await sql`
        INSERT INTO especes ${sql(ESPECES)}
        ON CONFLICT (nom) DO UPDATE
          SET nom_scientifique = excluded.nom_scientifique, difficulte = excluded.difficulte`;
      const limite = numeroDuJour() - CONSERVATION_JOURS;
      await sql`DELETE FROM fins WHERE jour < ${limite}`;
      await sql`DELETE FROM erreurs WHERE jour < ${limite}`;
    });
  } finally {
    await sql.end();
  }

  // Le tampon n'est vidé qu'une fois les lignes enregistrées : en cas
  // d'échec, les lots restent pour l'import suivant.
  for (let i = 0; i < cles.length; i += LECTURES_SIMULTANEES) {
    await Promise.all(cles.slice(i, i + LECTURES_SIMULTANEES).map((cle) => tampon.delete(cle)));
  }

  console.log(`Import (${nomDuTampon(context)}) : ${fins.length} fins, ${erreurs.length} erreurs, ${restants} lots reportés.`);
};
