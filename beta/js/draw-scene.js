'use strict';
// Glutfrost – Zeichnen: Boden, Szene, Overlays, HUD
// =====================================================================
//  ZEICHNEN – Boden
// =====================================================================
function drawGround(t) {
  screenT();
  ctx.fillStyle = '#e6eef5'; ctx.fillRect(0, 0, W, H);
  groundT();
  // Schneehügel
  for (const m of mounds) ell(m.x, m.y, m.r, m.r * .7, 'rgba(255,255,255,.55)');
  // Zonen
  ctx.fillStyle = '#f3f7fb'; ctx.fillRect(FIELD.x0, FIELD.y0, FIELD.x1 - FIELD.x0, FIELD.y1 - FIELD.y0);
  ctx.fillStyle = '#eef4f8'; ctx.fillRect(FOREST.x0, FOREST.y0, FOREST.x1 - FOREST.x0, FOREST.y1 - FOREST.y0);
  ctx.fillStyle = S.own.mine ? '#e3e6ea' : '#e9edf0'; ctx.fillRect(MINE.x0, MINE.y0, MINE.x1 - MINE.x0, MINE.y1 - MINE.y0);
  // Siedlung, Steinbruch, Eissee
  ctx.fillStyle = '#eef3f7'; ctx.fillRect(SB.x0, SB.y0, SB.x1 - SB.x0, SB.y1 - SB.y0);
  ctx.fillStyle = S.own.settle ? '#d9a47b' : '#e2e7ec'; ctx.fillRect(SA.x0, SA.y0, SA.x1 - SA.x0, SA.y1 - SA.y0 + 10);
  rr(LAKE_X + 6, SB.y0 + 6, -588 - LAKE_X, SB.y1 - SB.y0 - 12, 20, S.own.settle ? '#e3e6ea' : '#e9edf0');
  if (S.own.settle) { rr(-575, 362, 405, 528, 26, '#d8b08c'); rr(-565, 372, 385, 508, 22, '#e1bc98'); }
  rr(SB.x0 + 8, SB.y0 + 8, LAKE_X - SB.x0 - 16, SB.y1 - SB.y0 - 16, 30, '#cfe6f4');
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let i = 0; i < 6; i++) { const yy = SB.y0 + 60 + i * 85; ctx.save(); ctx.translate(SB.x0 + 70 + (i % 3) * 90, yy); ctx.rotate(-.35); ctx.fillRect(-60, -3, 120, 6); ctx.restore(); }
  drawHoles(t);
  // Weg der Überlebenden
  ctx.fillStyle = 'rgba(190,205,220,.45)';
  ctx.fillRect(-160, 340, 100, 560); ctx.fillRect(60, 340, 100, 560);
  // Korridore
  ctx.fillStyle = '#d9a47b';
  ctx.beginPath(); ctx.moveTo(259, -209); ctx.lineTo(398, -209); ctx.lineTo(398, -120); ctx.lineTo(310, -120); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-259, -209); ctx.lineTo(-398, -209); ctx.lineTo(-398, -120); ctx.lineTo(-310, -120); ctx.closePath(); ctx.fill();
  // Lager-Boden
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const [x, y] = hexV(i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath();
  ctx.fillStyle = '#d29a70'; ctx.fill();
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const [x, y] = hexV(i); i ? ctx.lineTo(x * .93, y * .93) : ctx.moveTo(x * .93, y * .93); } ctx.closePath();
  ctx.fillStyle = '#dca67c'; ctx.fill();
  // Wärme-Schein
  const g = ctx.createRadialGradient(FURN.x, FURN.y, 20, FURN.x, FURN.y, 150);
  g.addColorStop(0, 'rgba(255,190,90,.45)'); g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(FURN.x, FURN.y, 150, 0, TAU); ctx.fill();
  if (S.own.settle) {
    const g2 = ctx.createRadialGradient(BRAZ.x, BRAZ.y, 10, BRAZ.x, BRAZ.y, 120);
    g2.addColorStop(0, 'rgba(255,190,90,.4)'); g2.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(BRAZ.x, BRAZ.y, 120, 0, TAU); ctx.fill();
  }
  // Wärme-Radius (nur draußen sichtbar)
  if (!inHexPt(player.x, player.y, HR)) {
    ctx.setLineDash([14, 12]); ctx.strokeStyle = 'rgba(255,150,60,.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(FURN.x, FURN.y, heatR(), 0, TAU); ctx.stroke();
    if (S.own.settle) { ctx.beginPath(); ctx.arc(BRAZ.x, BRAZ.y, brazR(), 0, TAU); ctx.stroke(); }
    ctx.setLineDash([]);
  }
  // Ofen-Ring
  ctx.setLineDash([10, 9]); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(FURN.x, FURN.y, 78, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  // Stations-Felder
  const pad = (p, col = 'rgba(60,62,70,.85)') => { rr(p.x - 26, p.y - 24, 52, 48, 8, col); rr(p.x - 22, p.y - 20, 44, 40, 6, 'rgba(255,255,255,.06)'); };
  pad(GRILL_IN); pad(GRILL_OUT);
  if (S.own.kiln) { pad(KILN_IN); pad(KILN_OUT); }
  if (S.own.smoke) { pad(FISH_IN); pad(SMOKE_OUT); }
  // Geld-Felder
  rr(CASH.x - 34, CASH.y - 26, 68, 52, 8, 'rgba(60,62,70,.55)');
  if (S.own.stall) rr(CASH2.x - 34, CASH2.y - 26, 68, 52, 8, 'rgba(60,62,70,.55)');
  // Bauplätze (abgesteckt)
  const plot = (x, y, w, h) => { ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(122,75,46,.7)'; ctx.lineWidth = 2.5; ctx.strokeRect(x - w / 2, y - h / 2, w, h); ctx.setLineDash([]); for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ell(x + px * w / 2, y + py * h / 2, 4, 4, '#7a4b2e'); };
  if (S.own.settle && !S.lv.store) plot(STORE.x, STORE.y, 90, 70);
  if (S.own.settle && S.lv.huts < 2) plot(HUTS[2].x, HUTS[2].y, 70, 56);
  // Theken-Zonen
  ctx.setLineDash([8, 7]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(MEAT_CT.zx - 40, MEAT_CT.zy - 18, 80, 36, 8); ctx.stroke();
  if (S.own.coalCt) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(COAL_CT.zx - 40, COAL_CT.zy - 18, 80, 36, 8); ctx.stroke(); }
  if (S.own.stall) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(STALL.zx - 40, STALL.zy - 18, 80, 36, 8); ctx.stroke(); }
  ctx.setLineDash([]);
  // Förderband
  if (S.own.tower) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5c6068'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(...CONV[0]); ctx.lineTo(...CONV[1]); ctx.lineTo(...CONV[2]); ctx.stroke();
    ctx.strokeStyle = '#7d828b'; ctx.lineWidth = 16; ctx.stroke();
    ctx.setLineDash([4, 8]); ctx.lineDashOffset = -t * 85; ctx.strokeStyle = '#5c6068'; ctx.lineWidth = 16; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
    ctx.lineCap = 'butt';
  }
  // Bau-Felder
  for (const p of PADS) {
    if (!padActive(p)) continue;
    const f = padFrac(p), on = dist(player.x, player.y, p.x, p.y) < 32;
    rr(p.x - 30, p.y - 28, 60, 56, 10, on ? 'rgba(40,60,50,.6)' : 'rgba(40,45,55,.45)');
    if (f > 0) rr(p.x - 30, p.y + 28 - 56 * f, 60, 56 * f, 10, 'rgba(70,200,90,.65)');
    ctx.setLineDash([9, 7]); ctx.strokeStyle = p.cur === 'iron' ? '#dfe6ec' : '#ffffff'; ctx.lineWidth = 3;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(p.x - 30, p.y - 28, 60, 56, 10); else ctx.rect(p.x - 30, p.y - 28, 60, 56); ctx.stroke(); ctx.setLineDash([]);
  }
  drawCh3Ground(t); kitGround(t);
  // Yeti-Angriffe
  for (const c of casts) {
    const k = 1 - c.t / c.T;
    ell(c.x, c.y, c.r, c.r, 'rgba(255,60,60,.18)');
    ell(c.x, c.y, c.r * k, c.r * k, 'rgba(255,60,60,.35)');
    ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, TAU); ctx.stroke();
  }
}

// =====================================================================
//  ZEICHNEN – Hauptszene
// =====================================================================
const flakes = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), s: rand(1, 3), v: rand(.3, 1) }));
function draw(now) {
  const t = S.time;
  shX = shake > 0 ? rand(-shake, shake) : 0; shY = shake > 0 ? rand(-shake, shake) : 0;
  drawGround(t);
  const DL = [];
  const add = (y, f) => DL.push([y, f]);

  for (const p of posts) {
    if (p.s.k === 'tC' && S.own.coalCt) continue;
    if (!onScreen(p.x, p.y, 40)) continue;
    add(p.y, () => { at(p.x, p.y); const h = Math.round(p.h); blit(sprite('p' + h, 16, h + 12, 8, h + 7, () => drawPost({ h }))); });
  }
  for (const s of segs) if (GATES[s.k]) { const open = !segActive(s); add((s.y1 + s.y2) / 2, drawGate(s, open)); }
  for (const o of stones) if (onScreen(o.x, o.y)) add(o.y, () => { at(o.x, o.y); drawStone(o); });
  for (const o of crystals) if (onScreen(o.x, o.y)) add(o.y, () => { at(o.x, o.y); drawCrystal(o, t); });
  // Siedlung
  add(BRAZ.y, () => { at(BRAZ.x, BRAZ.y); drawBrazier(t, S.own.settle); });
  HUTS.forEach((h, i) => {
    if (i >= homes().length) return;
    add(h.y, () => { at(h.x, h.y); if (S.lv.huts > i || (S.lv.huts >= 2 && i < 3)) drawHut(S.lv.huts >= 3, t + i); else drawTent(t); });
  });
  if (S.own.smoke) {
    add(SMOKE.y, () => { at(SMOKE.x, SMOKE.y); drawSmokehouse(t); });
    add(FISH_IN.y, () => drawPile(FISH_IN.x, FISH_IN.y, 'fish', S.fishIn));
    add(SMOKE_OUT.y, () => drawPile(SMOKE_OUT.x, SMOKE_OUT.y, 'smoked', S.smokeOut));
  }
  if (S.own.stall) {
    add(STALL.y, () => { at(STALL.x, STALL.y); drawStall(t); });
    add(CASH2.y, () => drawPile(CASH2.x, CASH2.y, 'cash', Math.ceil(S.cashPile2 / 2), 3, 3, 20, 13, 8));
  }
  if (S.lv.store) add(STORE.y, () => { at(STORE.x, STORE.y); drawStore(t); });
  for (const d of decoTrees) if (onScreen(d.x, d.y)) add(d.y, () => { at(d.x, d.y); treeSprite(d.s); });
  for (const tr of trees) if (onScreen(tr.x, tr.y)) add(tr.y, () => { at(tr.x, tr.y); if (!tr.stump && tr.shake <= 0 && tr.hp >= tr.max) treeSprite(tr.s); else drawTree(tr, tr.s); });
  for (const r of rocks) if (onScreen(r.x, r.y)) add(r.y, () => { at(r.x, r.y); drawRock(r); });
  for (const b of bears) if (!b.dead && onScreen(b.x, b.y)) add(b.y, () => { at(b.x, b.y); drawBear(b); if (b.hp < b.max) screenHp(b, b.big ? 62 : 50, b.hp / b.max); });
  if (yeti && !yeti.dead && onScreen(yeti.x, yeti.y, 200)) add(yeti.y, () => { at(yeti.x, yeti.y); drawYeti(yeti, t); screenHp(yeti, 170, yeti.hp / yeti.max, '#b47cff'); });
  for (const sh of shards) add(sh.y, () => {
    at(sh.x, sh.y); ctx.rotate(sh.rot); ctx.globalAlpha = Math.min(1, sh.life * 2);
    const h = sh.h * Math.min(1, (1.1 - sh.life) * 8 + .2);
    poly([-7, 0, 0, -h, 7, 0], '#8f5bd9'); poly([0, 0, 0, -h, 7, 0], '#c39bff'); ctx.globalAlpha = 1;
  });

  add(FURN.y, () => { at(FURN.x, FURN.y); drawFurnace(t); });
  if (S.own.kiln) add(KILN.y, () => { at(KILN.x, KILN.y); drawKiln(t); });
  if (S.own.tower) add(TOWER.y, () => { at(TOWER.x, TOWER.y); drawTower(t); });
  add(MEAT_CT.y, () => { at(MEAT_CT.x, MEAT_CT.y); drawTable(MEAT_CT, 'cooked', S.meatCt, true); });
  add(COAL_CT.y, () => { at(COAL_CT.x, COAL_CT.y); drawTable(COAL_CT, 'coal', S.coalCt, S.own.coalCt); });
  add(GRILL_IN.y, () => drawPile(GRILL_IN.x, GRILL_IN.y, 'raw', S.grillIn));
  add(GRILL_OUT.y, () => drawPile(GRILL_OUT.x, GRILL_OUT.y, 'cooked', S.grillOut));
  if (S.own.kiln) { add(KILN_IN.y, () => drawPile(KILN_IN.x, KILN_IN.y, 'wood', S.kilnIn)); add(KILN_OUT.y, () => drawPile(KILN_OUT.x, KILN_OUT.y, 'coal', S.kilnOut)); }
  add(CASH.y, () => drawPile(CASH.x, CASH.y, 'cash', Math.ceil(S.cashPile / 2), 3, 3, 20, 13, 8));
  // Förderband-Fleisch
  if (S.own.tower) for (const c of conv) {
    let d = c.d; const L1 = dist(...CONV[0], ...CONV[1]); let x, y;
    if (d < L1) { x = lerp(CONV[0][0], CONV[1][0], d / L1); y = lerp(CONV[0][1], CONV[1][1], d / L1); }
    else { const L2 = dist(...CONV[1], ...CONV[2]); const k = Math.min(1, (d - L1) / L2); x = lerp(CONV[1][0], CONV[2][0], k); y = lerp(CONV[1][1], CONV[2][1], k); }
    add(y, () => { at(x, y, 4); drawItem('raw'); });
  }
  // Drops
  for (const d of drops) if (onScreen(d.x, d.y)) add(d.y, () => { at(d.x, d.y); ell(0, 0, 8, 3, 'rgba(0,0,0,.12)'); at(d.x, d.y, d.z + 4 + (d.z === 0 ? Math.sin(t * 4 + d.x) * 2 + 2 : 0)); drawItem(d.type); });
  // Überlebende
  for (const k in queues) for (const s of queues[k].list) add(s.y, () => { at(s.x, s.y); drawPerson(s.col, s.anim, true, s.face); });
  // Helfer
  for (const n of npcs) add(n.y, () => {
    at(n.x, n.y); const col = NPC_COL[n.kind];
    drawPerson(col, n.anim, true, n.face, { beard: n.kind === 'hunter' || n.kind === 'lumber' || n.kind === 'fisher', hat: n.kind === 'server' ? '#ffffff' : n.kind === 'seller' ? '#d9434a' : n.kind === 'fisher' ? '#2b4a66' : null });
    if (n.kind === 'hunter' || n.kind === 'lumber') { const a = n.axeA; at(n.x + Math.cos(a) * 34, n.y + Math.sin(a) * 34, 14); drawAxe(a * 3); }
    if (n.kind === 'fisher' && n.target && n.fishT > 0) fishLine(n.x - 8, n.y, 34, n.target, t);
    drawStack(n.x - 4 * n.face, n.y - 6, n.stack, 30);
  });
  addFigures(add, t);
  addCh3(add, t); kitAdd(add, t);
  // Spieler
  if (player.dead <= 0) {
    add(player.y, () => {
      drawStack(player.x - 5 * player.face, player.y - 7, player.stack);
      at(player.x, player.y);
      ell(0, 0, 20, 9, 'rgba(60,200,255,.25)');
      ctx.strokeStyle = 'rgba(120,220,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 20, 9, 0, 0, TAU); ctx.stroke();
      { const lk = lookOpts(); drawPerson(lk.coat, player.anim, player.moving, player.face, lk.o); }
      if (playerHole) fishLine(player.x + 8 * player.face, player.y, 36, playerHole, t);
    });
    for (let i = 0; i < S.lv.axes; i++) {
      const a = player.axeA + i * TAU / S.lv.axes, ax = player.x + Math.cos(a) * ORB, ay = player.y + Math.sin(a) * ORB;
      add(ay, () => { at(ax, ay); ell(0, 0, 7, 3, 'rgba(0,0,0,.12)'); at(ax, ay, 16); drawAxe(a * 2.5 + t * 6); });
    }
  }
  DL.sort((a, b) => a[0] - b[0]);
  for (const [, f] of DL) { ctx.save(); f(); ctx.restore(); }

  // Bolzen
  for (const b of bolts) { at(b.x, b.y, b.z); const a = Math.atan2(b.tgt.y - b.y, b.tgt.x - b.x); ctx.rotate(Math.atan2(Math.sin(a) * TY, Math.cos(a))); rr(-9, -1.5, 18, 3, 1, '#6b4426'); poly([9, -3, 14, 0, 9, 3], '#ccd'); }
  drawWolfBolts();
  // Flieger
  for (const f of flyers) {
    const k = clamp(f.t / f.dur, 0, 1), e = k * (2 - k);
    at(lerp(f.x0, f.tx, e), lerp(f.y0, f.ty, e), lerp(f.z0, f.tz, e) + Math.sin(k * Math.PI) * 45); drawItem(f.type);
  }
  // Partikel
  for (const p of parts) { at(p.x, p.y, p.z); ctx.globalAlpha = clamp(p.life / .4, 0, 1); rr(-p.size / 2, -p.size / 2, p.size, p.size, 1, p.col); }
  ctx.globalAlpha = 1;

  drawOverlays(t);
  drawHUD(t);
}

const SYM = { cash: '$', iron: '⛓', stone: '🪨', wood: '🪵', crystal: '🔶', tools: '🔨', cloth: '🧶' };
function drawOverlays(t) {
  screenT();
  drawNight(); screenT();
  // Bau-Feld-Beschriftungen
  let nearPad = null, npd = 140;
  for (const p of PADS) { if (!padActive(p)) continue; const d = dist(player.x, player.y, p.x, p.y); if (d < npd) { npd = d; nearPad = p; } }
  for (const p of PADS) {
    if (!padActive(p) || !onScreen(p.x, p.y)) continue;
    const rm = remOf(p), pp = P(p.x, p.y);
    const s = clamp(Z * 1.15, .7, 1.2);
    txt(p.ic, pp[0], pp[1] - 8 * s, 24 * s, '#fff', 'center', null);
    const parts = [];
    for (const k in rm) if (rm[k] > 0) parts.push(SYM[k] + ' ' + rm[k]);
    if (!parts.length) parts.push('✔');
    const one = parts.length === 1, onlyCash = one && rm.cash > 0;
    txt(parts.slice(0, 2).join('  '), pp[0], pp[1] + 14 * s, (one ? 15 : 12) * s, onlyCash ? '#9dffad' : '#ffffff');
    if (parts.length > 2) txt(parts.slice(2).join('  '), pp[0], pp[1] + 29 * s, 12 * s, '#ffffff');
    if (p === nearPad) {
      const nm = p.name(); ctx.font = `800 ${13 * s}px system-ui,sans-serif`; const tw = ctx.measureText(nm).width + 16 * s;
      ctx.font = `600 ${11 * s}px system-ui,sans-serif`; const dw = p.desc ? ctx.measureText(p.desc).width + 16 * s : 0;
      const bw = Math.max(tw, dw), bh = p.desc ? 38 * s : 22 * s;
      rr(pp[0] - bw / 2, pp[1] - 36 * s - bh, bw, bh, 11 * s, 'rgba(25,35,50,.78)');
      txt(nm, pp[0], pp[1] - 36 * s - bh + 11 * s, 13 * s, '#fff', 'center', null);
      if (p.desc) txt(p.desc, pp[0], pp[1] - 36 * s - bh + 28 * s, 11 * s, '#cfe3f2', 'center', null, 600);
    }
  }
  // Stations-Beschriftungen (dezent)
  const lab = (o, s, z = 0) => { const pp = P(o.x, o.y, z); txt(s, pp[0], pp[1] + 34 * Z, 11 * clamp(Z * 1.2, .8, 1.2), 'rgba(255,255,255,.9)', 'center', 'rgba(0,0,0,.35)', 700); };
  lab(GRILL_IN, 'Rohes Fleisch'); lab(GRILL_OUT, 'Gebraten');
  if (S.own.kiln) { lab(KILN_IN, 'Holz'); lab(KILN_OUT, 'Kohle'); }
  if (S.own.smoke) { lab(FISH_IN, 'Fisch'); lab(SMOKE_OUT, 'Räucherfisch'); }
  // Sprechblasen der Überlebenden
  for (const k in queues) {
    const q = queues[k];
    for (const s of q.list) {
      if (s.state === 'leave') continue;
      const idx = q.list.filter(o => o.state !== 'leave').indexOf(s);
      if (idx > 1) continue;
      const pp = P(s.x, s.y, 68), sc = clamp(Z * 1.2, .75, 1.2);
      const w = 46 * sc, h = 30 * sc, x = pp[0] - w / 2, y = pp[1] - h;
      const full = s.got / s.want;
      rr(x, y, w, h, 10 * sc, '#ffffff');
      if (full > 0) { ctx.save(); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 10 * sc); ctx.clip(); ctx.fillStyle = '#7be08a'; ctx.fillRect(x, y + h * (1 - full), w, h * full); ctx.restore(); }
      poly([pp[0] - 6 * sc, y + h - 1, pp[0] + 6 * sc, y + h - 1, pp[0], y + h + 7 * sc], '#ffffff');
      setT(sc * 1.1, 0, 0, sc * 1.1, x + 14 * sc, y + h / 2 + 4 * sc); drawItem(q.item); screenT();
      txt(String(s.want - s.got), x + w - 13 * sc, y + h / 2, 14 * sc, '#333', 'center', null);
    }
  }
  kitOverlay(t);
  drawFigureUI(t);
  // Schwebende Texte
  for (const f of texts) { const pp = P(f.x, f.y, f.z); ctx.globalAlpha = clamp(f.life * 2, 0, 1); txt(f.s, pp[0], pp[1], f.size * clamp(Z * 1.2, .8, 1.3), f.col); }
  ctx.globalAlpha = 1;
  // Ziel-Pfeil
  const h = hint();
  if (h) {
    const bob = Math.abs(Math.sin(t * 4)) * 12;
    const pp = P(h.x, h.y, 70 + bob), s = clamp(Z * 1.2, .8, 1.3);
    if (!h.soft || dist(player.x, player.y, h.x, h.y) > 120) {
      ctx.save(); ctx.translate(pp[0], pp[1]); ctx.scale(s, s);
      poly([-9, -26, 9, -26, 9, -8, 18, -8, 0, 10, -18, -8, -9, -8], 'rgba(0,0,0,.25)');
      ctx.translate(-2, -3);
      poly([-9, -26, 9, -26, 9, -8, 18, -8, 0, 10, -18, -8, -9, -8], '#3fdc5a');
      poly([-9, -26, 0, -26, 0, 10, -18, -8, -9, -8], '#6cf284');
      ctx.restore();
    }
    // Richtungs-Pfeil am Spieler
    const d = dist(player.x, player.y, h.x, h.y);
    if (d > 140 && player.dead <= 0) {
      const a = Math.atan2((h.y - player.y) * TY, h.x - player.x), pc = P(player.x, player.y);
      ctx.save(); ctx.translate(pc[0] + Math.cos(a) * 48 * Z, pc[1] + Math.sin(a) * 48 * Z); ctx.rotate(a); ctx.scale(Z, Z);
      poly([14, 0, -6, -10, -2, 0, -6, 10], 'rgba(60,230,90,.9)'); ctx.restore();
    }
  }
  // Schneefall
  const bl = blizzard(), n = Math.min(flakes.length, Math.round((bl ? 260 : 70) * (S.finale ? .35 : 1))); // nach dem Finale schneit es kaum noch
  if (bl) { ctx.fillStyle = 'rgba(225,238,250,.33)'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < n; i++) {
    const f = flakes[i];
    f.y += (bl ? .010 : .0016) * f.v; f.x += (bl ? .006 : .0005) * f.v;
    if (f.y > 1) { f.y -= 1; f.x = Math.random(); } if (f.x > 1) f.x -= 1;
    ctx.beginPath(); ctx.arc(f.x * W, f.y * H, f.s * (bl ? 1.2 : 1), 0, TAU); ctx.fill();
  }
  // Kälte-Vignette
  if (player.warm < 60 && player.dead <= 0) {
    const k = (60 - player.warm) / 60;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75);
    g.addColorStop(0, 'rgba(150,210,255,0)'); g.addColorStop(1, `rgba(150,210,255,${.65 * k})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (player.hurtT > .45) { ctx.fillStyle = 'rgba(255,0,0,.12)'; ctx.fillRect(0, 0, W, H); }
}

function pill(x, y, w, icon, val, col = '#fff') {
  rr(x, y, w, 34, 17, 'rgba(25,35,50,.55)');
  ctx.save(); ctx.translate(x + 20, y + 22); ctx.scale(1.25, 1.25); drawItem(icon); ctx.restore();
  txt(String(val), x + w - 12, y + 17, 18, col, 'right', 'rgba(0,0,0,.35)');
}
function bar(x, y, w, frac, col, label) {
  rr(x, y, w, 12, 6, 'rgba(25,35,50,.5)'); rr(x + 2, y + 2, (w - 4) * clamp(frac, 0, 1), 8, 4, col);
  txt(label, x + w + 8, y + 6, 12, '#fff', 'left', 'rgba(0,0,0,.45)', 700);
}
let hudColY = 0; // nächste freie Zeile der rechten HUD-Spalte
function drawHUD(t) {
  screenT();
  const top = 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0);
  // Titel
  txt('GLUTFROST', 66, top + 14, 22, '#ffffff', 'left', '#2a5d86', 900);
  txt(BETA ? 'BETA – eigener Spielstand' : 'Lager im ewigen Eis', 67, top + 34, 11, BETA ? '#ffd84a' : '#e9f4ff', 'left', 'rgba(20,50,80,.6)', 700);
  drawGoalHUD(top);
  // Ressourcen
  const pw = 108, x = W - pw - 12;
  if (S.cash > prevCash) hudBump = 1; prevCash = S.cash;
  ctx.save(); const bs = 1 + hudBump * .12; ctx.translate(x + pw / 2, top + 17); ctx.scale(bs, bs); ctx.translate(-(x + pw / 2), -(top + 17));
  pill(x, top, pw, 'cash', Math.round(hudCash), '#bfffc8'); ctx.restore();
  let y = top + 40;
  if (S.own.mine || S.iron > 0) { pill(x, y, pw, 'iron', S.iron, '#e6edf2'); y += 40; }
  if (S.own.settle || S.stone > 0) { pill(x, y, pw, 'stone', S.stone, '#e6edf2'); y += 40; }
  if (S.own.lake || S.crystal > 0) { pill(x, y, pw, 'crystal', S.crystal, '#ffc27a'); y += 40; }
  if (S.own.ore || S.tools > 0) { pill(x, y, pw, 'tools', S.tools, '#ffe7b0'); y += 40; }
  if (S.own.weite || S.cloth > 0) { pill(x, y, pw, 'cloth', S.cloth, '#ffe7b0'); y += 40; }
  const n = player.stack.length, c = cap();
  rr(x, y, pw, 34, 17, 'rgba(25,35,50,.55)');
  txt('🎒', x + 20, y + 17, 16, '#fff', 'center', null);
  txt(n + '/' + c, x + pw - 12, y + 17, 17, n >= c ? '#ffb35c' : '#fff', 'right', 'rgba(0,0,0,.35)');
  if (n >= c) txt('VOLL', x + pw / 2, y + 44, 12, '#ffb35c', 'center');
  hudColY = y + (n >= c ? 54 : 40);
  // Leben/Wärme
  if (player.hp < 100 || player.warm < 100) {
    bar(14, top + 88, 120, player.hp / 100, '#ff5a5a', 'Leben');
    bar(14, top + 106, 120, player.warm / 100, player.warm < 30 ? '#5ab8ff' : '#ffaa3b', 'Wärme');
  }
  // Schneesturm-Info
  if (blizzard()) { const r = Math.ceil(S.nextBliz + 28 - S.time); txt('❄️ Schneesturm – noch ' + r + 's', W / 2, top + 132, 15, '#ffffff', 'center', '#2a5d86'); }
  else if (S.own.forest && S.nextBliz - S.time < 30 && S.nextBliz > S.time) txt('Schneesturm in ' + Math.ceil(S.nextBliz - S.time) + 's', W / 2, top + 132, 13, '#dff0ff', 'center', '#2a5d86');
  // Hinweis
  const h = hint();
  if (h && h.t) {
    ctx.font = '700 14px system-ui,sans-serif'; const tw = ctx.measureText(h.t).width + 28;
    rr(W / 2 - tw / 2, H - 58, tw, 32, 16, 'rgba(25,35,50,.55)');
    txt(h.t, W / 2, H - 42, 14, '#fff', 'center', null, 700);
  }
  if (!firstMove && player.dead <= 0) {
    const a = (Math.sin(t * 3) + 1) / 2;
    txt('Tippen & ziehen zum Bewegen', W / 2, H * .72, 20, '#ffffff', 'center', 'rgba(20,40,70,.6)');
    ctx.globalAlpha = .6; ell(W / 2 - 30 + a * 60, H * .72 + 45, 18, 18, '#ffffff'); ctx.globalAlpha = 1;
  }
  // Joystick
  if (joy.on) {
    ctx.globalAlpha = .35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 55, 0, TAU); ctx.stroke(); ell(joy.ox, joy.oy, 55, 55, 'rgba(255,255,255,.25)');
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy), m = Math.min(l, 55);
    ctx.globalAlpha = .8; ell(joy.ox + (l ? dx / l * m : 0), joy.oy + (l ? dy / l * m : 0), 24, 24, '#ffffff'); ctx.globalAlpha = 1;
  }
  drawCh3HUD(top); kitHUD(top);
  drawToasts(top);
  // Banner
  if (banner) {
    const a = clamp(banner.t * 2, 0, 1); ctx.globalAlpha = a;
    rr(W / 2 - 170, H * .3 - 40, 340, 80, 18, 'rgba(25,35,50,.72)');
    txt(banner.a, W / 2, H * .3 - 12, 22, '#fff', 'center', null);
    txt(banner.b, W / 2, H * .3 + 18, 13, '#d8e8f5', 'center', null, 600);
    ctx.globalAlpha = 1;
  }
}
