// Effets visuels après un essai. Aucune règle ni rendu de la partie ici
// (voir ui.js) : le fichier compare l'état avant et après chaque proposition
// et réagit à l'événement « piafle:change » :
//   raté   : le panneau tremble ;
//   trouvé : des oiseaux en pixels s'envolent du bas de l'écran ;
//   perdu  : tremblement.
// Avec prefers-reduced-motion, aucune animation.
// Chaque essai est aussi annoncé aux lecteurs d'écran.
//
// À charger après ui.js, pour que l'écran soit déjà à jour.

(function () {
  if (!window.Piafle) return;

  const $ = id => document.getElementById(id);
  const calme = matchMedia("(prefers-reduced-motion: reduce)");
  let avant = null;               // état de la partie avant la proposition

  // ---------- Ce qui a changé ----------

  const indicesEcrits = etat => etat.indices.filter(i => i.type !== "chant");

  /** Noms des indices arrivés entre deux états, par exemple ["taille", "photo pixelisée"]. */
  function nouveautes(a, b) {
    const noms = indicesEcrits(b).slice(indicesEcrits(a).length).map(i => i.libelle.toLowerCase());
    if (!a.son && b.son) noms.push("chant");
    if (b.photo && !a.photo) noms.push(b.pixels ? "photo pixelisée" : "photo");
    else if (b.photo && a.pixels !== b.pixels) noms.push(b.pixels ? "photo plus nette" : "photo nette");
    return noms;
  }

  // « a, b et c »
  const enumerer = l => l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " et " + l[l.length - 1];

  // ---------- Annonce pour les lecteurs d'écran ----------
  // Rien ne s'affiche : la phrase est seulement lue par les lecteurs d'écran.

  let annonce = null;

  function annoncer(genre, titre, detail) {
    if (!annonce) {
      annonce = document.createElement("p");
      annonce.className = "visuellement-cache";
      annonce.setAttribute("role", "status");
      document.body.appendChild(annonce);
    }
    annonce.textContent = titre + (detail ? ". " + detail : "");
  }

  // ---------- Tremblement et marques ----------

  function rejouer(element, classe) {
    if (!element) return;
    element.classList.remove(classe);
    void element.offsetWidth;
    element.classList.add(classe);
    element.addEventListener("animationend", function fin(e) {
      if (e.target !== element) return;
      element.classList.remove(classe);
      element.removeEventListener("animationend", fin);
    });
  }

  // ---------- Envol ----------

  // Oiseaux en vol (11 × 8), tournés vers la droite : ailes hautes, à plat, basses.
  // B dos, b ventre, W aile, w bord clair de l'aile, h tête, k œil, Y bec.
  const VOL = [[
    "....WW.....",
    "...WWw.....",
    "...WWw.....",
    ".BBWWBhh...",
    "BBBBBBhkY..",
    ".BbbbbB....",
    "..bbbb.....",
    "...........",
  ], [
    "...........",
    "...........",
    "..WWWWw....",
    ".BWWWWhh...",
    "BBBBBBhkY..",
    ".BbbbbB....",
    "..bbbb.....",
    "...........",
  ], [
    "...........",
    "...........",
    "...........",
    ".BBBBBhh...",
    "BBBWWBhkY..",
    ".BbWWwB....",
    "..bWWw.....",
    "...WW......",
  ]];
  // Mêmes couleurs que les oiseaux du décor (js/decor.js).
  const PLUMAGES = [
    { B: "#97A64E", b: "#F2CF3A", W: "#3E86D6", w: "#F4F2EA", h: "#3E86D6", k: "#18202C", Y: "#18202C" }, // mésange bleue
    { B: "#7D6A4C", b: "#E0662F", W: "#54432F", w: "#9BA0A3", h: "#E0662F", k: "#1E1A18", Y: "#1E1A18" }, // rougegorge
    { B: "#2E9BC6", b: "#E0782A", W: "#1F6E9C", w: "#7FD0E6", h: "#1F6E9C", k: "#18202C", Y: "#2B1E14" }, // martin-pêcheur
    { B: "#8A6440", b: "#EFE6D6", W: "#2B1E14", w: "#F4CF3C", h: "#C8553D", k: "#18202C", Y: "#EFE6D6" }, // chardonneret
  ];
  const PLUMES = ["#F4CF3C", "#F4F2EA", "#3E86D6", "#E0662F"];

  let toile = null, vol = null;

  function envol() {
    if (calme.matches) return;
    // Même taille de pixel que le décor.
    const echelle = Math.max(2, Math.round(innerHeight / 290));
    const W = Math.ceil(innerWidth / echelle), H = Math.ceil(innerHeight / echelle);
    if (!toile) {
      toile = document.createElement("canvas");
      toile.className = "effet-envol";
      toile.setAttribute("aria-hidden", "true");
      document.body.appendChild(toile);
    }
    toile.width = W; toile.height = H;
    toile.style.width = W * echelle + "px"; toile.style.height = H * echelle + "px";

    // Une volée décolle de l'herbe, en bas de l'écran, surtout autour du
    // panneau, et traverse la page vers le ciel. Les oiseaux proches sont
    // deux fois plus gros et plus rapides que ceux du fond.
    const r = ($("partie") || document.body).getBoundingClientRect();
    const gauche = r.left / echelle, largeur = r.width / echelle;
    const hasard = (a, b) => a + Math.random() * (b - a);
    const oiseaux = [];
    for (let i = 0; i < 34; i++) {
      const taille = i % 5 < 2 ? 2 : 1;
      const droite = i % 2 === 0;
      oiseaux.push({
        x: i % 4 === 3 ? hasard(0, W) : hasard(gauche - largeur * 0.35, gauche + largeur * 1.35),
        y: H + hasard(2, 30),
        vx: (droite ? 1 : -1) * hasard(6, 34) * taille,
        vy: -hasard(70, 105) * (taille === 2 ? 1.5 : 1),
        retard: hasard(0, 1.1),
        phase: Math.random() * 3,
        taille,
        plumage: PLUMAGES[i % PLUMAGES.length],
      });
    }
    // Quelques plumes retombent derrière eux.
    const plumes = [];
    for (let i = 0; i < 18; i++) {
      plumes.push({
        x: hasard(gauche - 10, gauche + largeur + 10), y: hasard(H * 0.25, H * 0.8),
        vx: hasard(-18, 18), vy: -hasard(5, 30), retard: hasard(0.7, 1.8),
        couleur: PLUMES[i % PLUMES.length], phase: Math.random() * 6,
      });
    }
    const debut = performance.now();
    vol = { W, H, oiseaux, plumes, debut, dernier: debut };
    requestAnimationFrame(imageEnvol);
  }

  function imageEnvol(maintenant) {
    if (!vol) return;
    const { W, H, oiseaux, plumes } = vol;
    const dt = Math.min(0.05, (maintenant - vol.dernier) / 1000);
    const t = (maintenant - vol.debut) / 1000;
    vol.dernier = maintenant;
    const c = toile.getContext("2d");
    c.clearRect(0, 0, W, H);
    let visibles = 0;

    for (const p of plumes) {
      if (t < p.retard) { visibles++; continue; }
      p.vy = Math.min(16, p.vy + 90 * dt);        // retombe doucement
      p.x += (p.vx + Math.sin(t * 4 + p.phase) * 14) * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.2 * dt;
      if (p.y > H + 2 || t > 5) continue;
      visibles++;
      c.fillStyle = p.couleur;
      c.fillRect(Math.round(p.x), Math.round(p.y), 1, 2);
      c.fillRect(Math.round(p.x) + (Math.sin(t * 4 + p.phase) > 0 ? 1 : -1), Math.round(p.y) + 1, 1, 1);
    }

    for (const o of oiseaux) {
      if (t < o.retard) { visibles++; continue; }
      const age = t - o.retard;
      o.x += o.vx * dt;
      o.y += (o.vy + Math.sin(age * 5 + o.phase) * 10) * dt;
      if (o.y < -20 || o.x < -24 || o.x > W + 2) continue;
      visibles++;
      // Battement : haut, plat, bas, plat.
      const pas = Math.floor(age * 11 + o.phase) % 4;
      const lignes = VOL[pas === 3 ? 1 : pas];
      const x0 = Math.round(o.x), y0 = Math.round(o.y);
      for (let j = 0; j < lignes.length; j++) {
        for (let i = 0; i < 11; i++) {
          const couleur = o.plumage[lignes[j][i]];
          if (!couleur) continue;
          c.fillStyle = couleur;
          c.fillRect(x0 + (o.vx < 0 ? 10 - i : i) * o.taille, y0 + j * o.taille, o.taille, o.taille);
        }
      }
    }

    if (visibles && t < 7) requestAnimationFrame(imageEnvol);
    else { c.clearRect(0, 0, W, H); vol = null; }
  }

  // ---------- Après chaque proposition ----------

  function apresEssai() {
    const etat = Piafle.etat();
    const a = avant;
    avant = etat;
    if (!a || etat.essais.length !== a.essais.length + 1) return;
    const essai = etat.essais[etat.essais.length - 1];
    const n = etat.essais.length;
    const panneau = $("partie");

    if (essai.trouve) {
      rejouer(panneau, "effet-bond");
      envol();
      annoncer("gagne", "Trouvé !", `${essai.nom_fr}, au ${n === 1 ? "1er" : n + "e"} essai`);
      return;
    }

    if (!calme.matches) rejouer(panneau, "effet-secousse");
    if (etat.statut === "perdu") {
      annoncer("perdu", "Raté, c'était le dernier essai", "Voici l'oiseau du jour.");
      return;
    }
    const neufs = nouveautes(a, etat);
    const reste = etat.essaisMax - n;
    annoncer("rate", `Raté : ce n'est pas ${essai.nom_fr}`,
      (neufs.length ? `Nouvel indice : ${enumerer(neufs)}. ` : "") + (reste === 1 ? "Dernier essai." : `Encore ${reste} essais.`));
  }

  Piafle.pret.then(() => { avant = Piafle.etat(); }).catch(() => {});
  document.addEventListener("piafle:change", apresEssai);

  // Déclenchables depuis la console : Piafle.effets.envol().
  Piafle.effets = { envol, annoncer };
})();
