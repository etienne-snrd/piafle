/*
 * Piafle : mesure d'audience, sans cookie ni identifiant.
 *
 * Ce fichier écoute l'événement « piafle:change » et envoie à /api/evenement :
 *   - un événement « erreur » à chaque essai faux (nom proposé) ;
 *   - un événement « fin » quand la partie se termine (gagné ou perdu,
 *     nombre d'essais, chant écouté ou non, mobile ou ordinateur, n° de
 *     partie et série en cours, lus dans les statistiques du joueur).
 * L'oiseau à trouver n'est pas envoyé : le serveur le recalcule.
 *
 * Une marque dans le localStorage retient, pour le jour en cours, le nombre
 * d'événements déjà envoyés et si le chant a été écouté : recharger la page
 * n'envoie jamais deux fois le même événement.
 *
 * L'envoi part en arrière-plan et tout échec est ignoré : la mesure ne doit
 * jamais gêner le jeu. Hors ligne, l'événement est perdu.
 */
(function () {
  "use strict";

  const ADRESSE = "/api/evenement";
  const CLE = "piafle:mesure";

  // Rien n'est envoyé en développement local (ni fichier, ni localhost).
  const hote = location.hostname;
  if (location.protocol !== "https:" || hote === "localhost" || hote === "127.0.0.1" || hote === "[::1]") return;
  if (!window.Piafle) return;

  function lireMarque(jour) {
    try {
      const m = JSON.parse(localStorage.getItem(CLE));
      if (m && m.jour === jour) return m;
    } catch (e) {
      /* marque absente ou illisible : on repart de zéro */
    }
    return { jour, envoyes: 0, chant: false };
  }

  function ecrireMarque(marque) {
    try {
      localStorage.setItem(CLE, JSON.stringify(marque));
    } catch (e) {
      /* stockage bloqué : la mesure continue sans mémoire */
    }
  }

  /** Téléphone : écran étroit et pointeur tactile. */
  function appareil() {
    const tactile = window.matchMedia && matchMedia("(pointer: coarse)").matches;
    const etroit = Math.min(screen.width, screen.height) < 768;
    return tactile && etroit ? "mobile" : "ordinateur";
  }

  /** Tous les événements de la partie, dans l'ordre où ils ont eu lieu. */
  function evenements(etat, marque) {
    const jour = etat.numero;
    const liste = etat.essais
      .filter((essai) => !essai.trouve)
      .map((essai) => ({ type: "erreur", jour, propose: essai.nom_fr }));
    if (etat.statut !== "en_cours") {
      liste.push({
        type: "fin",
        jour,
        gagne: etat.statut === "gagne",
        essais: etat.essais.length,
        chant: marque.chant,
        appareil: appareil(),
        anciennete: etat.stats.joues,
        serie: etat.stats.serie,
      });
    }
    return liste;
  }

  function envoyer(liste) {
    const corps = JSON.stringify({ evenements: liste });
    try {
      // Une chaîne part en text/plain : requête simple, sans prévol.
      if (navigator.sendBeacon && navigator.sendBeacon(ADRESSE, corps)) return;
      fetch(ADRESSE, { method: "POST", body: corps, keepalive: true }).catch(() => {});
    } catch (e) {
      /* envoi impossible : tant pis */
    }
  }

  function mesurer(etat) {
    if (!etat) return;
    const marque = lireMarque(etat.numero);
    const liste = evenements(etat, marque);
    if (liste.length <= marque.envoyes) return;
    // La marque est posée avant l'envoi : un échec n'est jamais retenté.
    const nouveaux = liste.slice(marque.envoyes);
    ecrireMarque({ ...marque, envoyes: liste.length });
    envoyer(nouveaux);
  }

  document.addEventListener("piafle:change", () => mesurer(Piafle.etat()));

  // Chant écouté pendant la partie. Le chant joué automatiquement après une
  // victoire ne compte pas : la partie est alors déjà finie.
  // « play » ne remonte pas dans la page : on l'attrape à la descente.
  document.addEventListener(
    "play",
    (e) => {
      const etat = Piafle.etat();
      if (e.target.id !== "audio" || !etat || etat.statut !== "en_cours") return;
      const marque = lireMarque(etat.numero);
      if (!marque.chant) ecrireMarque({ ...marque, chant: true });
    },
    true
  );
})();
