// Cadres de la zone de jeu, du bandeau et de l'historique : cadre fin,
// branche d'automne sous la partie avec une mésange charbonnière, lierre,
// herbe, mousse et fougères.
// Peints pixel par pixel sur deux canevas plein écran (devant et derrière la
// partie), sur la grille du décor : même échelle, même origine et mêmes
// couleurs que le moment courant (data-moment).
// window.piafleBranche est mis à null : js/decor.js n'utilise pas la branche
// comme perchoir.
(() => {
  const racine = document.documentElement;

  // Couleurs reprises des palettes de js/decor.js.
  const PAL = {
    jour: { tronc: "#6B4A2E", troncOmbre: "#4A3220", troncClair: "#8A6440", bois: "#7A5634", boisOmbre: "#55391F",
      herbe: "#4F7A2C", herbeC: "#9CC85A", prairie: "#86B04A", sapinC: "#4E8A50", sapinM: "#2F6145",
      feuilleA: "#D9762B", feuilleB: "#EDB43C", feuilleC: "#9C4A22", roche: "#8E9196", rocheClair: "#B4B7BA", rocheOmbre: "#666B72",
      astre: "#FFF2B0", ciel: "#A2D2EA", teinte: null, force: 0, ombre: "#1B2633" },
    aube: { tronc: "#5C4030", troncOmbre: "#3D2A20", troncClair: "#7A5A42", bois: "#6A4A30", boisOmbre: "#4A321F",
      herbe: "#43632F", herbeC: "#8EAA58", prairie: "#76944A", sapinC: "#41704F", sapinM: "#2C5246",
      feuilleA: "#C76A33", feuilleB: "#DDA04A", feuilleC: "#8A4228", roche: "#857F8E", rocheClair: "#AAA2AE", rocheOmbre: "#615C6C",
      astre: "#FFE0A0", ciel: "#E39A8C", teinte: "#8E73A6", force: 0.22, ombre: "#2A2340" },
    soir: { tronc: "#4E3528", troncOmbre: "#33231B", troncClair: "#6A4A36", bois: "#5A3E2A", boisOmbre: "#3D2A1C",
      herbe: "#384F28", herbeC: "#7E9A4C", prairie: "#66803F", sapinC: "#335A46", sapinM: "#223F38",
      feuilleA: "#B85A2E", feuilleB: "#CF8E3E", feuilleC: "#7A3824", roche: "#6E6478", rocheClair: "#958A9A", rocheOmbre: "#4F4858",
      astre: "#FFC46B", ciel: "#D66E5E", teinte: "#7B4F8E", force: 0.32, ombre: "#1E1830" },
    nuit: { tronc: "#40384E", troncOmbre: "#251F35", troncClair: "#656784", bois: "#4E3B42", boisOmbre: "#2F252F",
      herbe: "#193249", herbeC: "#406A7C", prairie: "#2D5068", sapinC: "#274D66", sapinM: "#132A46",
      feuilleA: "#5A4566", feuilleB: "#7C637B", feuilleC: "#3A2D4C", roche: "#4A5475", rocheClair: "#6E799A", rocheOmbre: "#323A59",
      astre: "#C9D2EC", ciel: "#354F85", teinte: "#1D2F72", force: 0.5, ombre: "#060914" },
  };
  // Position des astres et du feu dans le décor (fractions de l'écran), cf. js/decor.js.
  const ASTRE = { jour: [0.78, 0.14], aube: [0.74, 0.42], soir: [0.27, 0.42], nuit: [0.8, 0.15] };
  const FEU = [0.705, 0.9];

  // ---------- Outils (mêmes que le décor) ----------
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bay = (x, y) => BAYER[((y % 4) + 4) % 4][((x % 4) + 4) % 4];
  function melange(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const m = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return "#" + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
  }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  // ---------- Canevas ----------
  const mk = cls => { const c = document.createElement("canvas"); c.className = cls; c.setAttribute("aria-hidden", "true"); return c; };
  const avant = mk("cadres-avant"), arriere = mk("cadres-arriere");
  document.body.prepend(arriere);
  document.getElementById("decor").after(arriere);
  document.body.append(avant);
  const ca = avant.getContext("2d"), cr = arriere.getContext("2d");

  let E = 3, W = 0, H = 0, P = PAL.jour, moment = "jour", t = 0;
  let c = ca; // canevas courant
  // Les couleurs de palette sont déjà celles du moment ; seules les couleurs
  // fixes (fer, corde, oiseau, bois scié) reçoivent la teinte, comme les sprites du décor.
  const T = col => (!P.teinte || Object.values(P).includes(col) ? col : melange(col, P.teinte, P.force));
  const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const pt = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };

  // Épaisseur des cadres, en pixels du décor : dedans (sur la bordure de la
  // partie) et dehors.
  const dedans = 1, dehors = 1;

  function dimensionner() {
    E = Math.max(2, Math.round(innerHeight / 290));
    W = Math.ceil(innerWidth / E); H = Math.ceil(innerHeight / E);
    for (const k of [avant, arriere]) {
      k.width = W; k.height = H;
      k.style.width = W * E + "px"; k.style.height = H * E + "px";
    }
    racine.style.setProperty("--c-in", dedans * E + "px");
    racine.style.setProperty("--c-out", dehors * E + "px");
    racine.style.setProperty("--c-bas", 5 * E + "px"); // place pour la branche
  }

  // Rectangle d'un panneau, en pixels du décor (bord extérieur de sa bordure).
  function boite(el) {
    if (!el || el.hidden || getComputedStyle(el).display === "none") return null;
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { l: Math.round(r.left / E), t: Math.round(r.top / E), r: Math.round(r.right / E), b: Math.round(r.bottom / E) };
  }

  // Ombre portée : aplat translucide décalé, sur le canevas arrière.
  function ombre(b, dx, dy, densite = 8) {
    c = cr;
    c.globalAlpha = densite / 16;
    px(b.l + dx, b.t + dy, b.r - b.l, b.b - b.t, P.ombre);
    c.globalAlpha = 1;
    c = ca;
  }

  // ===================== Cadre fin, branche et mésange =====================
  // Cadre aux angles arrondis, branche d'automne sous la partie et brin de
  // lierre dans l'angle en haut à gauche. Rien n'est peint dans la zone de
  // lecture.
  // Sprite de la mésange charbonnière : deux images d'animation et une pose
  // endormie (inutilisée tant que la mésange est absente la nuit).
  const CHARBO = {
    couleurs: { k: "#18181C", w: "#F2EFE6", g: "#7E8C3A", G: "#5E6E7E", W: "#DDE3E6", y: "#F2CF3A", Y: "#C9A42A", l: "#6A7A8C" },
    images: [
      ["......kkkk...", ".....kkkkkk..", ".....kkkkkkkk", "..gggkwwwwk..", ".GggggkwwkY..", "GWGgggykkyy..", "GGWGgyykyyy..", ".GGGyyykyY...", "..GG.Yyyy....", "......l.l....", ".....ll.ll..."],
      [".............", "......kkkk...", ".....kkkkkk..", ".....kkkkkkkk", "..gggkwwwwk..", "GGggggkwwkY..", "GWGgggykkyy..", ".GWGgyykyyy..", "..GGyyykyY...", "......l.l....", ".....ll.ll..."],
    ],
    dort: [".............", ".............", "......kkkk...", "..gggkkkkkk..", ".GgggkwwwwkY.", "GWGggkwwwkyy.", "GGWGgyykyyy..", ".GGGyyykyY...", "..GG.Yyyy....", "......l.l....", ".....ll.ll..."],
  };
  function sprite(lignes, cols, x, y, miroir) {
    for (let j = 0; j < lignes.length; j++) for (let i = 0; i < lignes[j].length; i++) {
      const k = lignes[j][i]; if (k === "." || !cols[k]) continue;
      pt(miroir ? x + lignes[j].length - 1 - i : x + i, y + j, T(cols[k]));
    }
  }
  function cadreFin(b, ep) {
    const o = { l: b.l - 1, t: b.t - 1, r: b.r + 1, b: b.b + 1 };
    const sombre = melange(T(P.troncOmbre), "#000000", 0.35);
    // trait extérieur sombre, angles arrondis d'un pixel
    px(o.l + 1, o.t, o.r - o.l - 2, 1, sombre); px(o.l + 1, o.b - 1, o.r - o.l - 2, 1, sombre);
    px(o.l, o.t + 1, 1, o.b - o.t - 2, sombre); px(o.r - 1, o.t + 1, 1, o.b - o.t - 2, sombre);
    // liseré de bois clair dedans
    px(o.l + 1, o.t + 1, o.r - o.l - 2, 1, T(P.bois)); px(o.l + 1, o.b - 2, o.r - o.l - 2, 1, T(P.boisOmbre));
    px(o.l + 1, o.t + 1, 1, o.b - o.t - 2, T(P.bois)); px(o.r - 2, o.t + 1, 1, o.b - o.t - 2, T(P.boisOmbre));
    return o;
  }
  function feuille(x, y, i) {
    const cols = [T(P.feuilleA), T(P.feuilleB), T(P.feuilleC)];
    const col = cols[i % 3];
    pt(x, y, col); pt(x + 1, y, col); pt(x, y + 1, col);
    if (i % 2) pt(x + 1, y + 1, cols[(i + 1) % 3]);
  }
  function lierre(x, y, i) {
    const f = T(P.sapinC), F = T(P.sapinM), c2 = T(P.herbeC);
    pt(x + 1, y, f); pt(x, y + 1, f); pt(x + 1, y + 1, i % 3 ? c2 : f); pt(x + 2, y + 1, f); pt(x + 1, y + 2, F);
    if (i % 2) { pt(x, y, F); pt(x + 2, y, f); }
  }
  function bouquet(x, y, i) {
    for (const [dx, dy, k] of [[0, 0, 0], [2, -1, 1], [-2, -1, 2], [1, -3, 1], [-1, 2, 0], [3, 1, 2], [-3, 1, 1]]) feuille(x + dx, y + dy, i + k);
  }
  function peindreBranche(bx) {
    const { entete, partie, historique } = bx;
    for (const b of [entete, historique]) if (b) { ombre({ l: b.l - 1, t: b.t - 1, r: b.r + 1, b: b.b + 1 }, 2, 2, 6); cadreFin(b); }
    if (!partie) return;
    ombre({ l: partie.l - 1, t: partie.t - 1, r: partie.r + 1, b: partie.b + 1 }, 2, 2, 6);
    const o = cadreFin(partie);
    // Téléphone : l'historique est sous la partie, la branche n'est pas peinte.
    const sousLaPartie = historique && historique.t > partie.b;
    if (sousLaPartie) { lierreAngle(o); return; }
    // Profil de la branche : entre par la gauche, ploie un peu et remonte à
    // droite, sous la mésange. yb(x) donne le haut, ep(x) l'épaisseur.
    const x0 = o.l - 26, x1 = o.r + 28, base = o.b;
    const yb = x => {
      const f = (x - x0) / (x1 - x0);
      let y = base + 1 + Math.round(Math.sin(f * Math.PI) * 1.4);
      if (x > x1 - 16) y -= Math.round(((x - (x1 - 16)) / 16) ** 2 * 6);
      if (x < x0 + 10) y += Math.round(((x0 + 10 - x) / 10) * 2);
      return y;
    };
    const ep = x => {
      const f = (x - x0) / (x1 - x0);
      const n = Math.sin(x * 0.21) + Math.sin(x * 0.083 + 2) > 1.1 ? 1 : 0; // renflements de l'écorce
      return (f < 0.2 ? 4 : f < 0.85 ? 3 : 2) + (f < 0.85 ? n : 0);
    };
    const sombre = melange(T(P.troncOmbre), "#000000", 0.35);
    for (let x = x0; x <= x1; x++) {
      const y = yb(x) - 1, e = ep(x);
      px(x, y - 1, 1, e + 2, sombre);
    }
    for (let x = x0; x <= x1; x++) {
      const y = yb(x) - 1, e = ep(x);
      px(x, y, 1, e, T(P.tronc));
      if (hash(x, 4) > 0.12) pt(x, y, T(P.troncClair));
      pt(x, y + e - 1, T(P.troncOmbre));
      if (e > 3 && hash(x, 5) < 0.18) pt(x, y + 1 + Math.floor(hash(5, x) * 2), T(P.troncOmbre));
      if (e === 3 && hash(x, 6) < 0.08) pt(x, y + 1, T(P.troncOmbre));
    }
    // moignon de branche coupée et bout effilé
    const mx = o.l + 30, my = yb(mx) - 2;
    px(mx, my - 2, 2, 2, T(P.tronc)); pt(mx, my - 2, T(P.troncClair)); pt(mx - 1, my - 2, sombre); pt(mx + 2, my - 2, sombre); px(mx, my - 3, 2, 1, sombre);
    // brindilles et bouquets de feuilles aux deux bouts (hors de la partie)
    const brin = (x, y, dx, dy, n) => { for (let k = 0; k < n; k++) pt(x + dx * k, y + dy * k, T(P.troncOmbre)); return [x + dx * n, y + dy * n]; };
    let p = brin(o.l - 8, yb(o.l - 8) - 2, -1, -1, 5); bouquet(p[0], p[1], 0);
    p = brin(o.l - 18, yb(o.l - 18) + 4, -1, 1, 3); bouquet(p[0], p[1], 1);
    bouquet(x0 + 1, yb(x0) - 1, 2);
    p = brin(x1, yb(x1) - 2, 1, -1, 3); bouquet(p[0] + 1, p[1], 0);
    p = brin(o.r + 12, yb(o.r + 12) + 3, 1, 1, 3); bouquet(p[0], p[1] + 1, 2);
    // une feuille qui se détache de temps en temps (sauf la nuit)
    if (moment !== "nuit") {
      const cyc = (t * 0.5) % 60;
      if (cyc < 34) feuille(o.l - 22 + Math.round(Math.sin(cyc * 0.35) * 3), yb(o.l - 22) + 4 + Math.round(cyc * 0.9), 0);
    }
    // Mésange perchée à droite, absente le soir et la nuit.
    const tx = o.r + 9, ty = yb(o.r + 15) - 12;
    if (moment === "nuit" || moment === "soir") { /* pas de mésange */ }
    else {
      const cyc = Math.floor(t) % 40;
      const im = (cyc >= 12 && cyc < 15) || cyc === 26 ? 1 : 0;
      sprite(CHARBO.images[im], CHARBO.couleurs, tx, ty + (cyc === 33 ? -1 : 0), cyc >= 18 && cyc < 30);
    }
    lierreAngle(o);
  }
  // lierre qui retombe de l'angle en haut à gauche
  function lierreAngle(o) {
    const tige = T(P.herbe);
    const lx = o.l, ly = o.t;
    for (let k = 0; k < 18; k++) pt(lx + k, ly - (k % 7 === 3 ? 1 : 0), tige);
    for (let k = 0; k < 30; k++) pt(lx - (k % 8 === 4 ? 1 : 0), ly + k, tige);
    [[lx + 3, ly - 3], [lx + 8, ly - 3], [lx + 13, ly - 3], [lx + 17, ly - 2], [lx - 3, ly + 2], [lx - 3, ly + 8], [lx - 2, ly + 14], [lx - 3, ly + 20], [lx - 2, ly + 26], [lx - 1, ly + 30]].forEach(([x, y], i) => lierre(x, y, i));
  }

  // ===================== Végétation : mousse, herbes, fougères =====================
  // Motifs déterministes : hash(x, graine) fixe la forme, donc le dessin ne
  // change pas d'une image à l'autre.
  function mousse(x, y, l, graine) {
    const cols = [P.sapinM, P.herbe, P.prairie, P.herbeC];
    for (let k = 0; k < l; k++) {
      const h = hash(x + k, graine), bord = k === 0 || k === l - 1;
      pt(x + k, y, cols[bord ? 1 : 1 + Math.floor(h * 3)]);
      if (!bord && h > 0.3) pt(x + k, y - 1, cols[h > 0.8 ? 3 : 2]);
      if (!bord && h > 0.85 && k > 1 && k < l - 2) pt(x + k, y - 2, cols[2]);
      if (hash(k, graine + x) < 0.45) pt(x + k, y + 1, cols[bord ? 0 : 1]);
    }
  }
  function herbes(x, y, n, graine) {
    for (let i = 0; i < n; i++) {
      const h = 2 + Math.floor(hash(x + i * 2, graine) * 3), pente = hash(graine, i) < 0.5 ? -1 : 1;
      for (let k = 0; k < h; k++) pt(x + i * 2 + (k === h - 1 && h > 2 ? pente : 0), y - 1 - k, k === h - 1 ? P.herbeC : P.prairie);
    }
  }
  function fougere(x, y, dir) {
    // Fronde vers le haut, penchée du côté dir (-1 gauche, 1 droite).
    for (let k = 0; k < 8; k++) {
      const cx = x + dir * Math.round(k * 0.55), cy = y - k;
      pt(cx, cy, P.sapinM);
      const l = k === 0 ? 0 : Math.max(0, 3 - Math.floor(k / 3));
      for (let j = 1; j <= l; j++) {
        if (k % 2) pt(cx - j, cy + (j > 1 ? 1 : 0), j === l ? P.herbeC : P.sapinC);
        else pt(cx + j, cy + (j > 1 ? 1 : 0), j === l ? P.herbeC : P.sapinC);
      }
    }
    pt(x + dir * 4, y - 8, P.herbeC);
  }
  // ===================== Lierre fin et composition =====================
  // lierreFin(points, graine, pas, grand, cote) trace une tige le long de
  // `points` et y accroche des petites feuilles tirées de PETITES_FEUILLES, à
  // intervalles irréguliers (au moins 3 points d'écart), du côté `cote`
  // ([dx, dy], vers l'extérieur du cadre). `pas` et `grand` ne sont pas lus.
  const PETITES_FEUILLES = [["dc", "cL"], [".c", "cL", "d."], ["dcd", ".c."], ["c.", "Lc", ".d"], ["cd", "d."], [".L.", "cdc"]];
  function lierreFin(points, graine, pas, grand, cote) {
    const [cx, cy] = cote || [1, 0];
    for (const [x, y] of points) if (hash(x * 3 + graine, y) > 0.08) pt(x, y, P.herbe);
    let dernier = -9;
    points.forEach(([x, y], k) => {
      const h = hash(k + graine * 31, graine);
      if (k - dernier < 3 || h > 0.42) return;
      dernier = k;
      const m = PETITES_FEUILLES[Math.floor(hash(graine, k) * PETITES_FEUILLES.length)];
      const cols = { d: P.sapinM, c: h < 0.2 ? P.herbe : P.sapinC, L: P.herbeC };
      const ecart = 1 + Math.floor(hash(k, graine + 7) * 2);
      const ox = x + cx * ecart - (cx < 0 ? m[0].length - 1 : 0) - (cx === 0 ? Math.floor(m[0].length / 2) : 0);
      const oy = y + cy * ecart - (cy < 0 ? m.length - 1 : 0) - (cy === 0 ? Math.floor(m.length / 2) : 0);
      // un petit pétiole entre la tige et la feuille
      pt(x + cx, y + cy, P.herbe);
      for (let j = 0; j < m.length; j++) for (let i = 0; i < m[j].length; i++) if (m[j][i] !== ".") pt(ox + i, oy + j, cols[m[j][i]]);
    });
  }
  function peindreCadres(bx) {
    peindreBranche(bx);
    const { entete, partie, historique } = bx;
    window.piafleBranche = null;
    for (const [b, g] of [[entete, 11], [historique, 23]]) {
      if (!b) continue;
      const o = { l: b.l - 1, t: b.t - 1, r: b.r + 1, b: b.b + 1 };
      const pts = []; for (let k = 0; k < 10; k++) pts.push([o.r - 1, o.t + 1 + k]);
      lierreFin(pts, g, 3, true, [1, 0]);
      herbes(o.l + Math.round((o.r - o.l) * 0.3), o.t, 2, g);
    }
    if (!partie) return;
    const o = { l: partie.l - 1, t: partie.t - 1, r: partie.r + 1, b: partie.b + 1 };
    const h = o.b - o.t, w = o.r - o.l;
    const telephone = historique && historique.t > partie.b;
    let pts;
    // Lierre : angle en haut à gauche, vers le bas
    pts = []; for (let k = 0; k < Math.round(h * 0.38); k++) pts.push([o.l - (Math.floor(k / 7) % 2), o.t + 2 + k]);
    lierreFin(pts, 0, 3, true, [-1, 0]);
    // puis le long du bord du haut
    pts = []; for (let k = 0; k < Math.round(w * 0.18); k++) pts.push([o.l + 2 + k, o.t - (Math.floor(k / 7) % 2)]);
    lierreFin(pts, 1, 3, true, [0, -1]);
    // Lierre : depuis la branche, le long du bord droit
    pts = []; for (let k = 0; k < Math.round(h * 0.28); k++) pts.push([o.r - 1 + (Math.floor(k / 6) % 2), o.b - 1 - k]);
    lierreFin(pts, 2, 3, true, [1, 0]);
    // Lierre : angle en haut à droite
    pts = []; for (let k = 0; k < 12; k++) pts.push([o.r - 2 - k, o.t - (Math.floor(k / 6) % 2)]);
    lierreFin(pts, 3, 3, true, [0, -1]);
    pts = []; for (let k = 0; k < 8; k++) pts.push([o.r, o.t + 2 + k]);
    lierreFin(pts, 4, 3, true, [1, 0]);
    // Herbe sur le bord du haut, mousse et fougères sur la branche
    herbes(o.l + Math.round(w * 0.55), o.t, 3, 3);
    herbes(o.l + Math.round(w * 0.78), o.t, 2, 9);
    if (!telephone) {
      // Même profil que dans peindreBranche.
      const x0 = o.l - 26, x1 = o.r + 28, base = o.b;
      const yb = x => {
        const f = (x - x0) / (x1 - x0);
        let y = base + 1 + Math.round(Math.sin(f * Math.PI) * 1.4);
        if (x > x1 - 16) y -= Math.round(((x - (x1 - 16)) / 16) ** 2 * 6);
        if (x < x0 + 10) y += Math.round(((x0 + 10 - x) / 10) * 2);
        return y;
      };
      mousse(o.l + Math.round(w * 0.2), yb(o.l + Math.round(w * 0.2)) - 2, 9, 21);
      mousse(o.l + Math.round(w * 0.62), yb(o.l + Math.round(w * 0.62)) - 2, 12, 22);
      fougere(o.l + 6, yb(o.l + 6) - 2, -1);
      fougere(o.r - 8, yb(o.r - 8) - 2, 1);
    } else {
      fougere(o.l - 1, o.b - 1, -1);
    }
  }

  // ---------- Boucle ----------
  const els = { entete: document.querySelector(".entete"), partie: document.getElementById("partie"), historique: document.getElementById("historique") };
  function peindre() {
    moment = racine.dataset.moment || "jour";
    P = PAL[moment] || PAL.jour;
    if (avant.width !== Math.ceil(innerWidth / Math.max(2, Math.round(innerHeight / 290)))) dimensionner();
    ca.clearRect(0, 0, W, H); cr.clearRect(0, 0, W, H);
    const bx = {};
    for (const [k, el] of Object.entries(els)) bx[k] = boite(el);
    c = ca;
    peindreCadres(bx);
  }
  dimensionner();
  addEventListener("resize", () => { dimensionner(); peindre(); });
  // L'animation suit le bouton « Figer le décor », ou à défaut
  // prefers-reduced-motion.
  const bFiger = document.getElementById("figer-decor");
  const fige = () => bFiger ? bFiger.getAttribute("aria-pressed") === "true" : matchMedia("(prefers-reduced-motion: reduce)").matches;
  setInterval(() => { if (!fige()) t += 1; peindre(); }, 160);

  // Les canevas restent transparents jusqu'à ce que la partie soit remplie
  // (Piafle.pret et polices chargées) : sinon la branche serait peinte sous
  // une partie encore vide, puis sauterait plus bas. Apparition en fondu.
  for (const k of [avant, arriere]) { k.style.opacity = "0"; k.style.transition = "opacity 400ms ease"; }
  let montre = false;
  const montrer = () => {
    if (montre) return;
    montre = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      peindre();
      for (const k of [avant, arriere]) k.style.opacity = "1";
    }));
  };
  // js/jeu.js est chargé après ce fichier : Piafle.pret n'existe qu'à la fin
  // du document.
  const attendre = () => {
    const pret = window.Piafle && window.Piafle.pret ? window.Piafle.pret : Promise.resolve();
    const polices = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.all([pret, polices]).then(montrer, montrer);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attendre);
  else attendre();
  setTimeout(montrer, 6000); // filet de sécurité si le jeu ne charge pas

  // Repeint dès qu'un panneau change de taille, sans attendre le prochain tick.
  if (window.ResizeObserver) {
    const suivi = new ResizeObserver(() => peindre());
    for (const el of Object.values(els)) if (el) suivi.observe(el);
  }
  peindre();
})();
