/*
 * Piafle : logique du jeu (sans interface).
 *
 * Ce fichier choisit l'oiseau du jour, gère les essais, les indices, les
 * statistiques et le texte de partage. L'affichage est fait par ui.js, qui
 * lit l'état avec Piafle.etat() et écoute l'événement « piafle:change ».
 *
 * API exposée dans la page (window.Piafle) :
 *   Piafle.pret                 promesse résolue quand les données sont chargées
 *   Piafle.etat()               état complet de la partie du jour (voir plus bas)
 *   Piafle.proposer(nomFr)      joue un essai ; renvoie { ok, erreur? }
 *   Piafle.suggestions(texte)   noms proposés pour l'autocomplétion
 *   Piafle.partage()            texte du résultat à partager
 *
 * Le fichier peut aussi être chargé dans Node (module.exports) : la logique
 * est dans creerJeu(), qui ne dépend ni du navigateur ni du réseau.
 */
(function (global) {
  "use strict";

  // ------------------------------------------------------------------
  // Réglages du jeu
  // ------------------------------------------------------------------

  const FUSEAU = "Europe/Paris";
  // Jour n°1 du jeu. Changer cette date change l'oiseau de chaque jour.
  const DATE_LANCEMENT = "2026-11-09";
  // Graine du mélange des espèces (même ordre pour tout le monde).
  const GRAINE = 20261109;
  const ADRESSE_JEU = "https://piafle.netlify.app/";

  // Déroulé des indices : l'étape n s'applique après n essais ratés. Les
  // indices écrits s'ajoutent les uns aux autres ; « pixels » remplace la
  // photo montrée jusque-là (nombre de gros pixels sur la largeur, 0 = photo
  // nette). Le chant seul, puis la photo de moins en moins pixelisée.
  const ETAPES = [
    { indices: ["chant"] },
    { indices: ["taille", "milieu"], pixels: 16 },
    { indices: ["comportement"], pixels: 32 },
    { pixels: 48 },
    { pixels: 0 },
  ];
  // Une étape par essai.
  const ESSAIS_MAX = ETAPES.length;

  // Grandes catégories d'oiseaux, montrées dans l'historique des essais
  // (« même catégorie : passereaux »). On part de l'ordre ; quelques groupes
  // suivent l'usage courant plutôt que la classification stricte.
  const CATEGORIES_PAR_ORDRE = {
    Passeriformes: "passereaux",
    Columbiformes: "pigeons et tourterelles",
    Piciformes: "pics",
    Cuculiformes: "coucous",
    Bucerotiformes: "huppes",
    Coraciiformes: "martins-pêcheurs",
    Apodiformes: "martinets",
    Galliformes: "gallinacés",
    Accipitriformes: "rapaces diurnes",
    Falconiformes: "rapaces diurnes",
    Strigiformes: "rapaces nocturnes",
    Pelecaniformes: "grands échassiers",
    Ciconiiformes: "grands échassiers",
    Anseriformes: "canards, oies et cygnes",
    Podicipediformes: "grèbes",
    Suliformes: "cormorans et fous",
    Gaviiformes: "plongeons",
    Procellariiformes: "puffins et océanites",
    Phoenicopteriformes: "flamants",
    Otidiformes: "outardes",
    Pterocliformes: "gangas",
    Psittaciformes: "perruches",
    Caprimulgiformes: "engoulevents",
  };
  const CATEGORIES_PAR_FAMILLE = {
    Gruidae: "grands échassiers",
    Rallidae: "râles, foulques et gallinules",
    Laridae: "mouettes, goélands et sternes",
    Stercorariidae: "labbes",
    Alcidae: "pingouins et macareux",
  };

  // Niveau de difficulté de chaque oiseau (champ « difficulte » de
  // data/species.json, attribué à la main).
  const NIVEAUX = { 1: "Facile", 2: "Moyen", 3: "Difficile" };

  // Écart (en %) sous lequel deux tailles sont considérées « proches ».
  const TOLERANCE_TAILLE = 0.1;

  // ------------------------------------------------------------------
  // Outils
  // ------------------------------------------------------------------

  /** Minuscules, sans accents ni ponctuation : « Gros-bec » → « gros bec ». */
  function normaliser(texte) {
    return (texte || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u0153/gi, "oe")
      .replace(/\u00e6/gi, "ae")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  /** Date du jour (AAAA-MM-JJ) dans le fuseau de Paris. */
  function dateDuJour(maintenant) {
    // Le format suédois (sv-SE) donne directement AAAA-MM-JJ.
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: FUSEAU,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(maintenant);
  }

  /** Nombre de jours entre deux dates AAAA-MM-JJ. */
  function joursEntre(debut, fin) {
    const ms = Date.parse(fin + "T00:00:00Z") - Date.parse(debut + "T00:00:00Z");
    return Math.round(ms / 86400000);
  }

  /** Générateur pseudo-aléatoire déterministe (mulberry32). */
  function aleatoire(graine) {
    let a = graine >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Mélange déterministe (Fisher-Yates) d'une copie de la liste. */
  function melanger(liste, graine) {
    const copie = liste.slice();
    const hasard = aleatoire(graine);
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(hasard() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }

  /**
   * Oiseau du jour n° `numero` (1, 2, 3…). Les espèces sont mélangées par
   * cycles : chaque espèce passe une fois avant qu'une autre revienne.
   */
  function oiseauDuJour(especes, numero) {
    const triees = especes.slice().sort((a, b) => (a.id < b.id ? -1 : 1));
    const index = Math.max(0, numero - 1);
    const cycle = Math.floor(index / triees.length);
    return melanger(triees, GRAINE + cycle)[index % triees.length];
  }

  /** Taille de comparaison : envergure, sinon longueur. */
  function taille(espece) {
    return espece.envergure_cm || espece.longueur_cm || null;
  }

  function comparerTailles(propose, mystere) {
    const a = taille(propose);
    const b = taille(mystere);
    if (!a || !b) return null;
    if (Math.abs(a - b) <= TOLERANCE_TAILLE * b) return "proche";
    // L'oiseau mystère est plus grand ou plus petit que celui proposé.
    return b > a ? "plus_grand" : "plus_petit";
  }

  // Seuls domaines d'où viennent photos et chants (voir aussi le fichier _headers).
  const DOMAINES_MEDIAS = ["upload.wikimedia.org", "xeno-canto.org"];

  /** Adresse https d'un média sur un domaine permis, sinon null. */
  function urlMedia(url) {
    try {
      const u = new URL(url);
      return u.protocol === "https:" && DOMAINES_MEDIAS.includes(u.hostname) ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  /** Média avec des crédits toujours affichables. */
  function credite(media) {
    if (!media || !urlMedia(media.url)) return null;
    return {
      url: urlMedia(media.url),
      largeur: media.largeur || null,
      hauteur: media.hauteur || null,
      auteur: media.auteur || "Auteur non renseigné",
      licence: media.licence || "Licence non renseignée",
      licence_url: media.licence_url || null,
      page: media.page || null,
    };
  }

  function nomFamille(espece) {
    const f = espece.famille || {};
    return f.fr && f.fr !== f.scientifique ? `${f.fr} (${f.scientifique})` : f.scientifique || "inconnue";
  }

  function texteTaille(espece) {
    const morceaux = [];
    if (espece.longueur_cm) morceaux.push(`${espece.longueur_cm} cm de long`);
    if (espece.envergure_cm) morceaux.push(`${espece.envergure_cm} cm d'envergure`);
    return morceaux.join(", ") || "inconnue";
  }

  function categorie(espece) {
    const famille = (espece.famille || {}).scientifique;
    const ordre = (espece.ordre || {}).scientifique;
    if (CATEGORIES_PAR_FAMILLE[famille]) return CATEGORIES_PAR_FAMILLE[famille];
    if (ordre === "Charadriiformes") return "limicoles";
    return CATEGORIES_PAR_ORDRE[ordre] || null;
  }

  function difficulte(espece) {
    const niveau = NIVEAUX[espece.difficulte] ? espece.difficulte : 2;
    return { niveau, libelle: NIVEAUX[niveau] };
  }

  function indice(type, mystere) {
    switch (type) {
      case "taille":
        return { type, libelle: "Taille", valeur: texteTaille(mystere), mesure_cm: taille(mystere), envergure_cm: mystere.envergure_cm || null, longueur_cm: mystere.longueur_cm || null };
      case "chant":
        return { type, libelle: "Chant", valeur: mystere.sons && mystere.sons.length ? "à écouter" : "pas d'enregistrement" };
      case "milieu":
        return { type, libelle: "Milieu", valeur: mystere.milieu };
      case "comportement":
        return mystere.comportement ? { type, libelle: "Comportement", valeur: mystere.comportement } : null;
      case "famille":
        return { type, libelle: "Famille", valeur: nomFamille(mystere) };
      default:
        return null;
    }
  }

  // ------------------------------------------------------------------
  // Stockage (localStorage, protégé : il peut être indisponible)
  // ------------------------------------------------------------------

  function stockageMemoire() {
    const donnees = {};
    return {
      getItem: (cle) => (cle in donnees ? donnees[cle] : null),
      setItem: (cle, valeur) => {
        donnees[cle] = String(valeur);
      },
    };
  }

  function lire(stockage, cle, defaut) {
    try {
      const brut = stockage.getItem(cle);
      return brut ? JSON.parse(brut) : defaut;
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(stockage, cle, valeur) {
    try {
      stockage.setItem(cle, JSON.stringify(valeur));
    } catch (e) {
      /* stockage plein ou bloqué : la partie continue sans sauvegarde */
    }
  }

  // repartition : parties gagnées en 1, 2… essais.
  const STATS_VIDES = { joues: 0, gagnes: 0, serie: 0, meilleureSerie: 0, repartition: [0, 0, 0, 0, 0], dernierJour: null };

  // ------------------------------------------------------------------
  // Le jeu
  // ------------------------------------------------------------------

  /**
   * Crée une partie.
   *   especes    : contenu de data/species.json
   *   maintenant : fonction qui renvoie la date courante (remplaçable pour
   *                simuler un autre jour)
   *   stockage   : objet type localStorage
   */
  function creerJeu({ especes, maintenant = () => new Date(), stockage = stockageMemoire() }) {
    const parNom = new Map(especes.map((e) => [normaliser(e.nom_fr), e]));
    const date = dateDuJour(maintenant());
    const numero = Math.max(1, joursEntre(DATE_LANCEMENT, date) + 1); // avant le lancement : jour n°1
    const mystere = oiseauDuJour(especes, numero);
    const clePartie = `piafle:partie:${date}`;

    // On ne garde que les noms proposés : tout le reste se recalcule.
    let noms = lire(stockage, clePartie, { noms: [] }).noms.filter((n) => parNom.has(normaliser(n)));

    function statut() {
      if (noms.some((n) => normaliser(n) === normaliser(mystere.nom_fr))) return "gagne";
      return noms.length >= ESSAIS_MAX ? "perdu" : "en_cours";
    }

    function essais() {
      return noms.map((nom) => {
        const propose = parNom.get(normaliser(nom));
        return {
          nom_fr: propose.nom_fr,
          trouve: propose === mystere,
          // Même grande catégorie (passereaux, gallinacés…), jamais la famille.
          meme_categorie: !!categorie(propose) && categorie(propose) === categorie(mystere),
          categorie: categorie(propose),
          meme_milieu: propose.milieu === mystere.milieu,
          taille: comparerTailles(propose, mystere),
        };
      });
    }

    function etat() {
      const s = statut();
      const fini = s !== "en_cours";
      const rates = noms.filter((n) => normaliser(n) !== normaliser(mystere.nom_fr)).length;
      // Sans enregistrement (rare), les indices écrits arrivent dès le début.
      const sansSon = !(mystere.sons && mystere.sons.length);
      const etapes = fini ? ETAPES.length : Math.min(rates + 1 + (sansSon ? 1 : 0), ETAPES.length);
      const montrees = ETAPES.slice(0, etapes);
      const reveles = montrees.flatMap((e) => e.indices || []);
      const chantRevele = fini || reveles.includes("chant");
      // La photo apparaît à la première étape qui en parle ; la dernière
      // pixelisation annoncée l'emporte. En fin de partie, photo nette.
      const avecPhoto = fini || montrees.some((e) => "pixels" in e);
      const pixels = fini ? 0 : montrees.reduce((p, e) => ("pixels" in e ? e.pixels : p), 0);
      return {
        date,
        numero,
        statut: s,
        essaisMax: ESSAIS_MAX,
        essais: essais(),
        difficulte: difficulte(mystere),
        indices: reveles.map((type) => indice(type, mystere)).filter(Boolean),
        pixels,
        pixelise: pixels > 0,
        photo: avecPhoto ? credite(mystere.photos && mystere.photos[0]) : null,
        son: chantRevele ? credite(mystere.sons && mystere.sons[0]) : null,
        oiseau: fini ? mystere : null,
        stats: stats(),
      };
    }

    function stats() {
      const { dernierJour, ...visibles } = lire(stockage, "piafle:stats", STATS_VIDES);
      return visibles;
    }

    function enregistrerFin(s) {
      const st = lire(stockage, "piafle:stats", STATS_VIDES);
      if (st.dernierJour === date) return; // déjà compté
      const hier = st.dernierJour && joursEntre(st.dernierJour, date) === 1;
      st.joues += 1;
      if (s === "gagne") {
        st.gagnes += 1;
        st.serie = hier || st.dernierJour === null ? st.serie + 1 : 1;
        st.repartition[noms.length - 1] += 1;
      } else {
        st.serie = 0;
      }
      st.meilleureSerie = Math.max(st.meilleureSerie, st.serie);
      st.dernierJour = date;
      ecrire(stockage, "piafle:stats", st);
    }

    function proposer(nomFr) {
      if (statut() !== "en_cours") return { ok: false, erreur: "La partie du jour est terminée." };
      const espece = parNom.get(normaliser(nomFr));
      if (!espece) return { ok: false, erreur: "Cet oiseau n'est pas dans la liste." };
      if (noms.some((n) => normaliser(n) === normaliser(espece.nom_fr))) {
        return { ok: false, erreur: "Tu as déjà proposé cet oiseau." };
      }
      noms = noms.concat(espece.nom_fr);
      ecrire(stockage, clePartie, { noms });
      const s = statut();
      if (s !== "en_cours") enregistrerFin(s);
      return { ok: true };
    }

    function suggestions(texte, limite = 8) {
      const recherche = normaliser(texte);
      if (!recherche) return [];
      const dejaProposes = new Set(noms.map(normaliser));
      const resultats = [];
      for (const e of especes) {
        if (dejaProposes.has(normaliser(e.nom_fr))) continue;
        const nom = normaliser(e.nom_fr);
        const latin = normaliser(e.nom_scientifique);
        // Rang 0 : début du nom ; 1 : début d'un mot ; 2 : ailleurs (dont nom latin).
        let rang = -1;
        if (nom.startsWith(recherche)) rang = 0;
        else if ((" " + nom).includes(" " + recherche)) rang = 1;
        else if (nom.includes(recherche) || latin.includes(recherche)) rang = 2;
        if (rang >= 0) resultats.push({ rang, nom_fr: e.nom_fr, nom_scientifique: e.nom_scientifique });
      }
      resultats.sort((a, b) => a.rang - b.rang || a.nom_fr.localeCompare(b.nom_fr, "fr"));
      return resultats.slice(0, limite).map(({ nom_fr, nom_scientifique }) => ({ nom_fr, nom_scientifique }));
    }

    function partage() {
      const n = noms.length;
      const bilan = statut() === "gagne" ? `trouvé en ${n} essai${n > 1 ? "s" : ""}` : "pas trouvé";
      return `Oiseau du jour n°${numero} ${bilan} : ${ADRESSE_JEU}`;
    }

    return { etat, proposer, suggestions, partage };
  }

  // ------------------------------------------------------------------
  // Branchement dans la page
  // ------------------------------------------------------------------

  const outils = { ESSAIS_MAX, categorie, normaliser, dateDuJour, joursEntre, oiseauDuJour, comparerTailles, DATE_LANCEMENT };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { creerJeu, ...outils };
    return;
  }

  async function chargerEspeces() {
    // Chemin relatif à index.html ; le second sert si la page est ouverte
    // depuis un sous-dossier.
    for (const url of ["data/species.json", "../data/species.json"]) {
      try {
        const reponse = await fetch(url);
        if (reponse.ok) return await reponse.json();
      } catch (e) {
        /* on essaie l'adresse suivante */
      }
    }
    throw new Error("Impossible de charger la liste des oiseaux.");
  }

  let jeu = null;
  const Piafle = {
    pret: null,
    etat: () => jeu && jeu.etat(),
    proposer(nomFr) {
      if (!jeu) return { ok: false, erreur: "Le jeu n'est pas encore chargé." };
      const resultat = jeu.proposer(nomFr);
      if (resultat.ok) document.dispatchEvent(new CustomEvent("piafle:change", { detail: jeu.etat() }));
      return resultat;
    },
    suggestions: (texte) => (jeu ? jeu.suggestions(texte) : []),
    partage: () => (jeu ? jeu.partage() : ""),
  };

  let stockage;
  try {
    stockage = global.localStorage;
    stockage.getItem("piafle:test");
  } catch (e) {
    stockage = stockageMemoire();
  }

  Piafle.pret = chargerEspeces().then((especes) => {
    jeu = creerJeu({ especes, stockage });
    document.dispatchEvent(new CustomEvent("piafle:change", { detail: jeu.etat() }));
    return jeu.etat();
  });

  global.Piafle = Piafle;
})(typeof window !== "undefined" ? window : globalThis);
