/*
 * Validation des événements d'analytics, partagée par les fonctions Netlify.
 *
 * Un événement n'est accepté que s'il est plausible pour une vraie partie du
 * jour : l'oiseau à trouver n'est jamais lu dans la requête, il est recalculé
 * ici avec la logique du jeu (js/jeu.js), comme dans le navigateur.
 */
import jeu from "../../js/jeu.js";
import especes from "../../data/species.json" with { type: "json" };

export const ESSAIS_MAX = jeu.ESSAIS_MAX;
// Au plus un événement « erreur » par essai raté, plus l'événement « fin ».
export const EVENEMENTS_MAX = ESSAIS_MAX + 1;
export const APPAREILS = ["mobile", "ordinateur"];

const NOMS = new Set(especes.map((e) => e.nom_fr));

/** Liste des espèces réduite à ce que la base garde (table especes). */
export const ESPECES = especes.map((e) => ({
  nom: e.nom_fr,
  nom_scientifique: e.nom_scientifique,
  difficulte: e.difficulte,
}));

/** N° du jour de jeu (1 = jour du lancement), heure de Paris. */
export function numeroDuJour(maintenant = new Date()) {
  return jeu.joursEntre(jeu.DATE_LANCEMENT, jeu.dateDuJour(maintenant)) + 1;
}

/** Nom français de l'oiseau à trouver le jour n° `jour`. */
export function oiseauDuJour(jour) {
  return jeu.oiseauDuJour(especes, jour).nom_fr;
}

// Plus grand entier d'une colonne integer de Postgres.
const INT_MAX = 2147483647;
const entier = (v, min, max = Number.MAX_SAFE_INTEGER) => Number.isInteger(v) && v >= min && v <= max;
const booleen = (v) => typeof v === "boolean";

/** Vrai si l'objet a exactement ces clés, ni plus ni moins. */
function cles(objet, attendues) {
  const presentes = Object.keys(objet);
  return presentes.length === attendues.length && attendues.every((c) => Object.hasOwn(objet, c));
}

function validerFin(e, oiseau) {
  if (!cles(e, ["type", "jour", "gagne", "essais", "chant", "appareil", "anciennete", "serie"])) return null;
  if (!booleen(e.gagne) || !booleen(e.chant) || !APPAREILS.includes(e.appareil)) return null;
  // Une partie par jour au plus : l'ancienneté ne peut pas dépasser le
  // nombre de jours écoulés depuis le lancement.
  if (!entier(e.essais, 1, ESSAIS_MAX) || !entier(e.anciennete, 1, e.jour) || !entier(e.serie, 0, e.anciennete)) return null;
  // Une partie perdue use tous les essais et remet la série à zéro ;
  // une partie gagnée prolonge la série.
  if (e.gagne ? e.serie < 1 : e.essais !== ESSAIS_MAX || e.serie !== 0) return null;
  const { type, jour, gagne, essais, chant, appareil, anciennete, serie } = e;
  return { type, jour, oiseau, gagne, essais, chant, appareil, anciennete, serie };
}

function validerErreur(e, oiseau) {
  if (!cles(e, ["type", "jour", "propose"])) return null;
  if (typeof e.propose !== "string" || !NOMS.has(e.propose) || e.propose === oiseau) return null;
  return { type: e.type, jour: e.jour, oiseau, propose: e.propose };
}

/**
 * Valide un événement reçu. Renvoie l'événement prêt à stocker, complété
 * par l'oiseau du jour, ou null s'il est rejeté.
 */
export function validerEvenement(e, maintenant = new Date()) {
  if (!e || typeof e !== "object" || Array.isArray(e)) return null;
  // Jour courant, ou veille pour une partie commencée avant minuit.
  const aujourdhui = numeroDuJour(maintenant);
  if (!entier(e.jour, Math.max(1, aujourdhui - 1), aujourdhui)) return null;
  const oiseau = oiseauDuJour(e.jour);
  if (e.type === "fin") return validerFin(e, oiseau);
  if (e.type === "erreur") return validerErreur(e, oiseau);
  return null;
}

/**
 * Valide le corps d'une requête : { evenements: [...] }. Un seul événement
 * invalide fait rejeter tout le lot, qui n'a alors rien d'une vraie partie.
 */
export function validerLot(corps, maintenant = new Date()) {
  if (!corps || typeof corps !== "object" || !cles(corps, ["evenements"])) return null;
  const liste = corps.evenements;
  if (!Array.isArray(liste) || liste.length < 1 || liste.length > EVENEMENTS_MAX) return null;
  const valides = liste.map((e) => validerEvenement(e, maintenant));
  if (valides.includes(null)) return null;
  if (valides.filter((e) => e.type === "fin").length > 1) return null;
  return valides;
}

/**
 * Prépare un événement lu dans le tampon pour l'insertion en base. Le lot a
 * été validé à la réception, mais l'import revérifie chaque valeur : une
 * seule valeur refusée par la base ferait échouer tout l'import du jour.
 * Renvoie null si l'événement est invalide.
 */
export function ligneEnBase(e) {
  if (!e || typeof e !== "object" || !entier(e.jour, 1, INT_MAX) || !NOMS.has(e.oiseau)) return null;
  if (e.type === "erreur") {
    if (!NOMS.has(e.propose)) return null;
    return { type: e.type, jour: e.jour, oiseau: e.oiseau, propose: e.propose };
  }
  if (e.type !== "fin") return null;
  if (!booleen(e.gagne) || !booleen(e.chant) || !APPAREILS.includes(e.appareil)) return null;
  // Bornes des colonnes integer de Postgres.
  if (!entier(e.essais, 1, ESSAIS_MAX) || !entier(e.anciennete, 1, INT_MAX) || !entier(e.serie, 0, e.anciennete)) return null;
  const { type, jour, oiseau, gagne, essais, chant, appareil, anciennete, serie } = e;
  return { type, jour, oiseau, gagne, essais, chant, appareil, anciennete, serie };
}

/**
 * Nom du magasin Netlify Blobs qui sert de tampon. Les magasins sont
 * communs à tous les déploiements du site : les prévisualisations ont le
 * leur pour ne jamais mêler leurs essais aux vraies données.
 */
export function nomDuTampon(context) {
  return context?.deploy?.context === "production" ? "analytics" : "analytics-essais";
}
