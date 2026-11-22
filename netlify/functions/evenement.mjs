/*
 * Réception des événements d'analytics envoyés par js/mesure.js.
 *
 * La fonction valide le lot reçu puis le dépose dans Netlify Blobs. Elle
 * n'écrit jamais dans la base : la fonction planifiée import-quotidien.mjs
 * y verse les événements une fois par jour, pour ne réveiller la base
 * qu'une fois.
 *
 * La réponse est toujours 204, lot accepté ou non : un tricheur n'apprend
 * rien. Ni l'adresse IP, ni l'heure, ni le navigateur ne sont conservés.
 */
import { getStore } from "@netlify/blobs";
import { nomDuTampon, validerLot } from "../lib/evenements.mjs";

// Un lot fait au plus quelques centaines d'octets.
const TAILLE_MAX = 2048;

export const config = {
  path: "/api/evenement",
  method: "POST",
  // Un joueur envoie au plus 6 requêtes par partie : au-delà, c'est un robot.
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

/** Vrai si la requête vient d'une page du site lui-même. */
function memeOrigine(req) {
  const origine = req.headers.get("origin");
  if (origine && origine !== new URL(req.url).origin) return false;
  const site = req.headers.get("sec-fetch-site");
  return !site || site === "same-origin";
}

async function lireLot(req) {
  if (Number(req.headers.get("content-length")) > TAILLE_MAX) return null;
  const texte = await req.text();
  if (texte.length > TAILLE_MAX) return null;
  try {
    return validerLot(JSON.parse(texte));
  } catch {
    return null;
  }
}

export default async (req, context) => {
  // Interrupteur : ANALYTICS_ACTIF=non coupe la collecte.
  if (process.env.ANALYTICS_ACTIF === "non" || !memeOrigine(req)) {
    return new Response(null, { status: 204 });
  }
  try {
    const lot = await lireLot(req);
    if (lot) {
      // Une clé par lot : aucune écriture concurrente sur une même clé.
      // Le n° du jour en tête de clé permet de lister le tampon jour par jour.
      const cle = `${lot[0].jour}/${crypto.randomUUID()}`;
      await getStore(nomDuTampon(context)).setJSON(cle, lot);
    }
  } catch (erreur) {
    console.error("Événement non enregistré :", erreur.message);
  }
  return new Response(null, { status: 204 });
};
