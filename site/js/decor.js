// Décor de Piafle : paysage en pixel art (canevas basse résolution agrandi sans lissage),
// animé, décliné en aube, jour, soir et nuit selon l'heure de Paris.
// Il reste derrière la partie et ne dépend pas de la logique du jeu.
(() => {
  const canvas = document.getElementById("decor");
  const ctx = canvas.getContext("2d");

  // ---------- Palettes du décor par moment de la journée ----------
  const PAL = {
    jour: {
      ciel: ["#5FA7DA", "#7DBCE4", "#A2D2EA", "#C9E6EC"], astre: "#FFF2B0",
      nuage: "#F4FAFB", nuageOmbre: "#C3DCE8",
      mont: "#86A6C0", montOmbre: "#5E7E9C", neige: "#EEF5F6", neigeOmbre: "#BFD3DF",
      colline: "#5D8A82", loin: "#4F7D6A",
      sapinS: "#1E4433", sapinM: "#2F6145", sapinC: "#4E8A50",
      prairie: "#86B04A", prairieOmbre: "#6C9A3C", herbe: "#4F7A2C", herbeC: "#9CC85A", terre: "#9A7448", terreOmbre: "#7A5A38",
      eau: "#4F93C0", eauClair: "#B5DDEC", eauSombre: "#3C7AA6",
      tronc: "#6B4A2E", troncOmbre: "#4A3220", troncClair: "#8A6440",
      feuilleA: "#D9762B", feuilleB: "#EDB43C", feuilleC: "#9C4A22",
      tente: "#E07A2E", tenteOmbre: "#A5521D", bois: "#7A5634", boisOmbre: "#55391F",
      roche: "#8E9196", rocheOmbre: "#666B72", rocheClair: "#B4B7BA",
      roseau: "#7C8F3A", massette: "#6A4024",
      teinte: null, force: 0, etoile: null,
    },
    aube: {
      ciel: ["#4B5D9A", "#8E73A6", "#E39A8C", "#F6C98E"], astre: "#FFE0A0",
      nuage: "#F7C7B0", nuageOmbre: "#B98AA3",
      mont: "#7C7AA6", montOmbre: "#5C5A86", neige: "#F6DCD6", neigeOmbre: "#C9A9B8",
      colline: "#5A6A80", loin: "#4F6A72",
      sapinS: "#1D3A33", sapinM: "#2C5246", sapinC: "#41704F",
      prairie: "#76944A", prairieOmbre: "#5F7B3C", herbe: "#43632F", herbeC: "#8EAA58", terre: "#86664A", terreOmbre: "#694E38",
      eau: "#7C82B0", eauClair: "#F6D0A6", eauSombre: "#5C6390",
      tronc: "#5C4030", troncOmbre: "#3D2A20", troncClair: "#7A5A42",
      feuilleA: "#C76A33", feuilleB: "#DDA04A", feuilleC: "#8A4228",
      tente: "#C96A33", tenteOmbre: "#8E4624", bois: "#6A4A30", boisOmbre: "#4A321F",
      roche: "#857F8E", rocheOmbre: "#615C6C", rocheClair: "#AAA2AE",
      roseau: "#6E7E3E", massette: "#5C3A24",
      teinte: "#8E73A6", force: 0.22, etoile: "#FBE9D0",
    },
    soir: {
      ciel: ["#2E3C78", "#7B4F8E", "#D66E5E", "#F2A65A"], astre: "#FFC46B",
      nuage: "#E9926F", nuageOmbre: "#8C4F72",
      mont: "#6A5A88", montOmbre: "#493F66", neige: "#F0BFAE", neigeOmbre: "#A9819A",
      colline: "#46506A", loin: "#3D4F5E",
      sapinS: "#152A26", sapinM: "#223F38", sapinC: "#335A46",
      prairie: "#66803F", prairieOmbre: "#506734", herbe: "#384F28", herbeC: "#7E9A4C", terre: "#755540", terreOmbre: "#5A4030",
      eau: "#6A5C8E", eauClair: "#F2A65A", eauSombre: "#4A4270",
      tronc: "#4E3528", troncOmbre: "#33231B", troncClair: "#6A4A36",
      feuilleA: "#B85A2E", feuilleB: "#CF8E3E", feuilleC: "#7A3824",
      tente: "#B85A2E", tenteOmbre: "#7C3A20", bois: "#5A3E2A", boisOmbre: "#3D2A1C",
      roche: "#6E6478", rocheOmbre: "#4F4858", rocheClair: "#958A9A",
      roseau: "#5C6A36", massette: "#4E3020",
      teinte: "#7B4F8E", force: 0.32, etoile: "#FFE7C2",
    },
    nuit: {
      ciel: ["#0E1430", "#16204A", "#1F2D5C", "#2A3A6A"], astre: "#EEF0F6",
      nuage: "#3A4777", nuageOmbre: "#2A355F",
      mont: "#2C3762", montOmbre: "#1E274B", neige: "#9AA8CC", neigeOmbre: "#5E6C98",
      colline: "#1C2846", loin: "#18263E",
      sapinS: "#0B1424", sapinM: "#122036", sapinC: "#1C3048",
      prairie: "#22354A", prairieOmbre: "#1B2C3F", herbe: "#142334", herbeC: "#2C4258", terre: "#2C2C3C", terreOmbre: "#22222F",
      eau: "#1B2A50", eauClair: "#AEB8D8", eauSombre: "#141F3E",
      tronc: "#2A2430", troncOmbre: "#1C1822", troncClair: "#3A3240",
      feuilleA: "#3A3448", feuilleB: "#4A4258", feuilleC: "#2A2638",
      tente: "#8A4A3A", tenteOmbre: "#5A2E28", bois: "#3A2A2A", boisOmbre: "#271C1C",
      roche: "#363C52", rocheOmbre: "#272C3E", rocheClair: "#4A5068",
      roseau: "#25343A", massette: "#2A2228",
      teinte: "#16204A", force: 0.62, etoile: "#F4F1D8",
    },
  };


  // ---------- Sprites des oiseaux (couleurs naturelles, teintées selon l'heure) ----------
  const SPRITES = {
    rougegorge: {
      couleurs: { B: "#54432F", b: "#7D6A4C", g: "#9BA0A3", o: "#E0662F", O: "#B94A22", k: "#1E1A18", w: "#EFE6D6", W: "#CFC3AE", l: "#8A6A55" },
      images: [[
        "........BBB.....",
        ".......BbbbB....",
        "......BbboooO...",
        ".....Bbbgookokk.",
        "....BbbgoooooO..",
        "...BbbbgoooooO..",
        ".BBbBBBgooooO...",
        "BBbbBBBbooooO...",
        "BbbBbBBbgoooO...",
        ".BBbBBwwwwO.....",
        "...BBBwwwwW.....",
        ".....WwwwW......",
        "......l.l.......",
        ".....ll.ll......",
      ], [
        "................",
        "........BBB.....",
        ".......BbbbB....",
        "......BbboooO...",
        ".....Bbbgookokk.",
        "....BbbgoooooO..",
        "..BbbbbgoooooO..",
        "BBbBBBBgooooO...",
        "BbbBbBBbooooO...",
        ".BBbBBbgoooO....",
        "...BBBwwwwW.....",
        ".....WwwwW......",
        ".....l...l......",
        "....ll...ll.....",
      ]],
    },
    mesange: {
      couleurs: { c: "#3E86D6", C: "#25599E", w: "#F4F2EA", k: "#18202C", v: "#97A64E", y: "#F2CF3A", Y: "#C9A42A", l: "#6A7A8C" },
      images: [[
        "......ccc.....",
        ".....cCccc....",
        "....cwwwwww...",
        "...ckkkkwkkkk.",
        "...vwwwwwwk...",
        "..vvwwwwwkk...",
        ".vvvkkkkky....",
        "CCcvvyyyyyY...",
        "CwCcvyyyyyY...",
        ".CwccvyyyyY...",
        "..CCcvYyyY....",
        ".....l.l......",
        "....ll.ll.....",
      ], [
        "..............",
        "......ccc.....",
        ".....cCccc....",
        "....cwwwwww...",
        "...ckkkkwkkkk.",
        "...vwwwwwwk...",
        "..vvwwwwwkk...",
        ".vvvkkkkky....",
        "CCcvvyyyyyY...",
        "CwCcvyyyyyY...",
        "..CCcvYyyY....",
        ".....l.l......",
        "....ll.ll.....",
      ]],
    },
    pic: {
      couleurs: { k: "#1E1E24", w: "#F2F0EA", r: "#D0342C", b: "#7A7A84" },
      images: [[
        "...kkk....",
        "..kkkkk...",
        "bbkwkkr...",
        "..wwwkr...",
        "..wkkkk...",
        ".kwwkkkw..",
        "..wwkkww..",
        "..wwkkwwk.",
        ".kwwkkkwk.",
        "..wwkwkkk.",
        "..wwkkwkk.",
        "..rrkwkk..",
        "..rrkkk...",
        "...rkkk...",
        "....kk....",
        "....k.....",
      ]],
    },
    martin: {
      couleurs: { c: "#2BB0E0", C: "#1C6FA8", o: "#E8762E", O: "#B85520", w: "#F4EEE0", k: "#1A1A1E", l: "#D04A2A" },
      images: [[
        "...cccc.....",
        "..cCcCcc....",
        "kkkwocCcc...",
        "...wwoocCc..",
        "....oooccCc.",
        "....OoooCcc.",
        ".....oOoCCcc",
        "......oo.CCc",
        ".....l.l....",
      ], [
        "...cccc.....",
        "..cCcCcc....",
        ".kkwocCcc...",
        "...wwoocCc..",
        "....oooccCc.",
        "....OoooCcc.",
        ".....oOoCCcc",
        "......oo.CCc",
        ".....l.l....",
      ]],
    },
    grue: {
      couleurs: { g: "#A3ACB6", G: "#6D7682", k: "#1E2228", w: "#F2F2EE", r: "#C8332B", l: "#4A4E56" },
      images: [[
        "...........GG.........",
        "..........Gggg........",
        ".........Gggggg.......",
        "rkkkkkggggggggggGGllll",
        "kw....gggggggg........",
        "......................",
        "......................",
      ], [
        "......................",
        "......................",
        "........GGGggggg......",
        "rkkkkkggggggggggGGllll",
        "kw....gggggggg........",
        "......................",
        "......................",
      ], [
        "......................",
        "......................",
        "......................",
        "rkkkkkggggggggggGGllll",
        "kw....gggggggggg......",
        ".........Gggggg.......",
        "..........GGgg........",
      ], [
        "......................",
        "......................",
        "........GGGggggg......",
        "rkkkkkggggggggggGGllll",
        "kw....gggggggg........",
        "......................",
        "......................",
      ]],
    },
    heron: {
      couleurs: { g: "#A9B0B8", G: "#5E6670", k: "#1E2228", w: "#ECEEEC", y: "#E8B23A", l: "#8A7A5A" },
      images: [[
        "..........GG............",
        ".........GGgg...........",
        "........GGgggg..........",
        ".......Ggggggggg........",
        "yykw.wggggggggggggllllll",
        "...wwwwgggggggg.........",
        "........................",
        "........................",
      ], [
        "........................",
        "........................",
        ".......GGGgggggg........",
        ".......Ggggggggg........",
        "yykw.wggggggggggggllllll",
        "...wwwwgggggggg.........",
        "........................",
        "........................",
      ], [
        "........................",
        "........................",
        "........................",
        ".......gggggggggg.......",
        "yykw.wggggggggggggllllll",
        "...wwwwggggggggg........",
        "........GGgggg..........",
        ".........GGg............",
      ], [
        "........................",
        "........................",
        ".......GGGgggggg........",
        ".......Ggggggggg........",
        "yykw.wggggggggggggllllll",
        "...wwwwgggggggg.........",
        "........................",
        "........................",
      ]],
    },
    chouette: {
      couleurs: { b: "#7A5A3C", B: "#4E3826", c: "#C9A27A", k: "#121014", n: "#D8B060", w: "#D8C2A0", f: "#9A8A6A" },
      images: [[
        "...bbbbbb...",
        "..bBbbbbBb..",
        ".bBccbbccBb.",
        ".bcckccckcb.",
        ".bccccbcccb.",
        ".bBcccncccBb",
        "..bBbbbbbBb.",
        ".bbBwbbwbBbb",
        ".bbbbwbbwbbb",
        ".bBbbbwbbbBb",
        "..bBbwbbwBb.",
        "...bbbbbbb..",
        "....f..f....",
      ], [
        "...bbbbbb...",
        "..bBbbbbBb..",
        ".bBccbbccBb.",
        ".bcBBccBBcb.",
        ".bccccbcccb.",
        ".bBcccncccBb",
        "..bBbbbbbBb.",
        ".bbBwbbwbBbb",
        ".bbbbwbbwbbb",
        ".bBbbbwbbbBb",
        "..bBbwbbwBb.",
        "...bbbbbbb..",
        "....f..f....",
      ]],
    },
    chauvesouris: {
      couleurs: { k: "#0A0C14" },
      images: [
        ["k.......k", ".kk.k.kk.", "..kkkkk..", "...k.k..."],
        [".........", "..kkkkk..", ".kk.k.kk.", "k...k...k"],
      ],
    },
  };

  // ---------- Outils ----------
  function rng(graine) {
    let a = graine >>> 0;
    return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bay = (x, y) => BAYER[((y % 4) + 4) % 4][((x % 4) + 4) % 4];
  const px = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const pt = (c, x, y, col) => px(c, x, y, 1, 1, col);

  function bruit(graine, lissage) {
    const r = rng(graine), pts = [];
    for (let i = 0; i < 400; i++) pts.push(r());
    return x => { x = Math.abs(x); const i = Math.floor(x / lissage) % 398, f = (x / lissage) % 1, s = f * f * (3 - 2 * f); return pts[i] * (1 - s) + pts[i + 1] * s; };
  }

  function melange(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const m = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
    return "#" + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
  }
  const cacheTeinte = new Map();
  function teinter(col) {
    if (!P.teinte) return col;
    const cle = moment + col;
    if (!cacheTeinte.has(cle)) cacheTeinte.set(cle, melange(col, P.teinte, P.force));
    return cacheTeinte.get(cle);
  }

  function oiseau(c, nom, image, x, y, miroir = false) {
    const s = SPRITES[nom], lignes = s.images[((image % s.images.length) + s.images.length) % s.images.length];
    x = Math.round(x); y = Math.round(y);
    for (let j = 0; j < lignes.length; j++) {
      const l = lignes[j];
      for (let i = 0; i < l.length; i++) {
        const k = l[i];
        if (k === "." || !s.couleurs[k]) continue;
        pt(c, miroir ? x + l.length - 1 - i : x + i, y + j, teinter(s.couleurs[k]));
      }
    }
  }

  // ---------- Plans du décor, du fond vers l'avant ----------
  // ciel → étoiles, nuages → paysage → héron, grues, martin-pêcheur → sol → herbes animées → premier plan → animaux, feu
  const plans = {};
  for (const nom of ["ciel", "paysage", "sol", "avant"]) { const c = document.createElement("canvas"); plans[nom] = { c, x: c.getContext("2d") }; }

  let W = 0, H = 0, ECHELLE = 3;
  const R = {};
  function dimensionner() {
    const vw = innerWidth, vh = innerHeight;
    ECHELLE = Math.max(2, Math.round(vh / 290));
    W = Math.ceil(vw / ECHELLE); H = Math.ceil(vh / ECHELLE);
    canvas.width = W; canvas.height = H;
    canvas.style.width = W * ECHELLE + "px"; canvas.style.height = H * ECHELLE + "px";
    for (const p of Object.values(plans)) { p.c.width = W; p.c.height = H; }
    // Le centre (34 % à 66 % de la largeur) reste dégagé pour la partie.
    R.k = H / 290;
    R.horizon = Math.round(H * 0.6);
    R.lacHaut = R.horizon + 3;
    R.lacBas = Math.round(H * 0.74);
    R.sol = Math.round(H * 0.875);
    R.affutX = Math.round(W * 0.215);
    R.pieuX = Math.round(W * 0.3);
    R.tenteX = Math.round(W * 0.79);
    R.feuX = Math.round(W * 0.705);
    const bosse = bruit(91, 26);
    R.contour = x => Math.round(R.sol + 1 + bosse(x + 7) * 8);
    R.feuY = R.contour(R.feuX) + 3;
  }

  let moment = "jour", P = PAL.jour;

  // ---------- Motifs ----------
  function sapin(c, x, base, h, r, couleurs = [P.sapinS, P.sapinM, P.sapinC], tronc = true) {
    const [S, M, C] = couleurs;
    x = Math.round(x); base = Math.round(base); h = Math.max(5, Math.round(h));
    const haut = base - h, bas = base - Math.max(1, Math.round(h * 0.08)), largeur = h * 0.3;
    // Tronc large qui monte dans le feuillage : il n'en dépasse qu'au pied
    if (tronc && h >= 16) {
      const tw = Math.max(2, Math.round(h * 0.055)), x0 = x - Math.floor(tw / 2), y0 = Math.round(haut + h * 0.4);
      px(c, x0, y0, tw, base - y0, P.troncOmbre);
      px(c, x0, y0, Math.max(1, Math.round(tw * 0.4)), base - y0, P.tronc);
      if (tw > 3) for (let y = y0 + 2; y < base; y += 3) pt(c, x0 + 1 + (y % 2), y, P.troncClair);
      pt(c, x0 - 1, base - 1, P.troncOmbre); pt(c, x0 + tw, base - 1, P.troncOmbre);
    }
    // Étages de branches qui se chevauchent, du bas vers le haut : le dessous sombre de chaque étage retombe sur le suivant
    const etages = Math.max(3, Math.round(h / 8)), tiers = [];
    for (let e = 0; e < etages; e++) {
      const yA = haut + (bas - haut) * Math.pow(e / etages, 0.9), yB = haut + (bas - haut) * Math.pow((e + 1) / etages, 0.9);
      tiers.push({ yA: Math.round(e === 0 ? haut : yA - (yB - yA) * 0.55), yB: Math.round(yB), w: 1.2 + largeur * Math.pow((e + 1) / etages, 0.95) });
    }
    for (let e = etages - 1; e >= 0; e--) {
      const { yA, yB, w } = tiers[e], he = Math.max(2, yB - yA), dent = r() * 6.28;
      let dg = 0, dd = 0;
      for (let j = 0; j <= he; j++) {
        const y = yA + j, t = j / he;
        const demi = w * Math.pow(t, 0.8) + Math.sin(j * 1.9 + dent) * 0.7 * t;
        dg = Math.max(0, demi + (r() - 0.5) * 1.4 * t); dd = Math.max(0, demi + (r() - 0.5) * 1.4 * t);
        for (let xx = -Math.round(dg); xx <= Math.round(dd); xx++) {
          const u = xx / Math.max(1, demi);
          let lum = -u * 0.95 + (bay(x + xx, y) - 7.5) / 22;
          if (t > 0.78 && Math.abs(u) < 0.7) lum -= 0.9;           // dessous de l'étage, dans l'ombre
          else if (t < 0.35) lum += 0.15;
          const g = r();
          if (g < 0.06) lum += 0.7; else if (g > 0.95) lum -= 0.7; // touffes d'aiguilles
          pt(c, x + xx, y, lum > 0.38 ? C : lum > -0.38 ? M : S);
        }
      }
      // pointes des branches qui retombent
      pt(c, x - Math.round(dg) - 1, yB, C); pt(c, x - Math.round(dg), yB + 1, M);
      pt(c, x + Math.round(dd) + 1, yB, S); pt(c, x + Math.round(dd), yB + 1, S);
    }
    pt(c, x, haut - 1, M); pt(c, x, haut - 2, S);
  }

  // Tronc et branches : une suite de disques, éclairés en haut à gauche, avec des stries d'écorce
  function disque(c, cx, cy, rad) {
    const rr = Math.max(0.5, rad);
    const n = Math.ceil(rr);
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
      if (dx * dx + dy * dy > rr * rr + 0.4) continue;
      const lum = (-dx - dy * 0.4) / (rr + 0.5);
      let col = lum > 0.45 ? P.troncClair : lum < -0.35 ? P.troncOmbre : P.tronc;
      const X = Math.round(cx + dx), Y = Math.round(cy + dy);
      if (rr >= 2.5 && ((X * 5 + Math.floor(Y / 4) * 3) % 9 === 0) && lum < 0.6) col = P.troncOmbre; // écorce
      pt(c, X, Y, col);
    }
  }

  function segment(c, x, y, angle, len, w, r, trace, courbure, effil) {
    let a = angle;
    const pas = Math.max(1, Math.round(len));
    for (let s = 0; s < pas; s++) {
      const ww = w * (1 - (s / pas) * (1 - effil));
      disque(c, x, y, ww / 2);
      if (trace) trace.push({ x, y, w: ww, a });
      x += Math.sin(a) * 0.9; y -= Math.cos(a) * 0.9;
      a += courbure + (r() - 0.5) * 0.08;
    }
    return { x, y, angle: a, w: w * effil };
  }

  function ramifier(c, x, y, angle, len, w, prof, r, info) {
    const ecarts = prof === 1 ? [-0.7, -0.05, 0.55] : [-0.5, 0.42];
    for (const e of ecarts) {
      if (prof > 1 && r() < 0.15) continue;
      let a = angle + e + (r() - 0.5) * 0.35;
      if (x > info.limite && a > 0) a *= 0.3;   // les branches ne débordent pas sur la zone de jeu
      const l = len * (0.7 + r() * 0.4);
      const fin = segment(c, x, y, a, l, w * (prof === 1 && e === 0.08 ? 0.85 : 0.72), r, null, (r() - 0.5) * 0.03 - e * 0.012, 0.6);
      info.branches.push({ x0: x, y0: y, x1: fin.x, y1: fin.y, a, prof, w: w * 0.72 });
      // petites brindilles le long de la branche
      if (prof >= 2) segment(c, (x + fin.x) / 2, (y + fin.y) / 2, a + (r() < 0.5 ? -0.9 : 0.9), l * 0.3, 1, r, null, 0, 0.6);
      if (prof < 3 && fin.w > 1) ramifier(c, fin.x, fin.y, fin.angle, l * 0.66, fin.w, prof + 1, r, info);
      else info.bouts.push({ x: fin.x, y: fin.y });
    }
  }

  function arbre(c, x0, base, haut, graine, penche = 0) {
    const r = rng(graine);
    const info = { tronc: [], branches: [], bouts: [], limite: W * 0.19 };
    const w0 = Math.max(6, haut * 0.06);
    // racines qui s'étalent sur le sol
    for (const s of [-1, 1]) {
      segment(c, x0 + s * w0 * 0.15, base - 3, s * 1.75, w0 * 1.1 + r() * 4, w0 * 0.55, r, null, -s * 0.03, 0.3);
      segment(c, x0 + s * w0 * 0.1, base - 4, s * 2.1, w0 * 0.7, w0 * 0.4, r, null, -s * 0.02, 0.3);
    }
    const hTronc = haut * (0.42 + r() * 0.08);
    const fin = segment(c, x0, base, penche, hTronc, w0, r, info.tronc, -penche * 0.004, 0.72);
    ramifier(c, fin.x, fin.y, fin.angle, haut * 0.34, fin.w, 1, r, info);
    // feuillage d'automne, en touffes au bout des branches (certaines restent nues)
    const touffes = info.bouts.concat(info.branches.filter(b => b.prof >= 2).map(b => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 })));
    for (const b of touffes) {
      if (r() < 0.15) continue;
      const rad = (6 + r() * 5) * R.k;
      for (let y = -rad; y <= rad; y++) for (let x = -rad * 1.25; x <= rad * 1.25; x++) {
        const d = (x / 1.25) ** 2 + y * y;
        if (d > rad * rad || (d > rad * rad * 0.55 && r() < 0.45)) continue;
        const lum = (-x / 1.25 - y) / rad + (r() - 0.5) * 0.9;
        pt(c, b.x + x, b.y + y - rad * 0.3, lum > 0.55 ? P.feuilleB : lum > -0.25 ? P.feuilleA : P.feuilleC);
      }
    }
    return info;
  }

  function rocher(c, x, y, l, h) {
    for (let j = 0; j < h; j++) {
      const t = j / h, demi = Math.round(l / 2 * Math.sqrt(1 - (1 - t) ** 2 * 0.9));
      px(c, x - demi, y - h + j, demi * 2, 1, P.roche);
      px(c, x - demi, y - h + j, Math.max(1, Math.round(demi * 0.6)), 1, j < h * 0.4 ? P.rocheClair : P.roche);
      px(c, x + Math.round(demi * 0.4), y - h + j, Math.round(demi * 0.6), 1, P.rocheOmbre);
    }
    pt(c, x - 1, y - h + 1, P.prairieOmbre); pt(c, x, y - h + 1, P.herbeC); pt(c, x + 2, y - h + 2, P.herbe);
  }

  const FLEURS = {
    paquerette(c, x, y) { const b = teinter("#FFFFFF"); px(c, x, y + 1, 1, 3, P.herbe); pt(c, x, y - 1, b); pt(c, x - 1, y, b); pt(c, x + 1, y, b); pt(c, x, y + 1, b); pt(c, x, y, teinter("#F2C230")); },
    boutondor(c, x, y) { px(c, x, y + 1, 1, 4, P.herbe); px(c, x - 1, y - 1, 3, 2, teinter("#F7D23A")); pt(c, x, y - 1, teinter("#FFF3A0")); },
    bleuet(c, x, y) { px(c, x, y + 1, 1, 4, P.herbe); const b = teinter("#4A78D8"); pt(c, x - 1, y, b); pt(c, x + 1, y, b); pt(c, x, y - 1, b); pt(c, x, y, teinter("#2A3F8A")); },
    coquelicot(c, x, y) { px(c, x, y + 1, 1, 5, P.herbe); px(c, x - 1, y - 1, 3, 2, teinter("#D8362C")); pt(c, x - 1, y - 2, teinter("#E8564A")); pt(c, x, y, teinter("#2A1414")); },
    trefle(c, x, y) { px(c, x, y + 1, 1, 2, P.herbe); px(c, x - 1, y - 1, 2, 2, teinter("#D98AB0")); pt(c, x, y - 1, teinter("#F0B4CF")); },
  };
  const TYPES_FLEURS = Object.keys(FLEURS);

  function digitale(c, x, y, h) {
    px(c, x, y - h, 1, h + 2, P.herbe);
    for (let j = 0; j < h - 2; j += 2) {
      const col = teinter(j % 4 ? "#B98AD8" : "#9A68C2");
      pt(c, x - 1, y - h + 2 + j, col); pt(c, x + 1, y - h + 3 + j, col);
    }
    pt(c, x, y - h - 1, teinter("#C9A6E2"));
  }

  function champignon(c, x, y) {
    px(c, x, y - 2, 2, 3, teinter("#F2E8D6"));
    px(c, x - 2, y - 4, 6, 2, teinter("#C8332B")); px(c, x - 1, y - 5, 4, 1, teinter("#C8332B"));
    pt(c, x - 1, y - 4, teinter("#FFFFFF")); pt(c, x + 2, y - 5, teinter("#FFFFFF"));
  }

  function fougere(c, x, y, h, dir) {
    for (let j = 0; j < h; j++) {
      const xx = x + Math.round(dir * j * j / (h * 1.6));
      pt(c, xx, y - j, P.herbe);
      if (j % 2 === 0 && j > 1) { pt(c, xx - 1, y - j, P.herbeC); pt(c, xx + 1, y - j + 1, P.herbeC); if (j < h - 3) { pt(c, xx - 2, y - j + 1, P.herbe); pt(c, xx + 2, y - j + 1, P.herbe); } }
    }
  }

  // ---------- Construction des plans fixes ----------
  function construireCiel(c) {
    c.clearRect(0, 0, W, H);
    const n = P.ciel.length;
    for (let y = 0; y < R.horizon + 4; y++) {
      const t = Math.min(1, y / R.horizon) * (n - 1), i = Math.floor(t), f = t - i;
      for (let x = 0; x < W; x++) pt(c, x, y, P.ciel[Math.min(n - 1, i + (f * 16 > bay(x, y) ? 1 : 0))]);
    }
    const astre = moment === "nuit" ? { x: W * 0.8, y: H * 0.15, r: 8 }
      : moment === "jour" ? { x: W * 0.78, y: H * 0.14, r: 10 }
      : { x: W * (moment === "aube" ? 0.74 : 0.27), y: R.horizon - H * 0.19, r: 12 };
    for (let y = -astre.r - 3; y <= astre.r + 3; y++) for (let x = -astre.r - 3; x <= astre.r + 3; x++) {
      const d = x * x + y * y;
      if (d <= astre.r * astre.r) pt(c, astre.x + x, astre.y + y, P.astre);
      else if (moment !== "nuit" && d <= (astre.r + 3) ** 2 && bay(x, y) > 9) pt(c, astre.x + x, astre.y + y, P.astre);
    }
    if (moment === "nuit") for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
      if ((x - 4) ** 2 + (y + 2) ** 2 <= 40) pt(c, astre.x + x, astre.y + y, P.ciel[0]);
    }
  }

  function polygone(c, pts, couleur) {
    const ys = pts.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) pt(c, x, y, couleur(x, y));
    }
  }
  function ligne(c, x0, y0, x1, y1, col) {
    const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) pt(c, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col);
  }

  // Petite cabane d'observation en rondins, sur pilotis, avec sa fente de guet
  function cabane(c, x, base) {
    const k = R.k, cw = Math.round(26 * k), ch = Math.round(12 * k), toit = Math.round(7 * k), pil = Math.max(2, Math.round(3 * k));
    const x0 = x - Math.round(cw / 2), sol = base - pil, yMur = sol - ch;
    const clair = melange(P.bois, "#FFFFFF", 0.14), sombre = melange(P.boisOmbre, "#000000", 0.25);
    for (const xx of [x0 + 1, x0 + Math.round(cw / 2) - 1, x0 + cw - 3]) px(c, xx, sol, 2, pil + 1, sombre);
    for (let y = yMur; y < sol; y++) { const j = (y - yMur) % 3; px(c, x0, y, cw, 1, j === 0 ? clair : j === 1 ? P.bois : P.boisOmbre); }
    for (let y = yMur; y < sol; y += 3) { pt(c, x0 - 1, y, P.bois); pt(c, x0 - 1, y + 1, P.boisOmbre); pt(c, x0 + cw, y, clair); pt(c, x0 + cw, y + 1, P.boisOmbre); }
    px(c, x0 - 2, sol, cw + 4, 1, P.boisOmbre);
    // fente d'observation, volet relevé, rebord
    const fy = yMur + Math.round(ch * 0.3), fh = Math.max(2, Math.round(2.5 * k));
    px(c, x0 + 3, fy, cw - 6, fh, "#16110C");
    px(c, x0 + 2, fy - 1, cw - 4, 1, sombre);
    px(c, x0 + 2, fy + fh, cw - 4, 1, clair);
    px(c, x0, yMur, cw, 1, sombre); // ombre de l'avant-toit
    // échelle d'accès, à gauche
    px(c, x0 + 2, sol + 1, 1, pil + 1, P.bois); px(c, x0 + 5, sol + 1, 1, pil + 1, P.bois);
    for (let y = sol + 2; y <= base; y += 2) px(c, x0 + 2, y, 4, 1, P.boisOmbre);
    // toit en bardeaux, un peu moussu
    const tA = melange(P.boisOmbre, P.roche, 0.25), tC = melange(P.bois, P.roche, 0.3), tS = melange(P.boisOmbre, "#000000", 0.3);
    for (let j = 0; j < toit; j++) {
      const y = yMur - toit + j, retrait = Math.round((toit - 1 - j) * 0.8);
      for (let xx = x0 - 3 + retrait; xx <= x0 + cw + 2 - retrait; xx++) {
        let col = j < toit * 0.4 ? tC : tA;
        if ((xx + (j % 2) * 2) % 4 === 0) col = tS;
        if (j === toit - 1) col = tS;
        if (j < 3 && bay(xx, y) > 12) col = P.sapinC;
        pt(c, xx, y, col);
      }
    }
    // tuyau de poêle
    px(c, x0 + cw - 6, yMur - toit - 3, 2, 3, P.rocheOmbre);
    return { cw };
  }

  function construirePaysage(c) {
    c.clearRect(0, 0, W, H);
    const horizonCiel = P.ciel[P.ciel.length - 1];
    // Chaîne lointaine, pâlie par la brume
    const lc = bruit(17, 34), lf = bruit(23, 5);
    const mL = melange(P.mont, horizonCiel, 0.5), mLO = melange(P.montOmbre, horizonCiel, 0.5), nL = melange(P.neige, horizonCiel, 0.3), nLO = melange(P.neigeOmbre, horizonCiel, 0.4);
    for (let x = 0; x < W; x++) {
      const h = H * 0.17 + lc(x) * H * 0.15 + lf(x) * H * 0.014;
      for (let y = Math.round(R.horizon - h); y < R.horizon; y++) {
        const p = y - (R.horizon - h), xs = x + p * 0.6;
        const ombre = lc(xs + 2) > lc(xs) + 0.003;
        const neige = y < R.horizon - H * 0.275 + lf(x * 1.7) * 5;
        pt(c, x, y, neige ? (ombre ? nLO : nL) : (ombre ? mLO : mL));
      }
    }
    // Massif principal : facettes, strates rocheuses, neige au-dessus d'une ligne irrégulière qui descend dans les couloirs
    const crete = bruit(11, 46), crete2 = bruit(29, 12), crete3 = bruit(37, 3), coulee = bruit(53, 4), ligneN = bruit(59, 22), roc = bruit(61, 4), roc2 = bruit(67, 6);
    const rocSombre = melange(P.montOmbre, "#000000", 0.2), relief = x => crete(x) + crete2(x) * 0.18;
    const altN = R.horizon - H * 0.255, descente = H * 0.1;
    for (let x = 0; x < W; x++) {
      const h = H * 0.13 + crete(x) * H * 0.2 + crete2(x) * H * 0.035 + crete3(x) * H * 0.009;
      const sommet = Math.round(R.horizon - h);
      const ln = altN + (ligneN(x) - 0.5) * H * 0.06;
      for (let y = sommet; y < R.horizon; y++) {
        const p = y - sommet, xs = x + p * 0.7;
        const ombre = relief(xs + 2) > relief(xs) + 0.003;
        let col = ombre ? P.montOmbre : P.mont;
        if (roc(xs * 1.5) > 0.79 && roc2(y + xs * 0.3) > 0.4 && bay(x, y) > 3) col = ombre ? rocSombre : P.montOmbre;
        const sous = y - ln;
        let neige = sous < 0 || (p < 2 && h > H * 0.24);
        if (!neige && sous < descente) neige = coulee(xs * 1.4) > 0.48 + (sous / descente) * 0.5;
        if (neige && roc(xs * 1.2 + y * 0.8 + 40) > 0.84) neige = false; // rochers qui percent la neige
        if (neige) col = ombre ? P.neigeOmbre : P.neige;
        pt(c, x, y, col);
      }
    }
    // Brume au pied des montagnes
    for (let y = R.horizon - Math.round(H * 0.05); y < R.horizon; y++) for (let x = 0; x < W; x++) {
      if (bay(x, y) < (y - (R.horizon - H * 0.05)) / (H * 0.05) * 9) pt(c, x, y, mL);
    }
    // Collines boisées
    const colline = bruit(71, 30);
    for (let x = 0; x < W; x++) {
      const sommet = Math.round(R.horizon - 6 - colline(x) * H * 0.06);
      px(c, x, sommet, 1, R.horizon - sommet + 2, P.colline);
    }
    const r1 = rng(5);
    for (let x = -4; x < W + 4; x += 2 + Math.floor(r1() * 3)) sapin(c, x, R.horizon + 2, (7 + r1() * 8) * R.k, r1, [P.loin, P.colline, melange(P.colline, horizonCiel, 0.25)], false);

    // Prairie, plus texturée vers l'avant
    px(c, 0, R.horizon + 2, W, H - R.horizon, P.prairie);
    for (let y = R.horizon + 2; y < H; y++) {
      const prof = (y - R.horizon) / (H - R.horizon);
      for (let x = 0; x < W; x++) {
        const v = Math.sin(x * 0.11 + y * 0.9) + Math.sin(x * 0.037 - y * 0.21);
        if (bay(x, y) > 14 - prof * 5 || (v > 1.3 && bay(x, y) > 8)) pt(c, x, y, P.prairieOmbre);
      }
    }

    // Lac : rive du fond presque droite au pied des collines, rive proche qui s'arrondit
    const rive = bruit(41, 9);
    R.lac = [];
    const nL2 = R.lacBas - R.lacHaut;
    for (let i = 0; i < nL2; i++) {
      const y = R.lacHaut + i, t = i / nL2;
      const g = W * 0.035 + Math.pow(t, 2.4) * W * 0.09 + rive(y * 2) * 6 * t;
      const d = W * 0.72 - Math.pow(t, 1.3) * W * 0.19 - rive(y * 2 + 70) * 7 * Math.sqrt(t);
      R.lac.push([g, d]);
      for (let x = Math.round(g); x < d; x++) pt(c, x, y, t + (bay(x, y) - 7.5) / 40 > 0.58 ? P.eauSombre : P.eau);
      pt(c, g - 1, y, P.terreOmbre); pt(c, d, y, P.terreOmbre);
      if (t > 0.3 && bay(Math.round(d), y) > 6) pt(c, d + 1, y, P.terre);
    }
    for (let x = Math.round(R.lac[0][0]) - 1; x <= R.lac[0][1]; x++) pt(c, x, R.lacHaut - 1, bay(x, 0) > 5 ? P.terreOmbre : P.prairieOmbre);
    for (let x = Math.round(R.lac[nL2 - 1][0]); x < R.lac[nL2 - 1][1]; x++) pt(c, x, R.lacBas, bay(x, 1) > 4 ? P.terreOmbre : P.terre);
    // Reflet des collines et des montagnes, brouillé par les rides
    const img = c.getImageData(0, 0, W, R.lacBas), dta = img.data;
    for (let i = 0; i < nL2; i++) {
      const y = R.lacHaut + i, [g, d] = R.lac[i];
      const sy = R.lacHaut - 2 - Math.round(i * 1.2), force = 0.55 * (1 - i / (nL2 * 0.8));
      if (sy < 0 || force <= 0) break;
      const onde = Math.round(Math.sin(y * 1.3) * 1.3);
      for (let x = Math.ceil(g); x < d; x++) {
        const so = (sy * W + Math.min(W - 1, Math.max(0, x + onde))) * 4;
        if (dta[so + 3] < 255 || bay(x, y) < (1 - force) * 7 || (i % 4 === 3 && bay(x, y) > 9)) continue;
        const o = (y * W + x) * 4;
        for (let q = 0; q < 3; q++) dta[o + q] = Math.round(dta[o + q] * (1 - force) + dta[so + q] * 0.82 * force);
      }
    }
    c.putImageData(img, 0, 0);

    // Chemin en S, du premier plan jusqu'à la cabane dans les sapins
    R.cabane = { x: Math.round(W * 0.845), y: R.horizon + Math.round(21 * R.k) };
    const masque = new Float32Array(W * H);
    const A = [W * 0.6, H + 4], B = [W * 0.63, H * 0.8], C2 = [W * 0.9, H * 0.8], D = [R.cabane.x - Math.round(9 * R.k), R.cabane.y + 1];
    for (let s = 0; s <= 1; s += 0.0012) {
      const u = 1 - s, b0 = u * u * u, b1 = 3 * u * u * s, b2 = 3 * u * s * s, b3 = s * s * s;
      const x = b0 * A[0] + b1 * B[0] + b2 * C2[0] + b3 * D[0], y = b0 * A[1] + b1 * B[1] + b2 * C2[1] + b3 * D[1];
      const prof = Math.max(0, (y - R.horizon) / (H - R.horizon));
      const rx = 1 + Math.pow(prof, 1.3) * 26, ry = Math.max(0.7, rx * 0.42);
      for (let yy = Math.floor(y - ry - 1); yy <= y + ry + 1; yy++) for (let xx = Math.floor(x - rx - 1); xx <= x + rx + 1; xx++) {
        if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
        const v = 1 - Math.hypot((xx - x) / rx, (yy - y) / ry), o = yy * W + xx;
        if (v > masque[o]) masque[o] = v;
      }
    }
    const rc = rng(19);
    for (let y = R.horizon; y < H; y++) for (let x = 0; x < W; x++) {
      const v = masque[y * W + x];
      if (v <= 0) continue;
      if (v < 0.22) { if (bay(x, y) > 5) pt(c, x, y, P.terreOmbre); continue; }
      pt(c, x, y, bay(x, y) > 13 || (v > 0.55 && v < 0.62 && bay(x, y) > 8) ? P.terreOmbre : P.terre);
      if (rc() < 0.006) { pt(c, x, y, P.roche); pt(c, x, y - 1, P.rocheClair); }
    }

    // Herbes aquatiques et affût : tout ce qui pousse ou repose dans l'eau, du fond vers l'avant
    const r2 = rng(14), plantes = [];
    const dansEau = (x, y) => { const l = R.lac[Math.round(y) - R.lacHaut]; return l && x > l[0] + 1 && x < l[1] - 1; };
    const touffe = (cx, cy, n, ex, ey, eviter) => {
      for (let i = 0; i < n; i++) {
        const x = Math.round(cx + (r2() - 0.5) * ex), y = Math.round(cy + (r2() - 0.5) * ey);
        if (!dansEau(x, y) || x > W * 0.325 || (eviter && eviter(x, y))) continue;
        const prof = (y - R.lacHaut) / (R.lacBas - R.lacHaut), t = r2();
        plantes.push({ x, y, h: Math.round((4 + prof * 9 + r2() * 5) * R.k), pench: (r2() - 0.5) * 1.8, type: t < 0.28 ? "massette" : t < 0.5 ? "phragmite" : "jonc" });
      }
    };
    const pieu = { x: R.pieuX, base: R.lacBas - 4, haut: R.lacBas - 4 - Math.round(13 * R.k) };
    R.pieuHaut = pieu.haut;
    touffe(pieu.x - 7, pieu.base, 12, 14, 6, (x, y) => Math.abs(x - pieu.x) < 5);
    touffe(pieu.x + 6, pieu.base + 1, 7, 10, 4, (x, y) => Math.abs(x - pieu.x) < 4);
    touffe(W * 0.15, R.lacBas - 3, 16, W * 0.07, 6);
    touffe(W * 0.07, R.lacHaut + 8, 9, W * 0.05, 8);
    touffe(R.affutX + 24 * R.k, R.lacHaut + Math.round(19 * R.k), 3, 12 * R.k, 3);
    plantes.sort((a, b) => a.y - b.y);
    const nenuphars = [];
    for (let i = 0; i < 7; i++) { const x = W * (0.19 + r2() * 0.12), y = R.lacHaut + 12 + r2() * (R.lacBas - R.lacHaut - 16); if (dansEau(x - 4, y) && dansEau(x + 4, y) && x < W * 0.32) nenuphars.push({ x: Math.round(x), y: Math.round(y), fleur: r2() < 0.35 }); }

    const tigeO = melange(P.roseau, "#000000", 0.3), tigeC = melange(P.roseau, "#FFFFFF", 0.2), refl = melange(P.eauSombre, P.roseau, 0.35);
    const plume = teinter("#B79C70"), plumeO = teinter("#8C7250"), massC = melange(P.massette, "#FFFFFF", 0.22);
    function plante(p) {
      const { x, y, h, pench, type } = p, xt = t => x + Math.round(pench * t * t * 3);
      for (let j = 1; j < h * 0.45; j++) if (j % 3 !== 2) pt(c, x - Math.round(pench * (j / h) ** 2 * 3), y + j, refl); // reflet
      if (r2() < 0.35) px(c, x - 1, y + 1, 3, 1, P.eauClair);                                                          // ride au pied
      for (let j = 0; j < h; j++) { const t = j / h; pt(c, xt(t), y - j, t > 0.72 ? tigeC : j % 4 === 0 ? tigeO : P.roseau); }
      if (h > 6) { // feuille qui part de la tige et retombe
        const j0 = Math.round(h * (0.25 + r2() * 0.25)), s = r2() < 0.5 ? -1 : 1, lf = Math.round(h * 0.45);
        for (let i = 1; i <= lf; i++) pt(c, xt(j0 / h) + s * i, y - j0 - Math.round(i * 0.9) + Math.round(i * i / (lf * 0.9)), i > lf * 0.6 ? tigeO : P.roseau);
      }
      if (type === "massette") { const hx = xt(0.78), hy = y - Math.round(h * 0.78); px(c, hx, hy - 3, 2, 4, P.massette); pt(c, hx, hy - 3, massC); }
      if (type === "phragmite") for (let i = 0; i < 4; i++) for (let k = -1; k <= 1; k++) if (bay(x + k, y - i) > 4 - i) pt(c, xt(1) + k + Math.round(pench * i * 0.4), y - h - i + 1, i > 1 ? plume : plumeO);
    }
    function nenuphar(n) {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -4; dx <= 4; dx++) {
        if ((dx / 4.4) ** 2 + dy * dy > 1.1 || (dx === 1 && dy === 1)) continue;
        pt(c, n.x + dx, n.y + dy, dy < 0 || dx < -2 ? P.herbeC : P.herbe);
      }
      px(c, n.x - 3, n.y + 2, 7, 1, P.eauSombre);
      if (n.fleur) { const b = teinter("#F6F1E6"); pt(c, n.x - 1, n.y - 1, b); pt(c, n.x + 1, n.y - 1, b); pt(c, n.x, n.y - 2, b); pt(c, n.x, n.y - 1, teinter("#F2C230")); }
    }

    // Affût sur pilotis : façade en planches, pan latéral, volet de guet relevé, toit en bardeaux, reflet dans l'eau
    const k = R.k, ax = R.affutX, lw = Math.round(24 * k), lh = Math.round(14 * k), pil = Math.round(8 * k), cote = Math.round(5 * k), toit = Math.round(7 * k);
    const ay = R.lacHaut + Math.round(9 * k), ligneEau = ay + pil;
    const clair = melange(P.bois, "#FFFFFF", 0.14), sombre = melange(P.boisOmbre, "#000000", 0.25);
    const tA = melange(P.boisOmbre, P.roche, 0.25), tC = melange(P.bois, P.roche, 0.3), tS = melange(P.boisOmbre, "#000000", 0.3);
    for (const n of nenuphars) if (n.y < ligneEau) nenuphar(n);
    for (const p of plantes) if (p.y < ligneEau) plante(p);
    const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
    const g = tmp.getContext("2d");
    for (const xx of [ax + 1, ax + Math.round(lw / 2) - 1, ax + lw - 3, ax + lw + cote - 2]) { px(g, xx, ay, 2, pil, P.boisOmbre); px(g, xx, ay, 1, pil, P.bois); }
    ligne(g, ax + 3, ay + 1, ax + Math.round(lw / 2) - 2, ligneEau - 2, sombre); ligne(g, ax + Math.round(lw / 2) - 2, ay + 1, ax + 3, ligneEau - 2, sombre);
    ligne(g, ax + Math.round(lw / 2) + 1, ay + 1, ax + lw - 4, ligneEau - 2, sombre); ligne(g, ax + lw - 4, ay + 1, ax + Math.round(lw / 2) + 1, ligneEau - 2, sombre);
    polygone(g, [[ax + lw, ay - lh], [ax + lw + cote, ay - lh - 2], [ax + lw + cote, ay - 1], [ax + lw, ay - 1]], x => (x - ax) % 3 === 0 ? sombre : P.boisOmbre);
    for (let x = ax; x < ax + lw; x++) for (let y = ay - lh; y < ay - 1; y++) {
      const m = (x - ax) % 3;
      let col = m === 2 ? P.boisOmbre : m === 0 ? clair : P.bois;
      if (bay(x, y) === 0 && (x * 3 + y) % 7 === 0) col = P.boisOmbre;           // nœuds du bois
      if (y > ay - 4 && bay(x, y) > 11) col = melange(P.boisOmbre, P.herbe, 0.4); // bas des planches verdi par l'humidité
      pt(g, x, y, col);
    }
    px(g, ax - 2, ay - 1, lw + cote + 3, 2, P.boisOmbre); px(g, ax - 2, ay - 1, lw + cote + 3, 1, clair);
    const fy = ay - lh + Math.round(6 * k), fh = Math.max(2, Math.round(2.5 * k));
    px(g, ax + 3, fy, lw - 6, fh, "#16110C");
    px(g, ax + 2, fy + fh, lw - 4, 1, clair);
    polygone(g, [[ax + 2, fy], [ax + lw - 2, fy], [ax + lw - 1, fy - 3], [ax + 3, fy - 3]], (x, y) => y <= fy - 3 ? clair : (x - ax) % 4 === 0 ? P.boisOmbre : P.bois);
    ligne(g, ax + 4, fy + fh - 1, ax + 4, fy, sombre); ligne(g, ax + lw - 5, fy + fh - 1, ax + lw - 5, fy, sombre);
    pt(g, ax + Math.round(lw * 0.62), fy + 1, teinter("#A9C2D4")); pt(g, ax + Math.round(lw * 0.62) + 2, fy + 1, teinter("#A9C2D4")); // reflet de jumelles
    px(g, ax, ay - lh, lw, 1, sombre);
    for (let j = 0; j < toit; j++) {
      const y = ay - lh - toit + j, retrait = Math.round((toit - 1 - j) * 0.8);
      for (let xx = ax - 3 + retrait; xx <= ax + lw + cote + 2 - retrait; xx++) {
        let col = j < toit * 0.4 ? tC : tA;
        if ((xx + (j % 2) * 2) % 4 === 0) col = tS;
        if (j === toit - 1) col = tS;
        if (j < 3 && bay(xx, y) > 12) col = P.sapinC;
        pt(g, xx, y, col);
      }
    }
    // reflet de l'affût, coupé par les rides
    const haut = ay - lh - toit, x0 = ax - 4, larg = lw + cote + 8;
    c.globalAlpha = 0.32;
    for (let i = 1; ligneEau + i - 1 < R.lacBas && ligneEau - i >= haut; i++) {
      if (i % 3 === 2) continue;
      const dy = ligneEau + i - 1, [lg, ld] = R.lac[dy - R.lacHaut], onde = Math.round(Math.sin(dy * 1.4) * 1.2);
      const a = Math.max(x0, Math.ceil(lg)), b = Math.min(x0 + larg, Math.floor(ld));
      if (b > a) c.drawImage(tmp, a, ligneEau - i, b - a, 1, a + onde, dy, b - a, 1);
    }
    c.globalAlpha = 1;
    c.drawImage(tmp, 0, 0);
    for (const xx of [ax + 1, ax + Math.round(lw / 2) - 1, ax + lw - 3, ax + lw + cote - 2]) px(c, xx - 1, ligneEau, 4, 1, P.eauClair);
    // passerelle vers la rive proche, en perspective
    const finY = R.lacBas + 2;
    for (let y = ay; y <= finY; y++) {
      const t = (y - ay) / (finY - ay), w = Math.round(4 + t * 6 * k), cx = ax + 1 - t * 16 * k, gx = Math.round(cx - w / 2);
      const planche = Math.floor((y - ay) / (1.5 + t * 1.5)) % 2;
      px(c, gx, y, w, 1, planche ? P.bois : clair);
      pt(c, gx, y, clair); pt(c, gx + w - 1, y, P.boisOmbre);
      if (y < R.lacBas) px(c, gx + w, y, 1, 1, P.eauSombre);
      if ((y - ay) % 7 === 6) { px(c, gx, y + 1, 1, 3, sombre); px(c, gx + w - 1, y + 1, 1, 3, sombre); }
    }
    for (const n of nenuphars) if (n.y >= ligneEau) nenuphar(n);

    // Piquet du martin-pêcheur, près de la rive, dans l'eau
    for (const p of plantes) if (p.y >= ligneEau && p.y < pieu.base) plante(p);
    for (let j = 1; j < 7; j++) if (j % 3 !== 2) px(c, pieu.x, pieu.base + j, 3, 1, refl);
    px(c, pieu.x - 2, pieu.base + 1, 7, 1, P.eauClair);
    px(c, pieu.x, pieu.haut, 3, pieu.base - pieu.haut, P.boisOmbre);
    px(c, pieu.x, pieu.haut, 1, pieu.base - pieu.haut, P.bois);
    px(c, pieu.x + 2, pieu.haut, 1, pieu.base - pieu.haut, sombre);
    px(c, pieu.x, pieu.haut, 3, 1, clair);
    for (let y = pieu.base - 3; y < pieu.base; y++) pt(c, pieu.x + (y % 2), y, melange(P.boisOmbre, P.herbe, 0.5));
    for (const p of plantes) if (p.y >= pieu.base) plante(p);

    // Lisière à droite et cabane, dessinées du fond vers l'avant
    const r3 = rng(8), cab = R.cabane, cw = Math.round(26 * R.k), elems = [];
    for (let x = W * 0.72; x < W + 8; x += 5 + Math.floor(r3() * 6)) elems.push({ x, base: R.horizon + 9 + r3() * 16, h: (24 + r3() * 26) * R.k });
    elems.push({ x: cab.x + 6, base: cab.y - 5, h: 56 * R.k, garde: true }, { x: cab.x - cw * 0.6, base: cab.y - 3, h: 42 * R.k, garde: true });
    elems.push({ x: cab.x + cw * 0.62, base: cab.y + 4, h: 36 * R.k, garde: true }, { cabane: true, base: cab.y });
    elems.sort((a, b) => a.base - b.base);
    const dansLac = (x, y) => { const i = Math.round(y) - R.lacHaut, l = R.lac[i]; return l && x > l[0] - 4 && x < l[1] + 4; };
    elems.forEach((e, i) => {
      if (e.cabane) { cabane(c, cab.x, cab.y); return; }
      if (!e.garde) {
        if (Math.abs(e.x - cab.x) < cw * 0.75 && e.base > cab.y - 12) return;
        let surChemin = false;
        for (let dx = -2; dx <= 2; dx++) for (let dy = -6; dy <= 1; dy++) { const xx = Math.round(e.x) + dx, yy = Math.round(e.base) + dy; if (xx >= 0 && xx < W && masque[yy * W + xx] > 0) surChemin = true; }
        if (surChemin || dansLac(e.x, e.base)) return;
      }
      sapin(c, e.x, e.base, e.h, rng(300 + i));
    });
  }

  function construireSol(c) {
    c.clearRect(0, 0, W, H);
    // Sol du premier plan : bord bosselé, taches de lumière et d'ombre, coins de terre
    for (let x = 0; x < W; x++) {
      const haut = R.contour(x);
      for (let y = haut; y < H; y++) {
        const v = Math.sin(x * 0.13 + y * 0.29) + Math.sin(x * 0.051 - y * 0.17 + 1.3) + Math.sin(x * 0.31 + y * 0.07) * 0.5;
        let col = P.herbe;
        if (v > 1.2 && bay(x, y) > 9) col = P.herbeC;
        else if (v < -1.2 && bay(x, y) > 7) col = P.prairieOmbre;
        if (y === haut || (y === haut + 1 && bay(x, y) > 7)) col = P.herbeC;
        pt(c, x, y, col);
      }
    }
    const r = rng(77);
    // Plaques de terre et cailloux
    for (let i = 0; i < W / 90; i++) {
      const cx = r() * W, cy = R.sol + 10 + r() * (H - R.sol - 12), l = 4 + r() * 8;
      for (let x = -l; x <= l; x++) for (let y = -2; y <= 2; y++) if ((x / l) ** 2 + (y / 2.5) ** 2 < 1) pt(c, cx + x, cy + y, y < 0 ? P.terreOmbre : P.terre);
      if (r() < 0.6) { pt(c, cx + 2, cy, P.rocheClair); pt(c, cx + 3, cy, P.roche); }
    }
    // Touffes d'herbe irrégulières, plus quelques graminées en épi
    for (let x = 0; x < W; x += 1 + Math.floor(r() * 3)) {
      const base = R.contour(x) + 1;
      const n = 1 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const h = 2 + Math.floor(r() * 6), pente = r() < 0.5 ? -1 : 1;
        for (let j = 0; j < h; j++) pt(c, x + k + (j > h * 0.6 ? pente : 0), base - j, j > h - 2 ? P.herbeC : (r() < 0.5 ? P.herbe : P.prairieOmbre));
      }
      if (r() < 0.06) { const h = 9 + Math.floor(r() * 6); px(c, x, base - h, 1, h, P.herbe); px(c, x, base - h - 2, 1, 3, P.terre); pt(c, x + 1, base - h - 1, P.terre); }
    }
    // Fleurs, en petits massifs de la même espèce
    for (let i = 0; i < W / 10; i++) {
      const cx = r() * W;
      if (cx > W * 0.36 && cx < W * 0.64 && r() < 0.5) continue;
      const type = TYPES_FLEURS[Math.floor(r() * TYPES_FLEURS.length)];
      const n = 3 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const x = cx + (r() - 0.5) * 14;
        const y = Math.max(R.contour(x) + 2, R.sol + 4 + r() * (H - R.sol - 8));
        FLEURS[type](c, Math.round(x), Math.round(y));
      }
    }
  }

  function construireAvant(c) {
    c.clearRect(0, 0, W, H);
    // Sapins du premier plan à droite, la tente reste à l'écart
    const r4 = rng(31);
    sapin(c, W * 1.0, R.contour(W - 1) + 10, 150 * R.k, r4);
    sapin(c, W * 0.97, R.contour(W * 0.97) + 8, 100 * R.k, r4);

    // Tente canadienne vue de trois quarts : façade éclairée, pan latéral à l'ombre, haubans
    const tx = R.tenteX, ty = R.contour(tx) + 2, th = Math.round(22 * R.k), dem = Math.round(th * 0.85), dep = Math.round(th * 0.95);
    const sommet = [tx, ty - th], fond = [tx + dep, ty - th + 3];
    const tClair = melange(P.tente, "#FFFFFF", 0.14), tOmbreF = melange(P.tenteOmbre, "#000000", 0.22), corde = teinter("#D9CDB4");
    for (let x = tx - dem - 3; x < tx + dep + dem + 4; x++) { pt(c, x, ty, P.terreOmbre); if (bay(x, ty + 1) > 6) pt(c, x, ty + 1, P.terreOmbre); }
    polygone(c, [sommet, fond, [tx + dep + dem, ty - 1], [tx + dem, ty]], (x, y) => {
      if ((x - tx) % 6 === 0) return tOmbreF;                       // coutures du pan
      return y > ty - 3 ? tOmbreF : P.tenteOmbre;
    });
    ligne(c, sommet[0], sommet[1], fond[0], fond[1], P.tente);      // faîte éclairé
    polygone(c, [sommet, [tx + dem + 1, ty], [tx - dem, ty]], (x, y) => {
      const u = (x - tx) / Math.max(1, (y - sommet[1]) * dem / th);
      if (y >= ty - 1) return P.tenteOmbre;                          // ourlet
      return u + (bay(x, y) - 7.5) / 30 < -0.35 ? tClair : P.tente;
    });
    ligne(c, sommet[0], sommet[1], tx + dem, ty - 1, tOmbreF);
    // Porte ouverte, rabat noué sur le côté
    const pH = Math.round(th * 0.62), pD = Math.round(dem * 0.42);
    polygone(c, [[tx, ty - pH], [tx + pD + 1, ty], [tx - pD, ty]], () => "#24180F");
    polygone(c, [[tx, ty - pH], [tx - pD, ty], [tx - Math.round(dem * 0.7), ty - Math.round(th * 0.22)]], (x, y) => (y - ty) % 3 === 0 ? P.tenteOmbre : tClair);
    pt(c, tx - Math.round(dem * 0.62), ty - Math.round(th * 0.3), corde);
    // Mâts, haubans et piquets
    px(c, tx, ty - th - 3, 1, 3, P.bois); px(c, fond[0], fond[1] - 3, 1, 3, P.bois);
    ligne(c, tx, ty - th - 2, tx - dem - 6, ty, corde); px(c, tx - dem - 6, ty - 1, 1, 2, P.bois);
    ligne(c, fond[0], fond[1] - 2, fond[0] + dem + 5, ty - 1, corde); px(c, fond[0] + dem + 5, ty - 2, 1, 2, P.bois);
    for (let x = tx + dem + 3; x < tx + dep + dem; x += 6) pt(c, x, ty, P.bois);
    // Sac à dos posé contre la tente
    const sx = tx - dem - 2, sy = ty;
    px(c, sx - 3, sy - 7, 5, 7, teinter("#4E6B3A")); px(c, sx - 3, sy - 7, 2, 7, teinter("#628548"));
    px(c, sx - 3, sy - 8, 5, 1, teinter("#3A5230")); px(c, sx - 2, sy - 4, 3, 2, teinter("#3A5230")); pt(c, sx, sy - 6, teinter("#C9A040"));

    // Foyer : pierres, bûche-banc, bois empilé
    const fx = R.feuX, fy = R.feuY;
    px(c, fx - 26, fy - 2, 14, 4, P.bois); px(c, fx - 26, fy - 2, 2, 4, P.boisOmbre);
    for (let i = -7; i <= 7; i += 3) px(c, fx + i, fy + 1, 2, 2, P.roche);
    px(c, fx - 4, fy - 1, 9, 2, P.boisOmbre);
    for (let i = 0; i < 3; i++) px(c, fx + 14, fy - 1 - i * 2, 7, 2, i % 2 ? P.bois : P.boisOmbre);

    // Deux arbres d'automne à gauche, troncs courbes, racines posées sur l'herbe
    const xa = W * 0.055, xb = W * 0.15;
    R.arbreB = arbre(c, xb, R.contour(xb) + 4, H * 0.43, 12, 0.05);
    R.arbreA = arbre(c, xa, R.contour(xa) + 5, H * 0.6, 7, -0.05);

    // Loge de la chouette dans le tronc du grand arbre
    const tA = R.arbreA.tronc;
    R.loge = tA[Math.floor(tA.length * 0.8)];
    for (let y = -4; y <= 4; y++) for (let x = -3; x <= 3; x++) if ((x / 3.2) ** 2 + (y / 4.4) ** 2 < 1) pt(c, R.loge.x + x, R.loge.y + y, y < -2 ? P.troncOmbre : "#140E0A");
    R.picPos = tA[Math.floor(tA.length * 0.45)];

    // Perchoir de la mésange : la branche la plus horizontale de l'arbre de droite
    let meilleure = null;
    for (const b of R.arbreB.branches) {
      if (b.prof !== 2) continue;
      const score = Math.abs(Math.sin(b.a));
      if (!meilleure || score > meilleure.score) meilleure = { ...b, score };
    }
    R.perchoir = meilleure ? { x: meilleure.x0 + (meilleure.x1 - meilleure.x0) * 0.55, y: meilleure.y0 + (meilleure.y1 - meilleure.y0) * 0.55 } : { x: xb, y: H * 0.5 };

    // Bords : rochers, fougères, digitales, amanites
    rocher(c, W * 0.245, R.contour(W * 0.245) + 6, 20, 10);
    rocher(c, W * 0.275, R.contour(W * 0.275) + 7, 9, 5);
    fougere(c, W * 0.115, R.contour(W * 0.115) + 4, 13, -1); fougere(c, W * 0.12, R.contour(W * 0.12) + 4, 11, 1);
    for (let i = 0; i < 4; i++) digitale(c, W * 0.012 + i * 4, R.contour(W * 0.012 + i * 4) + 3 + (i % 2) * 2, 15 + (i % 3) * 4);
    champignon(c, xa + 14, R.contour(xa + 14) + 5);
    champignon(c, xa + 20, R.contour(xa + 20) + 6);
    rocher(c, W * 0.67, R.contour(W * 0.67) + 7, 14, 7);
    for (let i = 0; i < 3; i++) digitale(c, W * 0.88 + i * 5, R.contour(W * 0.88 + i * 5) + 4 + (i % 2) * 2, 13 + (i % 2) * 5);
    fougere(c, W * 0.86, R.contour(W * 0.86) + 4, 11, 1);
  }

  function construire() {
    construireCiel(plans.ciel.x);
    construirePaysage(plans.paysage.x);
    construireSol(plans.sol.x);
    construireAvant(plans.avant.x);
  }

  // ---------- Éléments animés ----------
  const anim = {};
  function initAnim() {
    const r = rng(101);
    anim.nuages = Array.from({ length: 6 }, (_, i) => ({ x: r() * W, y: 6 + r() * H * 0.2, l: 22 + r() * 40, v: 0.6 + r() * 1.2, graine: 500 + i }));
    anim.lointains = [];
    for (let g = 0; g < 4; g++) {
      const n = 1 + Math.floor(r() * 3), x = r() * W, y = H * 0.06 + r() * H * 0.24, v = (1.5 + r() * 2.5) * (r() < 0.5 ? -1 : 1);
      for (let i = 0; i < n; i++) anim.lointains.push({ x: x - Math.sign(v) * i * (6 + r() * 3), y: y + i * 3 + r() * 2, v, p: r() * 6.28 });
    }
    anim.etoiles = Array.from({ length: Math.round(W * H / 500) }, () => ({ x: r() * W, y: r() * R.horizon, p: r() * 6.28, v: 0.8 + r() * 1.6, vif: r() < 0.15 }));
    anim.brins = Array.from({ length: Math.round(W / 4) }, () => { const x = r() * W; return { x, h: 3 + Math.floor(r() * 6), p: r() * 6.28, clair: r() < 0.4 }; });
    anim.volee = null; anim.heron = null; anim.fumee = []; anim.feuilles = [];
    anim.prochaineVolee = 2; anim.prochainHeron = 7;
    anim.rouge = { x: Math.round(W * 0.12), dir: 1, pas: 0, attente: 1 };
    anim.mesange = { dir: 1, attente: 2, picore: 0 };
    anim.pic = { coups: 0, attente: 2 };
    anim.martin = { attente: 3, bob: 0 };
    anim.chouette = { cligne: 0 };
    anim.chauves = [0, 1].map(i => ({ p: i * 3.1 }));
  }

  // Nuages en cumulus : réunion de boules éclairées par le haut, base plate à l'ombre
  function nuageSprite(n) {
    const r = rng(n.graine), l = Math.round(n.l), hmax = Math.round(l * 0.4) + 4, base = hmax - 1;
    const cv = document.createElement("canvas"); cv.width = l + 6; cv.height = hmax;
    const g = cv.getContext("2d"), boules = [], nb = 3 + Math.floor(l / 12);
    for (let i = 0; i < nb; i++) {
      const t = (i + 0.5) / nb, rad = (0.45 + 0.55 * Math.sin(t * Math.PI)) * l * 0.21 + r() * 2.5;
      boules.push({ x: 3 + t * l + (r() - 0.5) * 3, y: base - rad * (0.45 + r() * 0.35), r: rad });
    }
    const mi = melange(P.nuage, P.nuageOmbre, 0.5);
    for (let y = 0; y <= base; y++) for (let x = 0; x < cv.width; x++) {
      let lum = -9;
      for (const b of boules) {
        const dx = x - b.x, dy = y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) lum = Math.max(lum, (-dy - dx * 0.3) / b.r);
      }
      if (lum === -9) continue;
      lum += (bay(x, y) - 7.5) / 24 - (y > base - 2 ? 0.8 : 0);
      pt(g, x, y, lum > 0.05 ? P.nuage : lum > -0.5 ? mi : P.nuageOmbre);
    }
    n.sprite = cv; n.moment = moment;
  }
  function nuage(c, n) {
    if (n.moment !== moment || !n.sprite) nuageSprite(n);
    c.drawImage(n.sprite, Math.round(n.x), Math.round(n.y));
  }

  // Oiseaux lointains : de simples traits qui battent des ailes puis planent
  const VOL = [[[-2, -2], [-1, -1], [0, 0], [1, -1], [2, -2]], [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]], [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]]];
  function lointains(c, dt) {
    const col = moment === "nuit" ? "#060914" : melange(P.montOmbre, "#000000", 0.45);
    for (const o of anim.lointains) {
      o.x += o.v * dt;
      if (o.x > W + 12) o.x = -12; else if (o.x < -12) o.x = W + 12;
      const plane = Math.sin(tps * 0.6 + o.p) > 0.25;
      const f = plane ? 1 : [0, 1, 2, 1][Math.floor(tps * 4.5 + o.p * 3) % 4];
      const y = o.y + Math.sin(tps * 0.4 + o.p) * 3;
      for (const [dx, dy] of VOL[f]) pt(c, o.x + dx, y + dy, col);
    }
  }

  let derniere = 0, tps = 0, fige = false;
  const reduit = matchMedia("(prefers-reduced-motion: reduce)");

  function image(maintenant) {
    const dt = fige ? 0 : Math.min(0.05, (maintenant - derniere) / 1000 || 0);
    derniere = maintenant;
    tps += dt;
    const c = ctx;
    const journe = moment !== "nuit";

    // 1. Ciel, étoiles et nuages : tout ce qui est derrière les montagnes
    c.drawImage(plans.ciel.c, 0, 0);
    if (P.etoile) for (const e of anim.etoiles) {
      const v = Math.sin(tps * e.v + e.p);
      if (moment === "nuit" ? v > -0.5 : (v > 0.7 && e.y < R.horizon * 0.3)) {
        pt(c, e.x, e.y, P.etoile);
        if (e.vif && v > 0.85) { pt(c, e.x - 1, e.y, P.etoile); pt(c, e.x + 1, e.y, P.etoile); pt(c, e.x, e.y - 1, P.etoile); pt(c, e.x, e.y + 1, P.etoile); }
      }
    }
    for (const n of anim.nuages) { n.x += n.v * dt; if (n.x > W + 10) n.x = -n.l - 10; nuage(c, n); }
    lointains(c, dt);

    // 2. Paysage
    c.drawImage(plans.paysage.c, 0, 0);
    if (moment === "aube") {
      const milieu = R.lacHaut + 3;
      for (let y = R.lacHaut - 3; y < R.lacHaut + 10; y++) for (let x = Math.round(W * 0.04); x < W * 0.72; x++) {
        if (bay(x, y) > 12 + Math.abs(y - milieu) * 0.7 + Math.sin((x + tps * 5) / 11) * 2.5) pt(c, x, y, P.nuage);
      }
    }
    for (let k = 0; k < 22; k++) {
      const ligne = 3 + (k * 7) % (R.lacBas - R.lacHaut - 5);
      const [g, d] = R.lac[ligne];
      const x = g + 4 + ((k * 53 + tps * (4 + k % 3)) % Math.max(10, d - g - 10));
      if (Math.sin(tps * 2 + k) > -0.3) px(c, x, R.lacHaut + ligne, 3 + (k % 3), 1, P.eauClair);
    }

    // Grues cendrées en V et héron : ils passent derrière les arbres du premier plan
    if (!journe) { anim.volee = null; anim.heron = null; }
    if (journe && !anim.volee && tps > anim.prochaineVolee) anim.volee = { x: W + 30, y: H * 0.08 + Math.random() * H * 0.1 };
    if (anim.volee) {
      const v = anim.volee; v.x -= dt * 16;
      for (let i = 0; i < 5; i++) {
        const rang = Math.abs(i - 2);
        oiseau(c, "grue", Math.floor(tps * 4 + i * 1.3), v.x + rang * 24, v.y + rang * 10);
      }
      if (v.x < -150) { anim.volee = null; anim.prochaineVolee = tps + 14 + Math.random() * 8; }
    }
    if (journe && !anim.heron && tps > anim.prochainHeron) anim.heron = { x: -30, y: R.horizon - H * 0.12 };
    if (anim.heron) {
      const h = anim.heron; h.x += dt * 11;
      oiseau(c, "heron", Math.floor(tps * 2.4), h.x, h.y + Math.sin(tps * 1.2) * 1.5, true);
      if (h.x > W + 30) { anim.heron = null; anim.prochainHeron = tps + 18 + Math.random() * 10; }
    }

    // Martin-pêcheur sur son pieu
    const mp = anim.martin;
    mp.attente -= dt;
    if (mp.attente <= 0) { mp.bob = 0.5; mp.attente = 2 + Math.random() * 3; }
    mp.bob = Math.max(0, mp.bob - dt);
    if (journe) oiseau(c, "martin", mp.bob > 0 ? 1 : 0, R.pieuX - 5, R.pieuHaut - 9 + (mp.bob > 0.25 ? 1 : 0));

    // 3. Sol et herbes qui ondulent
    c.drawImage(plans.sol.c, 0, 0);
    for (const b of anim.brins) {
      const base = R.contour(b.x) + 1;
      for (let j = 0; j < b.h; j++) {
        const vent = Math.round(Math.sin(tps * 1.6 + b.x * 0.15 + b.p * 0.2) * (j / b.h) * 1.6);
        pt(c, b.x + vent, base - j, j > b.h - 2 && b.clair ? P.herbeC : P.herbe);
      }
    }

    // 4. Premier plan : arbres, tente, sapins
    c.drawImage(plans.avant.c, 0, 0);

    // Pic épeiche qui tambourine sur le grand tronc
    const pk = anim.pic;
    pk.attente -= dt;
    if (pk.attente <= 0 && pk.coups === 0) pk.coups = 12;
    let decal = 0;
    if (pk.coups > 0) { decal = Math.floor(tps * 18) % 2; if (decal === 0 && Math.random() < 0.35) pk.coups--; if (pk.coups === 0) pk.attente = 3 + Math.random() * 4; }
    if (journe) oiseau(c, "pic", 0, R.picPos.x + R.picPos.w / 2 - 1 - decal, R.picPos.y - 8);

    // Mésange bleue sur sa branche
    const ms = anim.mesange;
    ms.attente -= dt;
    if (ms.attente <= 0) { if (Math.random() < 0.5) ms.dir *= -1; else ms.picore = 0.6; ms.attente = 1.2 + Math.random() * 2; }
    ms.picore = Math.max(0, ms.picore - dt);
    if (journe) oiseau(c, "mesange", ms.picore > 0 ? 1 : 0, R.perchoir.x - 7, R.perchoir.y - 12, ms.dir < 0);

    // Rougegorge qui sautille entre les deux arbres
    const rg = anim.rouge;
    rg.attente -= dt;
    let saut = 0, img = 0;
    if (rg.attente <= 0) {
      rg.pas += dt * 4;
      saut = -Math.round(Math.abs(Math.sin(rg.pas * Math.PI)) * 3);
      rg.x += rg.dir * dt * 14;
      img = 1;
      if (rg.pas >= 3) { rg.pas = 0; rg.attente = 1 + Math.random() * 2.5; if (rg.x > W * 0.17 || rg.x < W * 0.1) rg.dir *= -1; else if (Math.random() < 0.3) rg.dir *= -1; }
    }
    if (journe) oiseau(c, "rougegorge", img, rg.x, R.contour(rg.x + 8) - 12 + saut, rg.dir < 0);

    // Nuit : la chouette sort de sa loge, chauves-souris
    if (!journe) {
      const ch = anim.chouette;
      ch.cligne -= dt;
      if (ch.cligne < -3.5) ch.cligne = 0.18;
      oiseau(c, "chouette", ch.cligne > 0 ? 1 : 0, R.loge.x - 6, R.loge.y - 8);
      for (const b of anim.chauves) {
        const t = tps * 0.6 + b.p;
        oiseau(c, "chauvesouris", Math.floor(tps * 8 + b.p), W * 0.82 + Math.sin(t) * W * 0.1, H * 0.25 + Math.sin(t * 2.3) * H * 0.07);
      }
    }

    // Feu de camp (soir et nuit), lueur, braises et fumée
    const feuAllume = moment === "soir" || moment === "nuit";
    const fx = R.feuX, fy = R.feuY;
    if (feuAllume) {
      const r = 26 + Math.sin(tps * 9) * 1.5;
      for (let y = -r; y <= r; y++) for (let x = -r * 1.4; x <= r * 1.4; x++) {
        const d = Math.sqrt((x / 1.4) ** 2 + y * y) / r;
        if (d < 1 && bay(Math.round(x), Math.round(y)) > 6 + d * 10) pt(c, fx + x, fy - 4 + y, "rgba(255,179,71,.3)");
      }
      const flammes = ["#FFE27A", "#F7A83A", "#E0562A"];
      for (let i = -3; i <= 3; i++) {
        const h = Math.max(1, Math.round(8 - Math.abs(i) * 1.7 + Math.sin(tps * 13 + i * 2.1) * 2));
        for (let j = 0; j < h; j++) pt(c, fx + i, fy - 2 - j, flammes[Math.min(2, Math.floor((j / h) * 3 + (Math.abs(i) > 1 ? 1 : 0)))]);
      }
      if (dt && Math.random() < 0.15) anim.fumee.push({ x: fx + (Math.random() - 0.5) * 4, y: fy - 10, v: 0, braise: true });
    }
    if (dt && Math.random() < (feuAllume ? 0.25 : 0.05)) anim.fumee.push({ x: fx, y: fy - 8, v: 0 });
    anim.fumee = anim.fumee.filter(f => { f.v += dt; f.y -= dt * (f.braise ? 16 : 9); f.x += Math.sin(f.v * 2 + f.y) * dt * 4 + dt * 3; return f.v < (f.braise ? 1.2 : 4); });
    for (const f of anim.fumee) {
      if (f.braise) { pt(c, f.x, f.y, "#FFB347"); continue; }
      if (bay(Math.floor(f.x), Math.floor(f.y)) > f.v * 3.5) px(c, f.x, f.y, f.v > 2 ? 2 : 1, f.v > 2 ? 2 : 1, moment === "nuit" ? "#5A6380" : "#C9C3BA");
    }

    // Feuilles d'automne qui tombent des deux arbres
    if (dt && Math.random() < 0.03) {
      const bouts = Math.random() < 0.6 ? R.arbreA.bouts : R.arbreB.bouts;
      const b = bouts[Math.floor(Math.random() * bouts.length)];
      if (b) anim.feuilles.push({ x: b.x, y: b.y, p: Math.random() * 6 });
    }
    anim.feuilles = anim.feuilles.filter(f => { f.y += dt * 10; f.x += Math.sin(tps * 2 + f.p) * dt * 8; return f.y < R.contour(f.x) + 4; });
    for (const f of anim.feuilles) px(c, f.x, f.y, Math.sin(tps * 4 + f.p) > 0 ? 2 : 1, 1, Math.sin(tps * 3 + f.p) > 0 ? P.feuilleA : P.feuilleB);

    requestAnimationFrame(image);
  }

  // ---------- Moment de la journée ----------
  // Suit l'heure de Paris ; ?moment=aube|jour|soir|nuit force un moment (pratique pour tester).
  const force = new URLSearchParams(location.search).get("moment");
  const choix = PAL[force] ? force : "auto";
  function momentReel() {
    const h = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()));
    if (h >= 6 && h < 9) return "aube";
    if (h >= 9 && h < 17) return "jour";
    if (h >= 17 && h < 20) return "soir";
    return "nuit";
  }
  function appliquer() {
    const m = choix === "auto" ? momentReel() : choix;
    if (m === moment && plans.ciel.c.width === W && R.lac) return;
    moment = m;
    P = PAL[moment];
    document.documentElement.dataset.moment = moment;
    construire();
  }

  // Bouton pour figer le décor ; figé d'office si l'on préfère moins d'animations
  const bFiger = document.getElementById("figer-decor");
  function figer(v) { fige = v; if (bFiger) bFiger.setAttribute("aria-pressed", String(v)); }
  if (bFiger) bFiger.addEventListener("click", () => { figer(!fige); try { localStorage.setItem("piafle-decor-fige", fige ? "1" : "0"); } catch (_) {} });
  let pref = null;
  try { pref = localStorage.getItem("piafle-decor-fige"); } catch (_) {}
  figer(pref ? pref === "1" : reduit.matches);

  dimensionner();
  appliquer();
  initAnim();
  // Sur téléphone, la barre d'adresse qui se replie change la hauteur : on ne reconstruit
  // le décor que si la largeur change ou si la hauteur varie franchement.
  let largeur = innerWidth, hauteur = innerHeight, minuterie = 0;
  addEventListener("resize", () => {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => {
      if (innerWidth === largeur && Math.abs(innerHeight - hauteur) < 150) return;
      largeur = innerWidth; hauteur = innerHeight;
      dimensionner(); construire(); initAnim();
    }, 150);
  });
  setInterval(appliquer, 60000);
  requestAnimationFrame(image);
})();
