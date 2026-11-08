// Interface de Piafle : affiche l'état fourni par Piafle.etat()
// et transmet les propositions. Aucune règle du jeu ici.

(function () {
  const $ = id => document.getElementById(id);
  const el = {
    date: $("date-jour"), lucarne: $("lucarne"), photo: $("photo"), credit: $("credit-photo"),
    nid: $("nid"), revelation: $("revelation"), nom: $("nom-oiseau"), latin: $("nom-latin"), bilan: $("bilan"),
    indices: $("indices"), chant: $("chant"), chantBouton: $("chant-bouton"), chantLibelle: $("chant-libelle"),
    sonogramme: $("sonogramme"), audio: $("audio"), essais: $("essais"),
    fiche: $("fiche"), ficheTexte: $("fiche-texte"), ficheLien: $("fiche-wikipedia"),
    partager: $("partager"), partageRetour: $("partage-retour"), prochain: $("prochain"), credits: $("credits"),
    saisie: $("saisie"), champ: $("champ"), propositions: $("propositions"), message: $("saisie-message"),
    aide: $("aide"), ouvrirAide: $("ouvrir-aide"),
  };

  let precedent = null;           // état affiché au rendu précédent
  let selection = -1;             // proposition surlignée dans la liste

  // ---------- Œufs ----------

  const COQUE = "M14 1C6.6 1 1 12.6 1 21.5a13 13 0 0 0 26 0C27 12.6 21.4 1 14 1z";
  const ZIGZAG = "0,15 4,12 8,16 12,12 16,16 20,12 24,16 28,13";

  function oeuf(i, etat) {
    const id = "o" + i;
    return `<svg viewBox="0 0 28 36" aria-hidden="true">
      <defs>
        <clipPath id="${id}h"><polygon points="0,0 28,0 ${ZIGZAG.split(" ").reverse().join(" ")}"/></clipPath>
        <clipPath id="${id}b"><polygon points="${ZIGZAG} 28,40 0,40"/></clipPath>
      </defs>
      <g clip-path="url(#${id}b)">
        <path class="coque" d="${COQUE}"/>
        <circle class="tache" cx="9" cy="24" r="1.3"/><circle class="tache" cx="18" cy="28" r="1"/><circle class="tache" cx="16" cy="20" r=".8"/>
      </g>
      <polyline class="fele" points="${ZIGZAG.split(" ").slice(1, -1).join(" ")}"/>
      <g class="chapeau"><g clip-path="url(#${id}h)">
        <path class="coque" d="${COQUE}"/>
        <circle class="tache" cx="12" cy="7" r="1.1"/><circle class="tache" cx="17" cy="11" r=".9"/>
      </g></g>
    </svg>`;
  }

  function rendreNid(etat) {
    const essais = etat.essais;
    if (!el.nid.children.length) {
      for (let i = 0; i < etat.essaisMax; i++) {
        const li = document.createElement("li");
        li.className = "oeuf";
        li.innerHTML = oeuf(i);
        el.nid.appendChild(li);
      }
    }
    [...el.nid.children].forEach((li, i) => {
      const e = essais[i];
      let etatOeuf = "intact", texte = "à jouer";
      if (e) { etatOeuf = e.trouve ? "eclos" : "rate"; texte = e.trouve ? "trouvé" : "raté"; }
      else if (i === essais.length && etat.statut === "en_cours") { etatOeuf = "courant"; texte = "en cours"; }
      li.dataset.etat = etatOeuf;
      li.setAttribute("aria-label", `Essai ${i + 1} : ${texte}`);
    });
  }

  // ---------- Lucarne ----------

  function rendrePhoto(etat) {
    const p = etat.photo;
    if (!p) return;
    if (el.photo.dataset.url !== p.url) {
      el.photo.dataset.url = p.url;
      el.photo.classList.remove("est-chargee");
      el.photo.onload = () => { el.photo.classList.add("est-chargee"); el.lucarne.classList.remove("en-erreur"); };
      el.photo.onerror = () => el.lucarne.classList.add("en-erreur");
      el.photo.src = p.url;
    }
    el.lucarne.dataset.recadrage = String(etat.recadrage);
    el.photo.alt = etat.oiseau
      ? `${etat.oiseau.nom_fr}, photo entière`
      : "L'oiseau mystère, vu de près";
    el.credit.innerHTML = etat.oiseau
      ? `Photo ${lienCredit(p)}`
      : "";
  }

  function lienCredit(m) {
    const auteur = nettoyerAuteur(m.auteur);
    const licence = echapper(m.licence || "licence inconnue");
    const lien = m.page || m.licence_url;
    return `${auteur ? "de " + echapper(auteur) + ", " : ""}${lien ? `<a href="${echapper(lien)}">${licence}</a>` : licence}`;
  }

  function nettoyerAuteur(a) {
    if (!a || /no machine-readable author|non renseign/i.test(a)) return "";
    return a.replace(/<[^>]*>/g, "").trim();
  }

  function majuscule(t) {
    t = String(t ?? "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // Les trois premières phrases du résumé Wikipédia suffisent pour la fiche.
  function resumeCourt(texte) {
    const phrases = String(texte || "").replace(/\n+/g, " ").match(/[^.!?]+[.!?]+(\s|$)/g) || [];
    return phrases.slice(0, 3).join("").trim();
  }

  // ---------- Indices ----------

  function rendreIndices(etat) {
    const visibles = e => e.indices.filter(i => i.type !== "chant");
    const avant = precedent ? visibles(precedent).length : Infinity;
    el.indices.innerHTML = visibles(etat)
      .map((ind, n) => `<li class="indice${n >= avant ? " est-nouveau" : ""}">
          <span class="indice-type">${echapper(ind.libelle)}</span>
          <span class="indice-valeur">${echapper(majuscule(ind.valeur))}</span>
        </li>`).join("");
  }

  // ---------- Essais ----------

  function retourEssai(e) {
    if (e.trouve) return "trouvé";
    const morceaux = [];
    if (e.meme_famille) morceaux.push('<span class="proche">même famille</span>');
    else if (e.meme_ordre) morceaux.push("même ordre");
    if (e.taille === "plus_grand") morceaux.push("cherche plus grand");
    else if (e.taille === "plus_petit") morceaux.push("cherche plus petit");
    else if (e.taille === "proche") morceaux.push("taille proche");
    return morceaux.join(", ") || "raté";
  }

  function rendreEssais(etat) {
    el.essais.innerHTML = etat.essais.map(e => `<li class="essai" data-trouve="${e.trouve}">
        <span class="essai-nom">${echapper(e.nom_fr)}</span>
        <span class="essai-retour">${retourEssai(e)}</span>
      </li>`).join("");
  }

  // ---------- Chant et sonogramme ----------

  let audioCtx = null, analyseur = null, donnees = null, animation = 0;

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
      dessinerRepos();
    }
  }

  function preparerAnalyse() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaElementSource(el.audio);
      analyseur = audioCtx.createAnalyser();
      analyseur.fftSize = 512;
      analyseur.smoothingTimeConstant = 0.2;
      analyseur.minDecibels = -85;
      analyseur.maxDecibels = -20;
      donnees = new Uint8Array(analyseur.frequencyBinCount);
      source.connect(analyseur);
      analyseur.connect(audioCtx.destination);
    } catch (_) { audioCtx = null; }
  }

  function tailleCanvas() {
    const c = el.sonogramme, r = c.getBoundingClientRect(), d = window.devicePixelRatio || 1;
    if (c.width !== Math.round(r.width * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    return c.getContext("2d");
  }

  function dessinerRepos() {
    const ctx = tailleCanvas(), c = el.sonogramme;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(28,43,75,.25)";
    ctx.fillRect(0, c.height / 2, c.width, Math.max(1, c.height / 48));
  }

  // Sonogramme défilant : le temps de gauche à droite, les aigus en haut.
  function dessinerSonogramme() {
    const ctx = tailleCanvas(), c = el.sonogramme;
    const pas = Math.max(2, Math.round(c.width / 160));
    // « copy » remplace tout le canevas par sa copie décalée, sinon l'image bave vers la gauche.
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(c, -pas, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(c.width - pas, 0, pas, c.height);
    if (analyseur) {
      analyseur.getByteFrequencyData(donnees);
      // Les chants d'oiseaux vivent surtout entre 1 et 10 kHz.
      const nyquist = audioCtx.sampleRate / 2;
      const debut = Math.floor(1000 / nyquist * donnees.length);
      const fin = Math.floor(10000 / nyquist * donnees.length);
      const n = fin - debut;
      // Le bruit de fond est estimé par la médiane de la colonne :
      // seul ce qui dépasse nettement la médiane (le chant) est dessiné.
      const bande = Array.from(donnees.subarray(debut, fin)).sort((x, y) => x - y);
      const max = bande[n - 1];
      const seuil = Math.max(90, bande[n >> 1] + 40);
      for (let i = 0; i < n; i++) {
        const octet = donnees[debut + i];
        if (octet < seuil) continue;
        ctx.fillStyle = `rgba(28,43,75,${0.25 + 0.75 * (octet - seuil) / Math.max(1, max - seuil)})`;
        const y = c.height - (i + 1) / n * c.height;
        ctx.fillRect(c.width - pas, y, pas, Math.ceil(c.height / n) + 1);
      }
    }
    animation = requestAnimationFrame(dessinerSonogramme);
  }

  el.chantBouton.addEventListener("click", () => {
    if (el.audio.paused) {
      preparerAnalyse();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
      el.audio.play().catch(() => { el.chantLibelle.textContent = "Lecture impossible"; });
    } else {
      el.audio.pause();
    }
  });
  el.audio.addEventListener("play", () => {
    el.chantBouton.setAttribute("aria-pressed", "true");
    el.chantLibelle.textContent = "Pause";
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cancelAnimationFrame(animation);
      animation = requestAnimationFrame(dessinerSonogramme);
    }
  });
  el.audio.addEventListener("pause", () => {
    el.chantBouton.setAttribute("aria-pressed", "false");
    el.chantLibelle.textContent = "Écouter le chant";
    cancelAnimationFrame(animation);
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
    el.latin.textContent = o.nom_scientifique;
    const n = etat.essais.length;
    el.bilan.innerHTML = etat.statut === "gagne"
      ? `<span class="bilan-surligne">Trouvé au ${n === 1 ? "1er" : n + "e"} essai</span>`
      : "Pas trouvé cette fois. Voici l'oiseau du jour.";
    const wiki = o.wikipedia || {};
    el.ficheTexte.textContent = resumeCourt(wiki.resume);
    el.ficheLien.href = wiki.url || "#";
    el.ficheLien.parentElement.hidden = !wiki.url;

    const credits = [];
    if (etat.son) credits.push("Chant " + lienCredit(etat.son));
    if (wiki.url) credits.push(`texte <a href="${wiki.url}">Wikipédia</a>, CC BY-SA 4.0`);
    el.credits.innerHTML = credits.join(" ; ") + ".";
    rendreProchain();

    el.revelation.classList.add("est-revelee");
    el.revelation.classList.toggle("sans-animation", !vientDeFinir);
    if (vientDeFinir) {
      el.revelation.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
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

  el.partager.addEventListener("click", async () => {
    const texte = Piafle.partage();
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ text: texte });
        return;
      }
      await navigator.clipboard.writeText(texte);
      el.partageRetour.textContent = "Résultat copié. Colle-le où tu veux.";
    } catch (err) {
      if (err && err.name === "AbortError") return;
      el.partageRetour.textContent = "Copie impossible ici. Sélectionne le texte : " + texte;
    }
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
        <span class="proposition-nom">${surligner(s.nom_fr, t)}</span>
        <span class="proposition-latin">${echapper(s.nom_scientifique)}</span>
      </li>`).join("");
    majSelection();
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

  // ---------- Rendu ----------

  function echapper(t) {
    return String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function rendre() {
    const etat = Piafle.etat();
    const vientDeFinir = precedent && precedent.statut === "en_cours" && etat.statut !== "en_cours";
    rendrePhoto(etat);
    rendreNid(etat);
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
  addEventListener("resize", () => { if (el.audio.paused && !el.chant.hidden) dessinerRepos(); });
})();
