// Interface de Piafle : affiche l'état fourni par Piafle.etat()
// et transmet les propositions. Aucune règle du jeu ici.

(function () {
  const $ = id => document.getElementById(id);
  const el = {
    date: $("date-jour"), lucarne: $("lucarne"), photo: $("photo"), partie: $("partie"),
    pixels: $("pixels"), revelation: $("revelation"), nom: $("nom-oiseau"), latin: $("nom-latin"), bilan: $("bilan"),
    indices: $("indices"), chant: $("chant"), chantBouton: $("chant-bouton"), chantLibelle: $("chant-libelle"),
    sonogramme: $("sonogramme"), audio: $("audio"), essais: $("essais"),
    fiche: $("fiche"), ficheLien: $("fiche-wikipedia"),
    partager: $("partager"), partageLibelle: $("partage-libelle"), prochain: $("prochain"), credits: $("credits"),
    saisie: $("saisie"), champ: $("champ"), propositions: $("propositions"), message: $("saisie-message"),
    aide: $("aide"), ouvrirAide: $("ouvrir-aide"), difficulte: $("difficulte"),
    chantTemps: $("chant-temps"),
  };

  /**
   * Adresse sûre pour un lien : seulement http(s), et, si `domaines` est
   * donné, seulement ces domaines. Sinon null : un « javascript: » glissé
   * dans data/species.json ne doit jamais devenir un lien cliquable.
   */
  function lienSur(url, domaines) {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
      if (domaines && !domaines.includes(u.hostname)) return null;
      return u.href;
    } catch (_) {
      return null;
    }
  }

  let precedent = null;           // état affiché au rendu précédent
  let selection = -1;             // proposition surlignée dans la liste

  // ---------- Lucarne ----------

  const ZOOM_GROS_PLAN = 2.4;
  // Nombre de gros pixels sur la largeur, ou 0 pour la vraie photo. Le
  // déroulé des indices (js/jeu.js, FORMULES) le fixe à chaque étape.
  const pixelsPour = etat => etat.pixels || 0;

  // Le cadre prend le format de la photo, dans ces limites (largeur / hauteur).
  const FORMAT_MIN = 0.8, FORMAT_MAX = 1.78;
  let formatPhoto = null;

  /**
   * Règle le cadre et le gros plan. Le point de zoom (champ « foyer » de
   * data/species.json) est donné en % de la photo entière ; on le convertit
   * en % du cadre, puis on le centre sans jamais laisser voir le bord de la
   * photo.
   */
  function cadrer(etat, format) {
    if (format) formatPhoto = format;
    const r = formatPhoto || 4 / 3;
    const cadre = Math.min(FORMAT_MAX, Math.max(FORMAT_MIN, r));
    // Part de la photo visible dans le cadre (rogné seulement hors limites).
    const vx = r > cadre ? cadre / r : 1, vy = r < cadre ? r / cadre : 1;
    const f = etat.foyer || { x: 50, y: 45 };
    const zoom = etat.recadrage === 2 ? 1 : (f.zoom || ZOOM_GROS_PLAN);
    const borne = v => Math.min(100 - 50 / zoom, Math.max(50 / zoom, v));
    const x = zoom > 1 ? borne(50 + (f.x - 50) / vx) : 50;
    const y = zoom > 1 ? borne(50 + (f.y - 50) / vy) : 50;
    const s = el.lucarne.style;
    s.setProperty("--format", cadre);
    el.partie.style.setProperty("--format", cadre);
    s.setProperty("--zoom", zoom);
    s.setProperty("--foyer-x", x + "%");
    s.setProperty("--foyer-y", y + "%");
    s.setProperty("--decal-x", 50 - x + "%");
    s.setProperty("--decal-y", 50 - y + "%");
    const colonnes = pixelsPour(etat);
    if (colonnes) pixeliser({ r, cadre, x, y, zoom, colonnes });
  }

  /**
   * Dessine la zone visible du gros plan dans un canevas de quelques dizaines
   * de pixels de large ; le CSS l'agrandit sans lissage (image-rendering:
   * pixelated). Les couleurs restent celles de la photo.
   */
  function pixeliser({ r, cadre, x, y, zoom, colonnes }) {
    const img = el.photo;
    if (!img.complete || !img.naturalWidth) return; // redessiné au chargement
    // Taille de la photo affichée (object-fit: cover) dans un cadre de
    // largeur « cadre » et de hauteur 1.
    const largeur = r > cadre ? r : cadre, hauteur = largeur / r;
    const decalX = (cadre - largeur) / 2, decalY = (1 - hauteur) / 2;
    // Zone visible après le zoom, puis la même zone en pixels de la photo.
    const zx = x / 100 * cadre - cadre / (2 * zoom), zy = y / 100 - 1 / (2 * zoom);
    const ech = img.naturalWidth / largeur;
    const sx = (zx - decalX) * ech, sy = (zy - decalY) * ech;
    const sw = cadre / zoom * ech, sh = 1 / zoom * ech;
    const c = el.pixels, lignes = Math.max(1, Math.round(colonnes / cadre));
    c.width = colonnes; c.height = lignes;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, colonnes, lignes);
    c.classList.add("est-pret");
  }

  function rendrePhoto(etat) {
    const p = etat.photo;
    // Au début, on n'a que le chant : la lucarne reste cachée.
    el.lucarne.hidden = !p;
    if (!p) return;
    cadrer(etat, p.largeur && p.hauteur ? p.largeur / p.hauteur : null);
    if (el.photo.dataset.url !== p.url) {
      el.photo.dataset.url = p.url;
      el.photo.classList.remove("est-chargee");
      el.photo.onload = () => {
        // Le format exact n'est connu, et le gros plan pixelisé ne peut être
        // dessiné, qu'une fois la photo chargée.
        cadrer(Piafle.etat(), p.largeur && p.hauteur ? null : el.photo.naturalWidth / el.photo.naturalHeight);
        el.photo.classList.add("est-chargee");
        el.lucarne.classList.remove("en-erreur");
      };
      el.photo.onerror = () => el.lucarne.classList.add("en-erreur");
      el.photo.src = p.url;
    }
    el.lucarne.dataset.recadrage = String(etat.recadrage);
    el.lucarne.dataset.pixelise = String(pixelsPour(etat) > 0);
    el.photo.alt = etat.oiseau
      ? `${etat.oiseau.nom_fr}, photo entière`
      : `L'oiseau mystère, ${etat.vue === "gros-plan" ? "vu de près" : "photo entière"}${etat.pixelise ? ", pixelisée" : ""}`;
  }

  function lienCredit(m) {
    const auteur = nettoyerAuteur(m.auteur);
    const licence = echapper(m.licence || "licence inconnue");
    const lien = lienSur(m.page) || lienSur(m.licence_url);
    return `${auteur ? "de " + echapper(auteur) + ", " : ""}${lien ? `<a href="${echapper(lien)}" target="_blank" rel="noopener noreferrer">${licence}</a>` : licence}`;
  }

  function nettoyerAuteur(a) {
    if (!a || /no machine-readable author|non renseign/i.test(a)) return "";
    return a.replace(/<[^>]*>/g, "").trim();
  }

  function majuscule(t) {
    t = String(t ?? "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // ---------- Indices ----------

  function rendreIndices(etat) {
    const visibles = e => e.indices.filter(i => i.type !== "chant");
    const avant = precedent ? visibles(precedent).length : Infinity;
    el.indices.innerHTML = visibles(etat)
      .map((ind, n) => `<li class="indice indice-${ind.type}${pictoIndice(ind) ? " indice-picto" : ""}${n >= avant ? " est-nouveau" : ""}">
          ${pictoIndice(ind)}
          <span class="indice-type">${echapper(ind.libelle)}</span>
          <span class="indice-valeur">${valeurIndice(ind)}</span>
        </li>`).join("");
  }

  // Taille et milieu : un pictogramme 8-bit (js/pictos.js), le texte dessous.
  // Taille : trois oiseaux posés côte à côte (passereau, limicole, goéland),
  // celui du gabarit de l'oiseau du jour foncé, les autres grisés. Les pictos
  // prennent les couleurs du moment de la journée du décor et le suivent.
  function pictoIndice(ind) {
    const P = window.PiaflePictos;
    if (!P || (ind.type !== "taille" && ind.type !== "milieu")) return "";
    if (ind.type === "milieu") return P.html("milieu", ind.valeur);
    const g = P.GABARITS[P.gabarit(ind.envergure_cm, ind.longueur_cm)];
    return P.html("taille", ind.envergure_cm, ind.longueur_cm) +
      (g ? `<span class="visuellement-cache">Gabarit : ${g.libelle.toLowerCase()}.</span>` : "");
  }

  function valeurIndice(ind) {
    if (ind.type === "palette") {
      return `<span class="palette">${ind.valeur.map(c => `<i style="background:${echapper(c)}"></i>`).join("")}</span>
        <span class="visuellement-cache">${ind.valeur.length} couleurs principales du plumage</span>`;
    }
    return echapper(majuscule(ind.valeur));
  }

  // ---------- Difficulté ----------

  function rendreDifficulte(etat) {
    const d = etat.difficulte;
    if (!d || !el.difficulte) return;
    el.difficulte.dataset.niveau = String(d.niveau);
    el.difficulte.innerHTML = `<span class="difficulte-libelle"><span class="difficulte-mot">Oiseau </span>n°${etat.numero} · ${echapper(d.libelle)}</span>`;
    el.difficulte.setAttribute("aria-label", `Oiseau n°${etat.numero}, difficulté : ${d.libelle.toLowerCase()} (${d.niveau} sur 3)`);
  }

  // ---------- Essais ----------

  function retourEssai(e) {
    if (e.trouve) return "trouvé";
    const morceaux = [];
    // Même grande catégorie (passereaux, rapaces…), jamais la famille.
    if (e.meme_categorie) morceaux.push(`<span class="proche">même catégorie (${echapper(e.categorie)})</span>`);
    if (e.taille === "plus_grand") morceaux.push("cherche plus grand");
    else if (e.taille === "plus_petit") morceaux.push("cherche plus petit");
    else if (e.taille === "proche") morceaux.push("taille proche");
    return morceaux.join(", ") || "raté";
  }

  // Le dernier essai en haut de la pile, chacun avec son numéro.
  function rendreEssais(etat) {
    const avant = precedent ? precedent.essais.length : Infinity;
    el.essais.innerHTML = etat.essais.map((e, i) => `<li class="essai${i >= avant ? " est-nouveau" : ""}" data-trouve="${e.trouve}">
        <span class="essai-numero" aria-hidden="true">${i + 1}</span>
        <span class="essai-nom">${echapper(e.nom_fr)}</span>
        <span class="essai-retour">${retourEssai(e)}</span>
      </li>`).reverse().join("");
    el.essais.scrollTop = 0;
    $("historique-compte").textContent = etat.essais.length ? `${etat.essais.length} sur ${etat.essaisMax}` : "";
  }

  // ---------- Chant et forme d'onde ----------

  // La forme d'onde de tout l'enregistrement est calculée une fois, puis
  // dessinée en barres de pixels : la partie déjà écoutée se colore et un
  // clic sur l'onde fait avancer la lecture à cet endroit.
  let onde = null;                // hauteurs des barres (0 à 1), ou null
  let dureeDecodee = 0;           // durée lue dans le fichier décodé, en s
  let animation = 0;

  // Durée de l'enregistrement, ou 0 si elle est inconnue. Pour un fichier
  // servi en flux (MP3 de xeno-canto, par exemple), le navigateur annonce
  // une durée Infinity tant qu'il n'a pas tout lu : on prend alors la durée
  // du fichier décodé par calculerOnde().
  function dureeTotale() {
    const d = el.audio.duration;
    return Number.isFinite(d) && d > 0 ? d : dureeDecodee;
  }
  const LARGEUR_BARRE = 4, ESPACE_BARRE = 2;

  function urlLisible(url) {
    // Safari ne lit pas l'Ogg : Wikimedia fournit une version MP3 transcodée.
    if (!/\.ogg$/i.test(url) || el.audio.canPlayType('audio/ogg; codecs="vorbis"')) return url;
    const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/(.+)$/);
    return m ? `${m[1]}/transcoded/${m[2]}/${m[3]}/${m[3]}.mp3` : url;
  }

  function rendreChant(etat) {
    const s = etat.son;
    el.chant.hidden = !s;
    if (!s) return;
    const url = urlLisible(s.url);
    if (el.audio.dataset.url !== url) {
      el.audio.dataset.url = url;
      el.audio.src = url;
      onde = null;
      dureeDecodee = 0;
      dessinerOnde();
      calculerOnde(url);
    }
  }

  // Énergie de chaque tranche du son, sur une échelle douce (racine) pour
  // que les notes faibles restent visibles à côté des plus fortes.
  async function calculerOnde(url) {
    try {
      const reponse = await fetch(url);
      if (!reponse.ok) throw new Error(reponse.status);
      const brut = await reponse.arrayBuffer();
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      let son;
      try { son = await ctx.decodeAudioData(brut); } finally { if (ctx.close) ctx.close(); }
      const canal = son.getChannelData(0);
      const n = 240;
      const pas = Math.floor(canal.length / n);
      const energies = [];
      for (let i = 0; i < n; i++) {
        let somme = 0;
        for (let j = i * pas; j < (i + 1) * pas; j += 4) somme += canal[j] * canal[j];
        energies.push(Math.sqrt(somme / (pas / 4)));
      }
      // Le bruit de fond (médiane) est retiré, le maximum ramené à 1.
      const tries = energies.slice().sort((a, b) => a - b);
      const fond = tries[Math.floor(n * 0.3)], max = tries[n - 1] - fond || 1;
      if (el.audio.dataset.url !== url) return; // un autre son a été chargé entre-temps
      onde = energies.map(e => Math.sqrt(Math.max(0, e - fond) / max));
      dureeDecodee = son.duration || 0;
    } catch (_) {
      onde = null; // forme d'onde indisponible : la barre de progression suffit
    }
    dessinerOnde();
  }

  function tailleCanvas() {
    const c = el.sonogramme, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    return c.getContext("2d");
  }

  function dessinerOnde() {
    const ctx = tailleCanvas(), c = el.sonogramme, d = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, c.width, c.height);
    const duree = dureeTotale();
    const avance = duree ? Math.min(1, el.audio.currentTime / duree) : 0;
    const l = LARGEUR_BARRE * d, e = ESPACE_BARRE * d, unite = 2 * d;
    const barres = Math.max(1, Math.floor((c.width + e) / (l + e)));
    const milieu = Math.round(c.height / 2 / unite) * unite;
    for (let i = 0; i < barres; i++) {
      const v = onde ? onde[Math.floor(i / barres * onde.length)] : 0;
      // Hauteur arrondie à la « grosse pixel » pour garder l'aspect 8-bit.
      const h = Math.max(unite, Math.round(v * (c.height - unite) / 2 / unite) * unite);
      const joue = (i + 0.5) / barres <= avance;
      ctx.fillStyle = joue ? "#5E8A2E" : "rgba(43,30,20,.35)";
      ctx.fillRect(i * (l + e), milieu - h, l, h * 2);
    }
    const ecoule = el.audio.currentTime || 0;
    // Durée inconnue : seulement le temps écoulé, une fois la lecture lancée.
    el.chantTemps.textContent = duree ? `${minutes(Math.min(ecoule, duree))} / ${minutes(duree)}` : ecoule ? minutes(ecoule) : "";
  }

  const minutes = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  function boucle() {
    dessinerOnde();
    animation = requestAnimationFrame(boucle);
  }

  el.chantBouton.addEventListener("click", () => {
    if (el.audio.paused) el.audio.play().catch(() => { el.chantLibelle.textContent = "Lecture impossible"; });
    else el.audio.pause();
  });
  el.sonogramme.addEventListener("click", e => {
    const duree = dureeTotale();
    if (!duree) return;
    const r = el.sonogramme.getBoundingClientRect();
    el.audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * duree;
    dessinerOnde();
  });
  el.audio.addEventListener("loadedmetadata", dessinerOnde);
  el.audio.addEventListener("durationchange", dessinerOnde);
  el.audio.addEventListener("play", () => {
    el.chantBouton.setAttribute("aria-pressed", "true");
    el.chantLibelle.textContent = "Pause";
    cancelAnimationFrame(animation);
    animation = requestAnimationFrame(boucle);
  });
  el.audio.addEventListener("pause", () => {
    el.chantBouton.setAttribute("aria-pressed", "false");
    el.chantLibelle.textContent = "Écouter";
    cancelAnimationFrame(animation);
    dessinerOnde();
  });
  el.audio.addEventListener("ended", () => el.audio.dispatchEvent(new Event("pause")));

  // ---------- Fin de partie ----------

  function rendreFin(etat, vientDeFinir) {
    const fini = etat.statut !== "en_cours";
    el.revelation.hidden = !fini;
    el.fiche.hidden = !fini;
    el.saisie.hidden = fini;
    if (!fini) return;

    const o = etat.oiseau;
    el.nom.textContent = o.nom_fr;
    el.latin.textContent = `(${o.nom_scientifique})`;
    const n = etat.essais.length;
    el.bilan.innerHTML = etat.statut === "gagne"
      ? `<span class="bilan-surligne">Trouvé au ${n === 1 ? "1er" : n + "e"} essai</span>`
      : `<span class="bilan-surligne est-perdu">Oiseau non trouvé</span>`;
    const wiki = o.wikipedia || {};
    el.ficheLien.href = lienSur(wiki.url, ["fr.wikipedia.org"]) || `https://fr.wikipedia.org/wiki/${encodeURIComponent(o.nom_fr.replace(/ /g, "_"))}`;

    const credits = [];
    if (etat.photo) credits.push("Photo " + lienCredit(etat.photo));
    if (etat.son) credits.push("chant " + lienCredit(etat.son));
    el.credits.innerHTML = credits.join(" ; ") + ".";
    rendreProchain();

    el.revelation.classList.add("est-revelee");
    el.revelation.classList.toggle("sans-animation", !vientDeFinir);
  }

  function rendreProchain() {
    const maintenant = new Date();
    const paris = new Date(maintenant.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const minuit = new Date(paris); minuit.setHours(24, 0, 0, 0);
    const minutes = Math.max(0, Math.round((minuit - paris) / 60000));
    const h = Math.floor(minutes / 60), m = minutes % 60;
    el.prochain.textContent = `Prochain oiseau dans ${h ? h + " h " : ""}${m} min`;
  }
  setInterval(() => { if (!el.fiche.hidden) rendreProchain(); }, 30000);

  // Le bouton de partage copie une phrase toute faite ; il dit « Copié ! »
  // un instant à la place de son libellé.
  let minuteurPartage = 0;
  el.partager.addEventListener("click", async () => {
    const texte = Piafle.partage();
    let libelle = "Copié !";
    try {
      await navigator.clipboard.writeText(texte);
    } catch (err) {
      // Presse-papiers refusé (vieux navigateur, page non sécurisée) : on
      // passe par une zone de texte cachée.
      const zone = document.createElement("textarea");
      zone.value = texte;
      zone.setAttribute("readonly", "");
      zone.style.cssText = "position:fixed;opacity:0;left:0;top:0";
      document.body.appendChild(zone);
      zone.select();
      try { if (!document.execCommand("copy")) libelle = "Échec"; } catch (e) { libelle = "Échec"; }
      zone.remove();
    }
    el.partageLibelle.textContent = libelle;
    el.partager.classList.add("est-copie");
    clearTimeout(minuteurPartage);
    minuteurPartage = setTimeout(() => {
      el.partageLibelle.textContent = "Partager";
      el.partager.classList.remove("est-copie");
    }, 2000);
  });

  // ---------- Saisie et suggestions ----------

  function rendreSuggestions() {
    const t = el.champ.value;
    const liste = t.trim() ? Piafle.suggestions(t) : [];
    selection = liste.length ? 0 : -1;
    el.propositions.hidden = !liste.length;
    el.champ.setAttribute("aria-expanded", String(!!liste.length));
    el.propositions.innerHTML = liste.map((s, i) => `<li class="proposition" role="option" id="prop-${i}"
        aria-selected="${i === selection}" data-nom="${echapper(s.nom_fr)}">
        <span class="proposition-texte"><span class="proposition-nom">${surligner(s.nom_fr, t)}</span>
          <span class="proposition-latin">(${echapper(s.nom_scientifique)})</span></span>
        <span class="proposition-touche" aria-hidden="true">Entrée</span>
      </li>`).join("");
    placerPropositions();
    majSelection();
  }

  // La liste s'ouvre au-dessus du champ, ou en dessous s'il y a nettement
  // plus de place de ce côté-là. Sa hauteur est limitée à la place visible,
  // pour que la première proposition ne sorte jamais de l'écran (elle
  // défile au-delà).
  function placerPropositions() {
    if (el.propositions.hidden) return;
    const v = window.visualViewport;
    const haut = v ? v.offsetTop : 0;
    const bas = haut + (v ? v.height : innerHeight);
    const r = el.saisie.getBoundingClientRect();
    const dessus = r.top + 4 - haut - 8;      // la liste déborde de 0.25rem sur la saisie
    const dessous = bas - (r.bottom - 4) - 8;
    const versLeBas = dessus < 200 && dessous > dessus;
    el.propositions.classList.toggle("vers-le-bas", versLeBas);
    el.propositions.style.setProperty("--place", Math.max(80, Math.floor(versLeBas ? dessous : dessus)) + "px");
  }

  function majSelection() {
    const items = [...el.propositions.children];
    items.forEach((li, i) => li.setAttribute("aria-selected", String(i === selection)));
    if (selection >= 0 && items[selection]) {
      el.champ.setAttribute("aria-activedescendant", items[selection].id);
      items[selection].scrollIntoView({ block: "nearest" });
    } else {
      el.champ.removeAttribute("aria-activedescendant");
    }
  }

  function fermerSuggestions() {
    el.propositions.hidden = true;
    el.champ.setAttribute("aria-expanded", "false");
    el.champ.removeAttribute("aria-activedescendant");
    selection = -1;
  }

  function surligner(nom, t) {
    const simple = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const i = simple(nom).indexOf(simple(t.trim()));
    if (i < 0) return echapper(nom);
    const l = t.trim().length;
    return echapper(nom.slice(0, i)) + "<mark>" + echapper(nom.slice(i, i + l)) + "</mark>" + echapper(nom.slice(i + l));
  }

  function proposer(nom) {
    const r = Piafle.proposer(nom);
    if (!r.ok) { el.message.textContent = r.erreur; return; }
    el.champ.value = "";
    el.message.textContent = "";
    fermerSuggestions();
  }

  el.champ.addEventListener("input", () => { el.message.textContent = ""; rendreSuggestions(); });
  el.champ.addEventListener("keydown", e => {
    const n = el.propositions.children.length;
    if (el.propositions.hidden || !n) return;
    if (e.key === "ArrowDown") { e.preventDefault(); selection = (selection + 1) % n; majSelection(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selection = (selection - 1 + n) % n; majSelection(); }
    else if (e.key === "Escape") { fermerSuggestions(); }
  });
  el.champ.addEventListener("blur", () => setTimeout(fermerSuggestions, 150));
  el.propositions.addEventListener("mousedown", e => e.preventDefault());
  // « Proposer » ne prend pas le focus : le clavier reste ouvert pour l'essai
  // suivant et la page ne se réorganise pas pendant le toucher.
  el.saisie.querySelector("button[type=submit]").addEventListener("mousedown", e => {
    if (document.activeElement === el.champ) e.preventDefault();
  });
  el.propositions.addEventListener("click", e => {
    const li = e.target.closest(".proposition");
    if (li) proposer(li.dataset.nom);
  });
  el.saisie.addEventListener("submit", e => {
    e.preventDefault();
    const choisi = !el.propositions.hidden && el.propositions.children[selection];
    const nom = choisi ? choisi.dataset.nom : el.champ.value;
    if (!nom.trim()) { el.message.textContent = "Écris le nom d'un oiseau, puis choisis-le dans la liste."; return; }
    proposer(nom);
  });

  // ---------- Aide ----------

  el.ouvrirAide.addEventListener("click", () => el.aide.showModal());
  // Un clic en dehors de la fenêtre (sur le fond assombri) la ferme aussi.
  // Le clic doit commencer et finir dehors : sélectionner du texte en glissant
  // jusqu'au fond ne ferme rien.
  const dehors = e => {
    if (e.target !== el.aide) return false;
    const r = el.aide.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let appuiDehors = false;
  el.aide.addEventListener("pointerdown", e => { appuiDehors = dehors(e); });
  el.aide.addEventListener("click", e => {
    if (appuiDehors && dehors(e)) el.aide.close();
    appuiDehors = false;
  });

  // ---------- Rendu ----------

  function echapper(t) {
    return String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function rendre() {
    const etat = Piafle.etat();
    el.partie.dataset.statut = etat.statut;
    const vientDeFinir = precedent && precedent.statut === "en_cours" && etat.statut !== "en_cours";
    rendreDifficulte(etat);
    rendrePhoto(etat);
    rendreIndices(etat);
    rendreChant(etat);
    rendreEssais(etat);
    $("invitation").hidden = etat.essais.length > 0;
    rendreFin(etat, vientDeFinir);
    if (vientDeFinir && etat.son && etat.statut === "gagne") el.chantBouton.click();
    precedent = etat;
  }

  el.date.textContent = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

  Piafle.pret.then(() => {
    rendre();
    if (!Piafle.etat().essais.length) {
      try { if (!localStorage.getItem("piafle-aide-vue")) { el.aide.showModal(); localStorage.setItem("piafle-aide-vue", "1"); } } catch (_) {}
    }
  }).catch(() => {
    el.message.textContent = "Les données du jour ne se chargent pas. Vérifie ta connexion, puis recharge la page.";
  });
  document.addEventListener("piafle:change", rendre);
  addEventListener("resize", () => { if (!el.chant.hidden) dessinerOnde(); placerPropositions(); });

  // ---------- Hauteur de l'écran ----------

  // La page ne défile jamais : elle prend la hauteur réellement visible.
  // Quand le clavier du téléphone s'ouvre, cette hauteur diminue ; on le
  // signale au CSS, qui ne garde alors que l'essentiel au-dessus du champ.
  const vue = window.visualViewport;
  let repos = { largeur: 0, hauteur: 0 };   // zone visible sans clavier

  function clavierOuvert() {
    if (document.activeElement !== el.champ) return false;
    // Safari iOS : la fenêtre garde sa hauteur, seule la zone visible rétrécit.
    if (innerHeight - vue.height > 150) return true;
    // Chrome iOS, Android : la fenêtre entière rétrécit avec le clavier ; on
    // compare à la hauteur mesurée avant que le champ ait le focus.
    return vue.width === repos.largeur && repos.hauteur - vue.height > 150;
  }

  function ajusterHauteur() {
    const racine = document.documentElement;
    if (document.activeElement !== el.champ) repos = { largeur: vue.width, hauteur: vue.height };
    racine.style.setProperty("--hauteur", vue.height + "px");
    racine.classList.toggle("clavier-ouvert", clavierOuvert());
    if (scrollY || vue.offsetTop) scrollTo(0, 0);
    if (!el.chant.hidden) dessinerOnde();
    placerPropositions();
  }
  // L'onde suit la largeur de son canevas, qui change avec l'agencement.
  if (window.ResizeObserver) new ResizeObserver(() => { if (!el.chant.hidden) dessinerOnde(); }).observe(el.sonogramme);
  if (vue) {
    vue.addEventListener("resize", ajusterHauteur);
    vue.addEventListener("scroll", ajusterHauteur);
    el.champ.addEventListener("focus", ajusterHauteur);
    el.champ.addEventListener("blur", ajusterHauteur);
    ajusterHauteur();
  }
})();
