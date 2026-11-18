// Pictogrammes 8-bit des indices « taille » et « milieu ».
// Chaque picto est dessiné pixel par pixel sur un petit canevas (44 × 26),
// puis affiché agrandi sans lissage (voir .picto dans css/piafle.css).
//   PiaflePictos.src("milieu", "forêts")       -> adresse data: de l'image
//   PiaflePictos.src("taille", envergure, longueur)
//   PiaflePictos.html(type, a, b)              -> balise <img> qui suit le moment
//   PiaflePictos.gabarit(envergure, longueur)  -> indice dans GABARITS
//   PiaflePictos.animer(img)                   -> joue l'animation de survol
//   PiaflePictos.MILIEUX, MOMENTS, GABARITS    -> listes disponibles
// Pour ajouter un milieu : une fonction de plus dans PAYSAGES, du même nom
// que la valeur du champ « milieu » de data/species.json.
(() => {
  const L = 44, H = 26;

  // Couleurs du décor de jour (js/decor.js), pour rester dans le même monde.
  const JOUR = {
    ciel: ["#5FA7DA", "#7DBCE4", "#A2D2EA", "#C9E6EC"],
    nuage: "#F4FAFB", nuageOmbre: "#C3DCE8",
    mont: "#86A6C0", montOmbre: "#5E7E9C", neige: "#EEF5F6", neigeOmbre: "#BFD3DF",
    colline: "#5D8A82", loin: "#4F7D6A",
    sapinS: "#1E4433", sapinM: "#2F6145", sapinC: "#4E8A50",
    prairie: "#86B04A", prairieOmbre: "#6C9A3C", herbe: "#4F7A2C", herbeC: "#9CC85A",
    terre: "#9A7448", terreOmbre: "#7A5A38",
    eau: "#4F93C0", eauClair: "#B5DDEC", eauSombre: "#3C7AA6",
    tronc: "#6B4A2E", troncOmbre: "#4A3220", troncClair: "#8A6440",
    feuilleA: "#D9762B", feuilleB: "#EDB43C", feuilleC: "#9C4A22",
    roche: "#8E9196", rocheOmbre: "#666B72", rocheClair: "#B4B7BA",
    roseau: "#7C8F3A", massette: "#6A4024",
    encre: "#2B1E14", papier: "#F2E8C9",
    sable: "#EBD79C", sableOmbre: "#D2B878", craie: "#F1ECDD", craieOmbre: "#CFC8B4",
    mur: "#EADFC2", murOmbre: "#CDBF9C", ardoise: "#5B6B7C", ardoiseOmbre: "#44525F",
    tuile: "#C8553D", tuileOmbre: "#9C3F2C", vitre: "#33506B", lumiere: "#F4CF3C",
    mousseObs: "#5E8A2E", ble: "#E6C24E", bleOmbre: "#C79E36", rouge: "#D8362C", rose: "#E79AB8",
  };

  // ---------- Les quatre moments de la journée ----------
  // Mêmes palettes que le décor animé (PAL de js/decor.js) pour les couleurs
  // qu'il définit ; les autres (murs, tuiles, fleurs…) reçoivent la même
  // teinte que le décor applique à ses sprites (teinte, force).
  const MOMENTS = {
    jour: { teinte: null, force: 0 },
    aube: {
      ciel: ["#4B5D9A", "#8E73A6", "#E39A8C", "#F6C98E"],
      nuage: "#F7C7B0", nuageOmbre: "#B98AA3",
      mont: "#7C7AA6", montOmbre: "#5C5A86", neige: "#F6DCD6", neigeOmbre: "#C9A9B8",
      colline: "#5A6A80", loin: "#4F6A72",
      sapinS: "#1D3A33", sapinM: "#2C5246", sapinC: "#41704F",
      prairie: "#76944A", prairieOmbre: "#5F7B3C", herbe: "#43632F", herbeC: "#8EAA58", terre: "#86664A", terreOmbre: "#694E38",
      eau: "#7C82B0", eauClair: "#F6D0A6", eauSombre: "#5C6390",
      tronc: "#5C4030", troncOmbre: "#3D2A20", troncClair: "#7A5A42",
      feuilleA: "#C76A33", feuilleB: "#DDA04A", feuilleC: "#8A4228",
      roche: "#857F8E", rocheOmbre: "#615C6C", rocheClair: "#AAA2AE",
      roseau: "#6E7E3E", massette: "#5C3A24",
      teinte: "#8E73A6", force: 0.22, etoile: "#FBE9D0",
    },
    soir: {
      ciel: ["#2E3C78", "#7B4F8E", "#D66E5E", "#F2A65A"],
      nuage: "#E9926F", nuageOmbre: "#8C4F72",
      mont: "#6A5A88", montOmbre: "#493F66", neige: "#F0BFAE", neigeOmbre: "#A9819A",
      colline: "#46506A", loin: "#3D4F5E",
      sapinS: "#152A26", sapinM: "#223F38", sapinC: "#335A46",
      prairie: "#66803F", prairieOmbre: "#506734", herbe: "#384F28", herbeC: "#7E9A4C", terre: "#755540", terreOmbre: "#5A4030",
      eau: "#6A5C8E", eauClair: "#F2A65A", eauSombre: "#4A4270",
      tronc: "#4E3528", troncOmbre: "#33231B", troncClair: "#6A4A36",
      feuilleA: "#B85A2E", feuilleB: "#CF8E3E", feuilleC: "#7A3824",
      roche: "#6E6478", rocheOmbre: "#4F4858", rocheClair: "#958A9A",
      roseau: "#5C6A36", massette: "#4E3020",
      teinte: "#7B4F8E", force: 0.32, etoile: "#FFE7C2", allume: true,
    },
    nuit: {
      // Nuit de pleine lune, comme le décor
      ciel: ["#0C1230", "#152151", "#22366D", "#354F85"],
      nuage: "#4E5E94", nuageOmbre: "#313E71",
      mont: "#3F4E82", montOmbre: "#25305D", neige: "#BEC9E5", neigeOmbre: "#7686B5",
      colline: "#202F5C", loin: "#18284C",
      sapinS: "#091325", sapinM: "#132A46", sapinC: "#274D66",
      prairie: "#2D5068", prairieOmbre: "#234158", herbe: "#193249", herbeC: "#406A7C", terre: "#49465D", terreOmbre: "#35334A",
      eau: "#213974", eauClair: "#BECBE9", eauSombre: "#162757",
      tronc: "#40384E", troncOmbre: "#251F35", troncClair: "#656784",
      feuilleA: "#5A4566", feuilleB: "#7C637B", feuilleC: "#3A2D4C",
      roche: "#4A5475", rocheOmbre: "#323A59", rocheClair: "#6E799A",
      roseau: "#34525B", massette: "#3E303C",
      teinte: "#1D2F72", force: 0.5, etoile: "#F6F3DA", allume: true,
    },
  };

  function melange(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const m = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return "#" + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
  }

  // Couleurs du ciel, identiques à celles du décor même la nuit.
  const CIEL = new Set(["ciel", "nuage", "nuageOmbre"]);
  // Éclaircit une couleur de nuit en écartant les tons : les sombres sont
  // à peu près doublés, les clairs sont comprimés sous un plafond gris-bleu.
  // Il n'y a donc jamais de blanc pur la nuit (neige, vagues, reflets).
  const PLAFOND_NUIT = [176, 188, 222];
  function eclaircir(col) {
    const n = parseInt(col.slice(1), 16);
    const v = (s, i) => Math.round(PLAFOND_NUIT[i] * (1 - Math.exp(-(((n >> s) & 255) * 1.3 / PLAFOND_NUIT[i]) * 1.3)));
    return "#" + ((1 << 24) + (v(16, 0) << 16) + (v(8, 1) << 8) + v(0, 2)).toString(16).slice(1);
  }
  // Feu de camp du décor : flammes, braises et lueur.
  const FEU = { flammeC: "#FFE27A", flammeM: "#F7A83A", flammeS: "#E0562A", braise: "#FFB347" };
  const FUMEE = { jour: "#C9C3BA", nuit: "#5A6380" };   // fumée du décor
  const LUEUR = "rgba(255, 179, 71, 0.36)";
  const FAISCEAU = "rgba(255, 240, 170, 0.6)";   // faisceau du phare

  let C = JOUR, M = MOMENTS.jour, moment = "jour", force = 0, palette = new Set(), teintes = new Map();
  function preparer(m) {
    moment = MOMENTS[m] ? m : "jour";
    M = MOMENTS[moment];
    // La nuit, le décor est très sombre : à la taille d'une vignette on ne
    // distingue plus les formes. On garde son ciel tel quel, mais le paysage
    // est éclairci (comme sous la lune) et le voile bleu est moins fort.
    force = moment === "nuit" ? 0.42 : M.force;
    const teinter = col => (M.teinte ? melange(col, M.teinte, force) : col);
    const clair = (k, col) => (moment === "nuit" && !CIEL.has(k) ? eclaircir(col) : col);
    C = {};
    for (const [k, v] of Object.entries(JOUR)) C[k] = k in M ? clair(k, M[k]) : Array.isArray(v) ? v.map(teinter) : teinter(v);
    if (M.allume) C.lumiere = JOUR.lumiere;   // fenêtres et réverbère allumés le soir et la nuit
    Object.assign(C, FEU);                    // flammes et braises, jamais teintées
    C.fumee = moment === "nuit" ? FUMEE.nuit : FUMEE.jour;
    palette = new Set(Object.values(C).flat());
    teintes = new Map();
  }
  // Couleur écrite en dur dans un dessin (fleur blanche, mur…) : même teinte.
  function couleur(c) {
    if (!M.teinte || typeof c !== "string" || c[0] !== "#" || palette.has(c)) return c;
    if (!teintes.has(c)) teintes.set(c, melange(c, M.teinte, force));
    return teintes.get(c);
  }

  // ---------- Animation au survol ----------
  // Chaque vignette a une petite animation de 8 images (0,7 s) : un détail
  // bouge, puis l'image revient exactement à son état de repos (image 0).
  // Les paysages (milieu) tournent en boucle tant que la souris reste dessus,
  // sur un cycle de 16 images : les détails périodiques se répètent toutes
  // les 8 images, les oiseaux qui traversent le ciel ont le temps de sortir.
  // T est le numéro de l'image en cours de dessin, lu par les dessins.
  const IMAGES = 8, CYCLE = 16, DUREE_IMAGE = 100;   // ms par image
  let T = 0;

  let ctx;
  const r = (x, y, l, h, c) => { ctx.fillStyle = couleur(c); ctx.fillRect(x, y, l, h); };
  const p = (x, y, c) => r(x, y, 1, 1, c);
  // Trame de Bayer 4 × 4 : dégradés et textures tramés, comme le décor.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

  function ciel(bas, basEtoiles = Infinity) {
    const n = C.ciel.length;
    for (let y = 0; y < bas; y++) {
      const f = (y / bas) * (n - 1), i = Math.floor(f);
      for (let x = 0; x < L; x++) p(x, y, C.ciel[Math.min(n - 1, i + ((f - i) * 16 > bay(x, y) ? 1 : 0))]);
    }
    // étoiles : la nuit, et quelques-unes encore à l'aube, dans le haut du ciel
    if (moment === "nuit" || moment === "aube") {
      const limite = Math.min(basEtoiles, moment === "nuit" ? bas * 0.75 : bas * 0.3);
      for (let y = 0; y < limite; y++) for (let x = 0; x < L; x++)
        if ((x * 37 + y * 61 + x * y * 7 + 11) % (moment === "nuit" ? 47 : 59) === 0) p(x, y, M.etoile);
    }
  }
  function nuage(x, y, l) {
    r(x + 1, y, l - 3, 1, C.nuage); r(x, y + 1, l, 1, C.nuage); r(x + 1, y + 2, l - 1, 1, C.nuageOmbre);
    r(x + 2, y - 1, Math.max(1, l - 6), 1, C.nuage);
  }
  // Disque plein, éclairé en haut à gauche.
  function boule(cx, cy, ray, sombre, moyen, clair) {
    for (let y = -ray; y <= ray; y++) for (let x = -ray; x <= ray; x++) {
      if (x * x + y * y > ray * ray + 1) continue;
      const lum = -(x + y * 1.4) / ray;
      p(cx + x, cy + y, lum > 0.9 ? clair : lum < -0.7 ? sombre : moyen);
    }
  }
  function sapin(x, base, h, couleurs = [C.sapinS, C.sapinM, C.sapinC]) {
    const [s, m, c] = couleurs;
    p(x, base, C.troncOmbre); p(x, base - 1, C.troncOmbre);
    for (let j = 0; j < h; j++) {
      const demi = Math.min(Math.floor(h / 2.4), Math.floor((j % 4) / 1.5) + Math.floor(j / 3));
      const y = base - 2 - (h - 1 - j);
      r(x - demi, y, demi * 2 + 1, 1, m);
      if (demi > 0) { r(x + 1, y, demi, 1, s); p(x - demi, y, c); }
    }
  }
  // Montagne : pan clair à gauche, pan d'ombre à droite, neige au sommet.
  function mont(cx, sommet, base, pente, clair, ombre, neige = 0) {
    for (let y = sommet; y < base; y++) {
      const j = y - sommet, demi = Math.round(j * pente);
      for (let x = cx - demi; x <= cx + demi; x++) {
        if (x < 0 || x >= L) continue;
        const aOmbre = x > cx + Math.round(Math.sin(j * 0.9) * 1.2);
        const enneige = j < neige + ((x * 3 + j) % 3 === 0 ? 1 : 0) - (aOmbre ? 1 : 0);
        p(x, y, enneige ? (aOmbre ? C.neigeOmbre : C.neige) : aOmbre ? ombre : clair);
      }
    }
  }
  function herbes(y0, y1, fond, touffes, graine = 3) {
    r(0, y0, L, y1 - y0, fond);
    for (let y = y0; y < y1; y++) for (let x = 0; x < L; x++) {
      if ((x * 7 + y * 13 + graine) % 11 === 0) p(x, y, touffes);
    }
  }
  function fleur(x, y, c) { p(x, y, c); p(x, y + 1, C.herbe); }
  // Glissement des reflets sur l'eau pendant l'animation (aller puis retour).
  const ONDE = [0, 1, 2, 3, 3, 2, 1, 0];

  // Lumières du soir et de la nuit. La lueur est faite de fines particules
  // tramées, comme le halo du feu de camp du décor.
  function lueur(cx, cy, ray, etire = 1) {
    for (let y = -ray; y <= ray; y++) for (let x = -Math.round(ray * etire); x <= Math.round(ray * etire); x++) {
      const d = Math.sqrt((x / etire) ** 2 + y * y) / ray;
      if (d < 1 && bay(cx + x, cy + y) > 5 + d * 11) p(cx + x, cy + y, LUEUR);
    }
  }
  // Feu de camp posé sur le sol (ligne y) : bûches, flammes, braises qui montent.
  function feu(x, y) {
    lueur(x, y - 2, T % 2 ? 6 : 7, 1.3);                       // la lueur respire
    r(x - 2, y, 5, 1, C.troncOmbre);
    r(x - 1, y - 1, 3, 1, C.flammeS); r(x - 1, y - 2, 3, 1, C.flammeM); p(x, y - 2, C.flammeC);
    // animation : la flamme danse, les braises montent et repartent du feu
    p(x, y - 3, C.flammeM); p(T % 2 ? x + 1 : x - 1, y - 3, C.flammeS); p(x + [0, 1, 0, -1][T % 4], y - 4, C.flammeS);
    for (const [dx, h] of [[1, 6], [-2, 8], [2, 10]]) p(x + dx, y - Math.round(5 + ((h - 5 + T * 0.75) % 6)), C.braise);
  }
  // Reflet d'une lumière dans l'eau : petits traits sous la source.
  function reflet(x, y0, y1) {
    for (let y = y0; y < y1; y += 2) r(x - ((y >> 1) & 1), y, 2, 1, C.braise);
  }

  // ---------- Un paysage par milieu ----------
  const PAYSAGES = {
    // Maison, haie, pommier et mangeoire sur une pelouse fleurie.
    jardins() {
      ciel(16); nuage(26, 3, 9);
      // haie du fond
      for (let x = 0; x < L; x++) { const h = 5 + ((x * 5) % 3 === 0 ? 1 : 0) + (x % 7 === 3 ? 1 : 0); r(x, 17 - h, 1, h, x % 3 ? C.sapinM : C.sapinS); if (x % 4 === 1) p(x, 17 - h, C.sapinC); }
      // maison
      r(3, 9, 13, 8, C.mur); r(13, 9, 3, 8, C.murOmbre);
      for (let j = 0; j < 5; j++) { r(2 + 4 - j, 4 + j, 7 + j * 2, 1, C.tuile); p(2 + 4 - j + 6 + j * 2, 4 + j, C.tuileOmbre); }
      r(1, 9, 17, 1, C.tuileOmbre);
      r(13, 3, 2, 3, C.murOmbre); r(13, 3, 2, 1, C.tuileOmbre);
      r(5, 11, 3, 3, C.vitre); p(5, 11, C.eauClair); r(10, 12, 3, 5, C.tronc); p(12, 14, C.lumiere);
      // pelouse
      herbes(17, H, C.prairie, C.herbeC); r(0, 17, L, 1, C.prairieOmbre);
      // pommier
      r(36, 12, 2, 7, C.tronc); p(37, 12, C.troncOmbre); r(37, 13, 1, 6, C.troncOmbre); p(35, 18, C.tronc); p(38, 18, C.troncOmbre);
      boule(37, 8, 5, C.herbe, "#5F9438", C.herbeC);
      p(34, 9, C.rouge); p(38, 6, C.rouge); p(40, 10, C.rouge); p(36, 11, C.rouge);
      // mangeoire
      r(25, 11, 1, 10, C.tronc); r(22, 13, 7, 1, C.troncClair); r(22, 14, 7, 1, C.troncOmbre);
      for (let j = 0; j < 3; j++) r(23 + 2 - j - 1, 8 + j, 3 + j * 2, 1, j === 2 ? C.tuileOmbre : C.tuile);
      r(23, 11, 1, 2, C.troncOmbre); r(27, 11, 1, 2, C.troncOmbre);
      // un visiteur ; animation : il sautille le long du plateau
      const vx = 24 + [0, 0, 1, 1, 1, 1, 0, 0][T % 8], vy = 12 + [0, -1, 0, 0, -1, 0, -1, 0][T % 8];
      p(vx, vy, C.encre); p(vx + 1, vy, C.rouge);
      // fleurs
      fleur(4, 21, C.rouge); fleur(8, 23, C.lumiere); fleur(15, 20, C.rose); fleur(19, 23, C.rouge);
      fleur(30, 22, C.lumiere); fleur(33, 20, C.rose); fleur(41, 22, C.lumiere); fleur(12, 22, "#FFFFFF");
      if (M.allume) {
        // fenêtre éclairée, lumière qui déborde sur la pelouse, lanterne à la mangeoire
        r(5, 11, 3, 3, C.lumiere); p(6, 12, C.flammeC); lueur(6, 12, 5);
        r(4, 18, 5, 1, LUEUR); r(5, 19, 3, 1, LUEUR);
        p(28, 15, C.troncOmbre); p(28, 16, C.flammeC); p(28, 17, C.flammeM); lueur(28, 16, 5);
      }
    },

    // Toits d'ardoise, cheminées, fenêtres éclairées et réverbère.
    villes() {
      ciel(20); nuage(4, 2, 8);
      // immeubles lointains
      const loin = [[0, 9, 6], [6, 6, 5], [11, 10, 7], [18, 5, 4], [22, 8, 8], [30, 4, 5], [35, 9, 9]];
      for (const [x, y, l] of loin) { r(x, y, l, 20 - y, "#8FA8BE"); r(x + l - 1, y, 1, 20 - y, "#7892AA"); for (let yy = y + 2; yy < 18; yy += 3) for (let xx = x + 1; xx < x + l - 1; xx += 2) p(xx, yy, "#B9CCDB"); }
      p(32, 2, "#7892AA"); p(32, 3, "#7892AA"); // antenne
      // immeubles du premier plan
      const batiment = (x, y, l, mur, ombre) => {
        r(x, y + 3, l, 22 - y - 3, mur); r(x + l - 2, y + 3, 2, 22 - y - 3, ombre);
        r(x, y, l, 3, C.ardoise); r(x + 1, y - 1, l - 2, 1, C.ardoise); r(x, y + 2, l, 1, C.ardoiseOmbre);
        r(x + 2, y - 3, 2, 3, C.tuile); p(x + 3, y - 3, C.tuileOmbre);
        for (let yy = y + 5; yy < 20; yy += 4) for (let xx = x + 2; xx < x + l - 3; xx += 4) {
          const eclairee = M.allume ? (xx + yy * 2) % 3 !== 0 : (xx * 3 + yy) % 5 === 0;
          r(xx, yy, 2, 2, eclairee ? C.lumiere : C.vitre);
        }
        for (let xx = x + 2; xx < x + l - 2; xx += 4) p(xx, y + 1, C.eauClair); // lucarnes
      };
      batiment(1, 8, 14, C.mur, C.murOmbre);
      batiment(15, 11, 12, "#E0C9A8", "#C2A983");
      batiment(27, 7, 16, C.mur, C.murOmbre);
      r(19, 18, 3, 4, C.troncOmbre); // porte
      // animation : deux bouffées de fumée montent des cheminées et se dissipent
      for (const [cx, haut, retard] of [[17, 8, 0], [3, 5, 2]]) {
        const age = T % 8 - retard;
        if (age < 1 || age > 5) continue;
        const fx = cx + Math.round(age * 0.5), fy = haut - 1 - age;
        for (let j = 0; j < (age > 2 ? 2 : 1); j++) for (let i = 0; i < (age > 1 ? 2 : 1); i++)
          if (fy + j >= 0 && bay(fx + i, fy + j) >= (age - 3) * 5) p(fx + i, fy + j, C.fumee);
      }
      // rue
      r(0, 22, L, 1, C.rocheClair); r(0, 23, L, 3, C.rocheOmbre);
      for (let x = 2; x < L; x += 7) r(x, 24, 3, 1, C.rocheClair);
      // réverbère
      r(9, 13, 1, 10, C.encre); r(8, 12, 3, 1, C.encre); r(8, 13, 3, 2, C.lumiere); p(9, 11, C.encre);
      // arbre d'alignement
      r(35, 17, 1, 6, C.tronc); boule(35, 15, 3, C.herbe, "#5F9438", C.herbeC);
      if (M.allume) {
        // halo du réverbère, flaque de lumière sur le trottoir, porte éclairée
        r(8, 13, 3, 2, C.flammeC); lueur(9, 14, 6);
        r(5, 22, 9, 1, LUEUR); r(7, 23, 5, 1, LUEUR);
        r(20, 18, 1, 1, C.lumiere); lueur(20, 19, 3);
      }
    },

    // Sous-bois : sapins serrés, un feuillu d'automne, fougères et champignon.
    "forêts"() {
      ciel(9);
      r(0, 7, L, 13, C.sapinS);
      for (let x = -2; x < L + 4; x += 5) sapin(x, 13, 12 + (x % 3), ["#16352A", C.sapinS, "#28523C"]);
      r(0, 13, L, 8, "#16352A");
      sapin(13, 21, 17); sapin(22, 22, 13); sapin(31, 21, 19); sapin(39, 22, 14); sapin(43, 21, 10);
      // sol du sous-bois
      herbes(20, H, C.herbe, C.prairieOmbre, 5); r(0, 20, L, 1, C.sapinS);
      for (let x = 0; x < L; x++) if ((x * 5) % 7 < 2) p(x, 20, C.herbe);
      // grand feuillu au premier plan
      r(4, 8, 4, 16, C.tronc); r(6, 8, 2, 16, C.troncOmbre); p(4, 10, C.troncClair); p(4, 14, C.troncClair); p(5, 18, C.troncClair);
      r(3, 23, 1, 1, C.tronc); r(8, 23, 2, 1, C.troncOmbre); r(2, 24, 2, 1, C.tronc);
      r(8, 11, 3, 1, C.troncOmbre); p(11, 10, C.troncOmbre);
      boule(6, 4, 6, C.feuilleC, C.feuilleA, C.feuilleB); boule(12, 7, 3, C.feuilleC, C.feuilleA, C.feuilleB); boule(0, 8, 3, C.feuilleC, C.feuilleA, C.feuilleB);
      p(5, 15, C.encre); p(5, 16, C.encre); // loge de pic
      // fougères, champignon, feuilles mortes
      for (const x of [16, 27, 36]) { p(x, 22, C.herbeC); p(x - 1, 23, C.herbeC); p(x + 1, 23, C.herbeC); p(x - 2, 24, C.herbeC); p(x, 24, C.herbeC); p(x + 2, 24, C.herbeC); }
      r(20, 23, 3, 1, C.rouge); p(21, 22, C.rouge); p(21, 24, C.papier); p(20, 23, "#FFFFFF");
      p(11, 24, C.feuilleA); p(24, 22, C.feuilleB); p(33, 24, C.feuilleA); p(41, 23, C.feuilleB);
      // animation : une feuille se détache du feuillu, tombe en zigzag et se
      // pose là où elle est au repos (14, 22)
      if (T === 0 || T >= 8) p(14, 22, C.feuilleB);   // en boucle : elle reste posée une seconde
      else p([13, 12, 13, 14, 13, 14, 14][T - 1], [10, 12, 14, 16, 18, 20, 21][T - 1], T % 2 ? C.feuilleA : C.feuilleB);
      if (M.allume) feu(30, 23);   // feu de camp dans la clairière
    },

    // Bocage : champs en bandes, haie, arbre isolé, botte de paille, clôture.
    campagnes() {
      ciel(12); nuage(4, 3, 10); nuage(19, 1, 7);
      // colline et village au loin
      for (let x = 0; x < L; x++) { const h = Math.round(2.5 + Math.sin(x / 7) * 1.6 + Math.sin(x / 3 + 1) * 0.6); r(x, 12 - h, 1, h, C.colline); }
      r(30, 8, 2, 2, C.mur); p(30, 7, C.tuile); p(31, 7, C.tuile); r(33, 6, 1, 4, C.mur); p(33, 5, C.ardoise); // clocher
      // champs
      r(0, 12, L, 3, C.prairie); r(0, 12, L, 1, C.prairieOmbre);
      r(0, 15, L, 4, C.ble); for (let x = 0; x < L; x++) for (let y = 15; y < 19; y++) if ((x + y * 2) % 4 === 0) p(x, y, C.bleOmbre);
      r(0, 15, 17, 4, C.terre); for (let x = 0; x < 17; x++) for (let y = 15; y < 19; y++) if ((x + y) % 3 === 0) p(x, y, C.terreOmbre);
      for (let y = 15; y < 19; y++) r(17 - (y - 15), y, 1, 1, C.prairieOmbre);
      // haie et arbre
      for (let x = 0; x < L; x++) if (x < 20 || x > 27) { const h = 2 + (x % 5 === 2 ? 1 : 0); r(x, 15 - h, 1, h, x % 3 ? C.sapinM : C.herbe); }
      r(9, 9, 2, 6, C.tronc); p(10, 10, C.troncOmbre); boule(9, 6, 4, C.herbe, "#5F9438", C.herbeC);
      // pré du premier plan et clôture
      herbes(19, H, C.prairie, C.herbeC, 1); r(0, 19, L, 1, C.prairieOmbre);
      for (let x = 3; x < L; x += 9) { r(x, 17, 2, 7, C.tronc); r(x + 1, 17, 1, 7, C.troncOmbre); p(x, 17, C.troncClair); }
      r(0, 19, L, 1, C.troncClair); r(0, 21, L, 1, C.tronc);
      for (let x = 3; x < L; x += 9) { r(x, 19, 2, 1, C.tronc); r(x, 21, 2, 1, C.troncOmbre); }
      fleur(8, 23, C.rouge); fleur(17, 22, "#FFFFFF"); fleur(26, 23, C.rouge); fleur(36, 22, C.lumiere); fleur(41, 24, C.rouge);
      // animation : trois oiseaux s'envolent de l'arbre et traversent le ciel en petite troupe
      if (T > 0) for (const [dx, y, d] of [[0, 5, 0], [-4, 4, 1], [-7, 6, 0]]) {
        const bx = 12 + dx + Math.round(T * 3.4);
        if (bx > 0 && bx < L - 1) enVol(bx, y - (T > 3 ? 1 : 0), silhouetteVol(), d);
      }
      if (M.allume) {
        // fenêtres du village au loin, lanterne accrochée à la clôture
        p(30, 9, C.lumiere); p(33, 8, C.lumiere); lueur(31, 8, 3);
        p(22, 16, C.troncOmbre); p(22, 17, C.flammeC); p(22, 18, C.flammeM); lueur(22, 17, 6);
      }
    },

    // Étang : roselière, massettes, nénuphars et reflets.
    "zones humides"() {
      ciel(11); nuage(27, 2, 9);
      // rive opposée
      for (let x = 0; x < L; x++) { const h = 3 + ((x * 3) % 5 === 0 ? 1 : 0) + (x > 30 ? 1 : 0); r(x, 12 - h, 1, h, x % 2 ? C.loin : C.colline); }
      for (let x = 1; x < L; x += 2) p(x, 11, C.roseau);
      // eau et reflets
      r(0, 12, L, 14, C.eau); r(0, 12, L, 2, C.eauSombre);
      for (let y = 14; y < H; y++) for (let x = 0; x < L; x++) {
        if ((x + y * 5 + ONDE[T % 8]) % 9 < 3 && y % 2 === 0) p(x, y, C.eauClair);   // animation : les reflets glissent
        else if ((x * 3 + y * 7) % 13 === 0) p(x, y, C.eauSombre);
      }
      // nénuphars
      const nenuphar = (x, y, fleuri) => { r(x, y, 4, 1, C.herbeC); r(x + 1, y + 1, 3, 1, C.prairieOmbre); p(x + 2, y, C.eau); if (fleuri) { p(x + 1, y - 1, C.rose); p(x + 2, y - 1, "#FFFFFF"); } };
      nenuphar(17, 17, true); nenuphar(24, 21, false); nenuphar(13, 23, true); nenuphar(28, 16, false);
      // roselières du premier plan
      const tige = (x, haut, epi) => {
        r(x, haut, 1, H - haut, x % 2 ? C.roseau : C.herbe);
        // animation : un souffle de vent couche un instant les massettes
        const plie = [0, 0, 1, 1, 1, 0, 0, 0][T % 8];
        if (epi) { r(x + plie, haut - 3, 1, 3, C.massette); p(x + plie, haut - 4, C.roseau); }
        else { p(x - 1, haut, C.herbeC); p(x + 1, haut + 2, C.herbeC); }
      };
      [[1, 9, 1], [2, 13, 0], [3, 6, 1], [4, 11, 0], [5, 14, 0], [6, 9, 1], [7, 15, 0], [8, 12, 1], [10, 17, 0],
       [33, 16, 0], [34, 11, 1], [36, 14, 0], [37, 7, 1], [38, 12, 0], [39, 15, 0], [40, 9, 1], [41, 13, 0], [42, 6, 1], [43, 11, 0]]
        .forEach(([x, haut, epi]) => tige(x, haut, epi));
      r(0, 24, 10, 2, C.herbe); r(33, 24, 11, 2, C.herbe);
      if (M.allume) {
        // affût éclairé sur l'autre rive, et son reflet dans l'eau
        r(20, 8, 5, 4, C.troncOmbre); r(19, 7, 7, 1, C.tronc); r(22, 9, 2, 2, C.lumiere);
        lueur(23, 10, 4); reflet(23, 13, 20);
      }
    },

    // Bord de mer : falaise de craie, phare, plage, vagues et rochers.
    littoral() {
      ciel(13); nuage(20, 2, 10);
      // mer
      r(0, 12, L, 14, C.eau); r(0, 12, L, 1, C.eauClair); r(0, 13, L, 2, C.eauSombre);
      // animation : les reflets glissent, la vague monte sur le sable
      const vague = [0, 0, 1, 2, 2, 1, 0, 0][T % 8];
      for (let y = 15; y < H; y++) for (let x = 0; x < L; x++) if ((x + y * 4 + ONDE[T % 8]) % 10 < 3 && y % 2) p(x, y, C.eauClair);
      // falaise
      for (let y = 8; y < H; y++) {
        const l = 13 - Math.round((y - 8) * 0.12) + (y % 4 === 0 ? 1 : 0);
        r(0, y, l, 1, C.craie); r(l - 3, y, 3, 1, C.craieOmbre);
        if (y % 3 === 0) r(1, y, l - 5, 1, C.craieOmbre);
      }
      r(0, 7, 14, 2, C.prairie); r(0, 7, 14, 1, C.herbeC); p(13, 8, C.prairieOmbre);
      // phare
      r(4, 2, 3, 5, "#FFFFFF"); r(4, 3, 3, 1, C.rouge); r(4, 5, 3, 1, C.rouge); r(6, 2, 1, 5, C.craieOmbre); p(6, 3, C.tuileOmbre); p(6, 5, C.tuileOmbre);
      r(3, 2, 5, 1, C.encre); r(4, 1, 3, 1, C.lumiere); p(5, 0, C.encre);
      // plage
      for (let y = 18; y < H; y++) {
        const l = 12 + (y - 18) * 4 + Math.round(Math.sin(y) * 1.5) - vague;
        r(0, y, l, 1, C.sable); r(l, y, 2, 1, "#FFFFFF"); p(l + 2, y, C.eauClair);
        for (let x = 0; x < l; x++) if ((x * 5 + y * 3) % 11 === 0) p(x, y, C.sableOmbre);
      }
      // rochers et galets
      r(20, 16, 4, 2, C.rocheOmbre); r(20, 15, 3, 1, C.roche); p(20, 15, C.rocheClair); r(19, 18, 6, 1, "#FFFFFF");
      p(6, 22, C.roche); p(15, 24, C.rocheOmbre); p(10, 20, C.roche); p(24, 25, C.roche);
      // oyat
      for (const x of [2, 4, 7]) { p(x, 19, C.roseau); p(x, 18, C.roseau); p(x + 1, 17, C.roseau); }
      if (M.allume) {
        // faisceau du phare (trame qui s'élargit)
        r(4, 1, 3, 1, C.flammeC); lueur(5, 1, 3);
        for (let x = 8; x < 30; x++) { const e = Math.floor((x - 8) / 8); for (let y = 1 - e; y <= 1 + e; y++) if (y >= 0 && bay(x, y) > 1 + (x - 8) * 0.55 + Math.abs(y - 1) * 3) p(x, y, FAISCEAU); }
      }
    },

    // Sommets enneigés, sapins d'altitude, alpage et éboulis.
    montagnes() {
      ciel(18); nuage(2, 4, 8);
      mont(8, 6, 19, 1.0, "#A9C0D4", "#8DA8C0", 3);
      mont(36, 4, 19, 0.9, "#A9C0D4", "#8DA8C0", 4);
      mont(22, 1, 20, 1.15, C.mont, C.montOmbre, 6);
      // animation : un rapace sort de derrière le grand sommet et traverse le ciel
      if (T > 0) enVol(25 + Math.round(T * 2.8), 3, silhouetteVol());
      // forêt d'altitude
      r(0, 17, L, 5, C.sapinS);
      for (let x = 1; x < L; x += 4) sapin(x, 19, 6 + (x % 3), ["#16352A", C.sapinS, C.sapinM]);
      // alpage
      for (let x = 0; x < L; x++) { const h = 6 + Math.round(Math.sin(x / 6 + 2) * 1.4); r(x, H - h, 1, h, C.prairie); p(x, H - h, C.prairieOmbre); }
      for (let y = 21; y < H; y++) for (let x = 0; x < L; x++) if ((x * 7 + y * 13) % 11 === 0) p(x, y, C.prairieOmbre);
      sapin(5, 24, 11); sapin(39, 23, 9);
      // rochers
      r(24, 21, 5, 3, C.roche); r(25, 20, 3, 1, C.rocheClair); r(27, 21, 2, 3, C.rocheOmbre); p(24, 21, C.rocheClair);
      r(14, 23, 3, 2, C.roche); p(16, 24, C.rocheOmbre); p(14, 23, C.rocheClair);
      fleur(19, 22, "#4A78D8"); fleur(32, 23, "#FFFFFF"); fleur(10, 24, "#4A78D8"); fleur(35, 21, C.rose);
      if (M.allume) feu(19, 23);   // feu de bivouac sur l'alpage
    },
  };

  // Oiseau en vol vu de loin (3 pixels), ailes levées une image sur deux.
  function enVol(bx, y, c, decale = 0) {
    const aile = (T + decale) % 2 ? -1 : 0;
    p(bx - 1, y + aile, c); p(bx, y, c); p(bx + 1, y + aile, c);
  }
  const silhouetteVol = () => moment === "nuit" ? "rgba(196, 205, 232, 1)" : "rgba(26, 22, 34, 1)";

  // Milieu absent de la liste : une simple prairie, pour ne jamais rien casser.
  function prairie() {
    ciel(15); nuage(8, 4, 10);
    for (let x = 0; x < L; x++) { const h = 3 + Math.round(Math.sin(x / 6) * 1.5); r(x, 15 - h, 1, h, C.colline); }
    herbes(15, H, C.prairie, C.herbeC); r(0, 15, L, 1, C.prairieOmbre);
    fleur(9, 20, C.rouge); fleur(21, 22, C.lumiere); fleur(33, 19, "#FFFFFF");
  }

  // ---------- Taille : trois oiseaux posés côte à côte ----------
  // Un seul cadre (44 × 26, comme le milieu) : un passereau, un limicole et
  // un goéland de profil, posés sur le même sol. Celui du gabarit de l'oiseau
  // du jour est foncé, les deux autres sont grisés. Seuils sur l'envergure.
  const GABARITS = [
    { cle: "petit", libelle: "Petit", max: 40 },       // passereaux, jusqu'à l'étourneau
    { cle: "moyen", libelle: "Moyen", max: 85 },       // pigeons, pies, crécerelle, vanneau
    { cle: "grand", libelle: "Grand", max: Infinity }, // corneille, buse, goéland, héron
  ];
  // Taille de référence : envergure, sinon longueur × 1,6 (rapport moyen).
  function gabarit(cm, longueur) {
    const e = Number(cm) > 0 ? Number(cm) : Number(longueur) > 0 ? Number(longueur) * 1.6 : 0;
    if (!e) return -1;
    return GABARITS.findIndex(g => e < g.max);
  }

  function sprite(x, y, lignes, couleurs) {
    lignes.forEach((ligne, j) => [...ligne].forEach((ch, i) => { if (couleurs[ch]) p(x + i, y + j, couleurs[ch]); }));
  }

  const POSES = [
    // Petit : moineau, queue relevée, bec court.
    [
      ".....xx..",
      "....xxxxx",
      "x..xxxxx.",
      ".xxxxxxx.",
      "..xxxxx..",
      "...x.x...",
    ],
    // Moyen : limicole, long bec, longues pattes.
    [
      ".......xx...",
      "......xxxxxx",
      "......xxx...",
      "x..xxxxxx...",
      ".xxxxxxxx...",
      "..xxxxxx....",
      "....x.x.....",
      "....x.x.....",
      "....x.x.....",
      "...xx.xx....",
    ],
    // Grand : goéland, tête ronde, bec fort, ailes longues croisées sur la queue.
    [
      ".........xxx...",
      "........xxxxx..",
      "........xxxxxxx",
      "........xxxx...",
      ".......xxxxx...",
      "....xxxxxxxx...",
      ".xxxxxxxxxxx...",
      "xxxxxxxxxxxx...",
      ".xxxxxxxxxxx...",
      "..xxxxxxxxx....",
      "....xxxxxx.....",
      "......x.x......",
      "......x.x......",
      ".....xx.xx.....",
    ],
  ];

  function oiseauxPoses(i) {
    // Oiseau choisi et oiseaux grisés, selon le ciel du moment. Les couleurs
    // sont en rgba pour ne pas recevoir le voile du moment.
    //   aube, jour : choisi foncé, grisés en ombre légère ;
    //   soir : choisi gris très clair (comme la nuit), grisés en gris foncé :
    //   des gris neutres, qui se détachent de l'orangé du ciel ;
    //   nuit : choisi gris clair de lune (jamais blanc pur), grisés du même
    //   gris en plus transparent : visibles sur le ciel, mais en retrait.
    const TONS = {
      soir: ["rgba(26, 22, 34, 1)", "rgba(74, 66, 84, 0.8)"],
      nuit: ["rgba(196, 205, 232, 1)", "rgba(196, 205, 232, 0.4)"],
    };
    const [choisi, grise] = TONS[moment] || [JOUR.encre, "rgba(43, 30, 20, 0.28)"];
    ciel(23, 8); nuage(27, 3, 9);   // étoiles seulement au-dessus des oiseaux
    // sol
    r(0, 23, L, 3, C.prairie); r(0, 23, L, 1, C.prairieOmbre);
    for (let x = 0; x < L; x++) if ((x * 7) % 5 === 0) p(x, 22, C.herbe);
    let x0 = 2;
    POSES.forEach((vue, k) => {
      // animation : l'oiseau choisi fait un petit saut puis se repose
      const saut = k === i ? [0, -1, -2, -2, -1, 0, -1, 0][T % 8] : 0;
      sprite(x0, 23 - vue.length + saut, vue, { x: k === i ? choisi : grise });
      x0 += vue[0].length + 2;
    });
  }

  // ---------- Rendu ----------
  const cache = new Map();
  function image(cle, m, dessiner, t = 0) {
    if (cache.has(cle)) return cache.get(cle);
    T = t;
    const canevas = document.createElement("canvas");
    canevas.width = L; canevas.height = H;
    ctx = canevas.getContext("2d");
    preparer(m);
    dessiner();
    const url = canevas.toDataURL("image/png");
    cache.set(cle, url);
    return url;
  }

  // Taille d'un pixel à l'écran : la même que celle du décor animé
  // (js/decor.js, ECHELLE = 2 à 4 px selon la hauteur de la fenêtre). On la lit
  // sur le canevas du décor et on la passe au CSS dans --pixel.
  function suivreEchelleDecor() {
    const decor = document.getElementById("decor");
    const lire = () => {
      const e = decor && decor.width ? Math.round(decor.getBoundingClientRect().width / decor.width)
        : Math.max(2, Math.round(innerHeight / 290));
      document.documentElement.style.setProperty("--pixel", Math.max(1, e) + "px");
    };
    lire();
    // le décor se redimensionne 150 ms après la fin du redimensionnement
    let minuterie = 0;
    addEventListener("resize", () => { clearTimeout(minuterie); minuterie = setTimeout(lire, 250); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", suivreEchelleDecor);
  else suivreEchelleDecor();

  // Moment affiché : celui du décor animé (data-moment posé par js/decor.js).
  const momentDecor = () => document.documentElement.dataset.moment || "jour";

  // Adresse de l'image d'un picto, pour le moment donné (celui du décor par défaut).
  //   src("milieu", "forêts")    src("taille", 36, null)
  // t : numéro de l'image de l'animation (0 = repos).
  function src(type, a, b, m = momentDecor(), t = 0) {
    if (type === "milieu") {
      const cle = String(a || "").trim().toLowerCase();
      return image(`${m}:milieu:${cle}:${t}`, m, (Object.prototype.hasOwnProperty.call(PAYSAGES, cle) ? PAYSAGES[cle] : prairie), t);
    }
    const i = gabarit(a, b);
    return image(`${m}:taille:${i}:${t}`, m, () => oiseauxPoses(i), t);
  }

  // Animation d'une vignette. Une fois (images 1 à 7, puis repos) pour la
  // taille et au toucher ; en boucle pour un paysage tant que la souris est
  // dessus (img.dataset.survol). Dès que la souris quitte la vignette,
  // l'animation s'arrête et l'image revient tout de suite au repos.
  const reduit = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const minuteries = new WeakMap();
  function arreter(img) {
    clearTimeout(minuteries.get(img));
    if (!img.dataset.anime) return;
    delete img.dataset.anime;
    img.src = src(img.dataset.picto, img.dataset.a, img.dataset.b);
  }
  function animer(img) {
    if (!img || img.dataset.anime || reduit.matches) return;
    img.dataset.anime = "1";
    let t = 1;
    const pas = () => {
      const d = img.dataset;
      if (!img.isConnected) { delete d.anime; return; }
      const boucle = d.picto === "milieu" && d.survol;
      if (t % IMAGES === 0 && !boucle) { arreter(img); return; }
      img.src = src(d.picto, d.a, d.b, momentDecor(), t % CYCLE);
      t++;
      minuteries.set(img, setTimeout(pas, DUREE_IMAGE));
    };
    pas();
  }
  // Déclenchement : à la souris, seulement quand le pointeur entre sur l'image
  // ou son cadre noir (la bordure de .picto) ; au doigt, un toucher n'importe
  // où sur la vignette (image ou texte) suffit.
  const zoneDe = (cible, doigt) => cible && cible.closest &&
    cible.closest(doigt ? ".indice-picto, img[data-picto]" : "img[data-picto]");
  const imageDe = zone => zone.matches("img") ? zone : zone.querySelector("img[data-picto]");
  let dernierToucher = 0;
  function surVignette(e) {
    const zone = zoneDe(e.target, e.type === "touchstart");
    if (!zone || (e.relatedTarget && zone.contains(e.relatedTarget))) return;
    const img = imageDe(zone);
    // au doigt, le navigateur simule ensuite un survol : on l'ignore
    if (e.type === "touchstart") dernierToucher = Date.now();
    else if (img && Date.now() - dernierToucher > 1000) img.dataset.survol = "1";
    animer(img);
  }
  function horsVignette(e) {
    const zone = zoneDe(e.target, false);
    if (!zone || (e.relatedTarget && zone.contains(e.relatedTarget))) return;
    const img = imageDe(zone);
    if (!img || !img.dataset.survol) return;   // une animation lancée au doigt va au bout
    delete img.dataset.survol;
    arreter(img);
  }
  document.addEventListener("mouseover", surVignette);
  document.addEventListener("mouseout", horsVignette);
  document.addEventListener("touchstart", surVignette, { passive: true });

  // Quand le décor change de moment (il vérifie l'heure chaque minute), on
  // redessine les pictos affichés : <img data-picto="milieu" data-a="forêts">.
  function rafraichir() {
    document.querySelectorAll("img[data-picto]").forEach(img => {
      const d = img.dataset, nouveau = src(d.picto, d.a, d.b);
      if (img.getAttribute("src") !== nouveau) img.src = nouveau;
    });
  }
  new MutationObserver(rafraichir).observe(document.documentElement, { attributes: true, attributeFilter: ["data-moment"] });

  window.PiaflePictos = {
    LARGEUR: L, HAUTEUR: H,
    MILIEUX: Object.keys(PAYSAGES),
    MOMENTS: Object.keys(MOMENTS),
    GABARITS: GABARITS.map(g => ({ cle: g.cle, libelle: g.libelle })),
    gabarit,
    src,
    IMAGES, CYCLE, DUREE_IMAGE,
    animer,
    // Balise <img> d'un picto, qui suit ensuite les changements de moment.
    html(type, a, b, classe = "picto") {
      const attr = v => (v == null ? "" : String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;"));
      return `<img class="${classe}" src="${src(type, a, b)}" data-picto="${type}" data-a="${attr(a)}" data-b="${attr(b)}" alt="">`;
    },
  };
})();
