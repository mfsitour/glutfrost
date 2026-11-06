'use strict';
// Glutfrost – Baukasten für spätere Kapitel: Gebiete, Zäune, Wärmequellen, Rohstoff-Knoten,
// Tiere/Gegner, Maschinen (Produktionsketten), Helfer, Bosse und Truhen.
// Die Kapitel-Dateien (ch4.js …) beschreiben nur noch Daten und Zeichnungen.
// =====================================================================
//  HAKEN
// =====================================================================
const KIT = {
  update: [], ground: [], add: [], overlay: [], hud: [], hintEarly: [], hintMid: [], hintLate: [],
  nodes: [], creatures: [], cdefs: {}, machines: [], helpers: [], hdefs: {}, bosses: [], warm: [], chests: [],
};
KIT.matHint = {}; // Hinweis, wo man ein fehlendes Material (Werkzeug, Kleidung) herbekommt
function kitMatHint(k, p) { const f = KIT.matHint[k]; return f ? f(p) : null; }
const runAll = (list, ...a) => { for (const f of list) { const r = f(...a); if (r) return r; } return null; };

// =====================================================================
//  GEBIETE & ZÄUNE
// =====================================================================
function addZone(z) {
  XZONES.push(z);
  if (z.parent) { ZPAR[z.id] = z.parent; WP[z.id] = z.wp; CORE[z.id] = z.core || (() => true); }
  for (const s of z.subs || []) { ZPAR[s.id] = s.parent; WP[s.id] = s.wp; CORE[s.id] = () => true; }
}
function fence(x1, y1, x2, y2, k = 'f') {
  seg(x1, y1, x2, y2, k);
  const s = segs[segs.length - 1];
  if (GATES[k]) return;
  const L = dist(x1, y1, x2, y2), n = Math.max(1, Math.round(L / 17));
  for (let i = 0; i <= n; i++) posts.push({ x: lerp(x1, x2, i / n), y: lerp(y1, y2, i / n), s, h: rand(22, 27) });
}
function rectFence(r, skip = '') { // skip: Seiten ohne Zaun ('t','b','l','r')
  if (!skip.includes('t')) fence(r.x0, r.y0, r.x1, r.y0);
  if (!skip.includes('b')) fence(r.x0, r.y1, r.x1, r.y1);
  if (!skip.includes('l')) fence(r.x0, r.y0, r.x0, r.y1);
  if (!skip.includes('r')) fence(r.x1, r.y0, r.x1, r.y1);
}
// Wärmequellen (Feuer, Schmelzofen …)
const nearWarm = () => KIT.warm.some(w => w.on() && dist(player.x, player.y, w.x, w.y) < w.r);

// =====================================================================
//  ROHSTOFF-KNOTEN (wie Felsen: mit den Äxten abbauen, wachsen nach)
// =====================================================================
// def: { kind, zone, pts, hp, regrow, r, drop(o), on(), draw(o,t), hitSnd, col }
function addNodes(def) {
  def.list = def.pts.map(([x, y]) => ({ x, y, hp: def.hp, max: def.hp, hitCd: 0, stump: 0, shake: 0, flash: 0, s: rand(.9, 1.15), seed: Math.random() }));
  KIT.nodes.push(def); return def.list;
}
function placeNodes(n, r, avoid = [], minD = 70) { // zufällige Punkte in einem Rechteck
  const out = [];
  for (let i = 0; i < 2000 && out.length < n; i++) {
    const x = rand(r.x0 + 45, r.x1 - 45), y = rand(r.y0 + 45, r.y1 - 40);
    if (out.some(p => dist(p[0], p[1], x, y) < minD) || avoid.some(a => dist(a.x, a.y, x, y) < (a.r || 90))) continue;
    out.push([x, y]);
  }
  return out;
}
function hitNode(def, o, n, src, npc) {
  o.hp -= n; o.flash = .12; o.shake = .25; snd(def.hitSnd || 'hit'); burst(o.x, o.y, 20, def.col || '#c7cdd3', 4, 100, 3);
  if (o.hp > 0) return;
  o.stump = def.regrow; burst(o.x, o.y, 20, def.col || '#9aa4ae', 12, 150, 5);
  def.drop(o, src, npc);
}

// =====================================================================
//  TIERE & GEGNER
// =====================================================================
// def: { kind, zone, rect, count, hp, speed, mode: 'flee'|'roam'|'hunt', aggro, dmg, drop(c), draw(c,t), on(), respawn, size }
function defineCreature(def) { KIT.cdefs[def.kind] = def; def.t = 0; }
function spawnCreature(kind, x, y, extra = {}) {
  const def = KIT.cdefs[kind];
  const c = Object.assign({ kind, x, y, hp: def.hp(), max: 0, hitCd: 0, flash: 0, anim: rand(0, 6), face: 1, vx: 0, vy: 0, wt: 0, aggro: 0, bite: 0 }, extra);
  c.max = c.hp; KIT.creatures.push(c); return c;
}
function updateCreatures(dt) {
  for (const k in KIT.cdefs) {
    const def = KIT.cdefs[k]; if (!def.on() || !def.count) continue;
    def.t -= dt;
    const n = KIT.creatures.filter(c => c.kind === k && !c.extra).length;
    if (n < def.count() && def.t <= 0) {
      def.t = def.respawn || 6;
      const x = rand(def.rect.x0 + 40, def.rect.x1 - 40), y = rand(def.rect.y0 + 40, def.rect.y1 - 40);
      if (dist(x, y, player.x, player.y) > 300) spawnCreature(k, x, y);
    }
  }
  const pz = player.dead > 0 ? null : zoneOf(player.x, player.y);
  for (const c of KIT.creatures) {
    const def = KIT.cdefs[c.kind];
    if (c.flash > 0) c.flash -= dt;
    const d = player.dead > 0 ? 1e9 : dist(c.x, c.y, player.x, player.y), here = pz && def.zones.includes(pz);
    let sp = 0;
    if (def.mode === 'flee' && here && d < 140) { c.vx = (c.x - player.x) / d; c.vy = (c.y - player.y) / d; sp = def.speed * 1.4; c.anim += dt * 8; }
    else if ((def.mode === 'hunt' && here && d < def.aggro) || (c.aggro > 0 && here)) {
      c.aggro = Math.max(0, c.aggro - dt);
      if (d > 24) { c.vx = (player.x - c.x) / d; c.vy = (player.y - c.y) / d; sp = def.speed * 1.6; } else sp = 0;
      c.anim += dt * 9;
    } else {
      c.wt -= dt;
      if (c.wt <= 0) { c.wt = rand(1.5, 4); const a = rand(0, TAU), m = Math.random() < .4 ? 0 : 1; c.vx = Math.cos(a) * m; c.vy = Math.sin(a) * m; }
      sp = def.speed * .45; if (c.vx || c.vy) c.anim += dt * 4;
    }
    c.x = clamp(c.x + c.vx * sp * dt, def.rect.x0 + 25, def.rect.x1 - 25);
    c.y = clamp(c.y + c.vy * sp * dt, def.rect.y0 + 25, def.rect.y1 - 25);
    if (Math.abs(c.vx) > .1 && sp > 0) c.face = c.vx > 0 ? 1 : -1;
    if (def.dmg) { c.bite -= dt; if (d < 28 + (def.size || 0) && c.bite <= 0) { c.bite = .9; hurtPlayer(def.dmg()); } }
  }
  KIT.creatures = KIT.creatures.filter(c => !c.dead);
}
function hurtCreature(c, n, src) {
  const def = KIT.cdefs[c.kind];
  c.hp -= n; c.flash = .12; if (def.mode !== 'flee') c.aggro = 3; snd('hit'); burst(c.x, c.y, 20, def.col || '#e2414f', 4, 90, 3);
  if (c.hp > 0) return;
  c.dead = 1; burst(c.x, c.y, 20, def.col || '#d8344a', 12, 160, 4); burst(c.x, c.y, 18, '#ffffff', 6, 120, 4);
  def.drop(c, src);
}

// =====================================================================
//  MASCHINEN (Produktionsketten wie der Grill)
// =====================================================================
// def: { id, own(), x, y, r, inPos, outPos, inItem, outItem, outCur?, time(), inLab, outLab, draw(t,m), warm? }
// Zustand in S.m[id] = { in, out }
function defineMachine(def) { KIT.machines.push(def); def.t = 0; }
const mst = id => (S.m[id] = S.m[id] || { in: 0, out: 0 });
function updateMachines(dt) {
  for (const m of KIT.machines) {
    if (!m.own()) continue;
    const s = mst(m.id); m.t += dt;
    if (s.in > 0 && s.out < 120 && m.t >= m.time()) { m.t = 0; s.in--; s.out++; burst(m.x, m.y, 40, '#ffb12b', 2, 40, 2); }
  }
}
// Abgeben/Abholen an Maschinen (aus doTransfers)
function machineTransfer(give, st, full) {
  for (const m of KIT.machines) {
    if (!m.own()) continue;
    const s = mst(m.id);
    if (near(m.inPos, 36) && s.in < 120 && give(m.inItem, m.inPos, () => s.in++)) return true;
    if (near(m.outPos, 36) && s.out > 0) {
      if (m.outCur) { s.out--; S[m.outCur]++; snd('pick'); ftext(player.x, player.y, 60, '+1 ' + CURR[m.outCur], '#ffe7b0', 15); emit(m.outCur); return true; }
      if (!full) { s.out--; st.push(m.outItem); snd('pick'); return true; }
    }
  }
  return false;
}

// =====================================================================
//  HELFER der späteren Kapitel
// =====================================================================
// def: { kind, own(), col, opts, gather?: { targets(), hit(o,n), item, to: machine }, carry?: { from: machine, to: machine|null } }
function defineHelper(def) { KIT.hdefs[def.kind] = def; }
function spawnKitHelper(kind) {
  const def = KIT.hdefs[kind], m = def.gather ? def.gather.to : def.carry.from;
  KIT.helpers.push({ kind, x: m.inPos.x + rand(-30, 30), y: m.inPos.y + 40, stack: [], path: [], gx: 1e9, gy: 1e9, replan: 0, hitT: 0, anim: 0, axeA: 0, target: null, xfer: 0, face: 1, mode: 'work' });
}
function updateKitHelper(n, dt) {
  const def = KIT.hdefs[n.kind], SP = 150; n.axeA += dt * 5; n.xfer -= dt;
  if (def.gather) {
    const g = def.gather, dest = g.to.inPos;
    if (n.stack.length >= 8 || (n.mode === 'return' && n.stack.length)) {
      n.mode = 'return';
      if (npcGo(n, dest.x, dest.y, SP, dt) || dist(n.x, n.y, dest.x, dest.y) < 24) {
        if (n.xfer <= 0 && n.stack.length) { n.xfer = .08; n.stack.pop(); fly(g.item, n.x, n.y, 40, dest.x, dest.y, 12, .25, () => mst(g.to.id).in++); }
      }
      if (!n.stack.length) n.mode = 'work';
      return;
    }
    if (!n.target || n.target.dead || n.target.stump) n.target = nearestOf(g.targets(), n.x, n.y, o => !o.dead && !o.stump && !KIT.helpers.some(m => m !== n && m.target === o));
    const o = n.target; if (!o) { npcGo(n, dest.x + 40, dest.y + 30, SP * .6, dt); return; }
    if (dist(n.x, n.y, o.x, o.y) > 40) npcGo(n, o.x, o.y + 18, SP, dt);
    else { n.hitT -= dt; if (n.hitT <= 0) { n.hitT = .5; g.hit(o, 1.5, n); } }
    return;
  }
  // Träger: Ausgabe einer Maschine -> Eingang der nächsten (oder in den Vorrat)
  const c = def.carry, from = mst(c.from.id);
  if (n.mode === 'deliver') {
    if (!n.stack.length) { n.mode = 'work'; return; }
    const to = c.to ? c.to.inPos : c.from.outPos;
    if (npcGo(n, to.x, to.y, SP, dt) || dist(n.x, n.y, to.x, to.y) < 22) {
      if (n.xfer <= 0) {
        n.xfer = .08; const it = n.stack.pop();
        if (c.to) fly(it, n.x, n.y, 40, to.x, to.y, 12, .25, () => mst(c.to.id).in++);
        else { S[c.cur]++; emit(c.cur, 1, false); }
      }
    }
    return;
  }
  if (from.out <= 0) { npcGo(n, c.from.outPos.x + 40, c.from.outPos.y + 30, SP * .6, dt); return; }
  if (npcGo(n, c.from.outPos.x, c.from.outPos.y, SP, dt) || dist(n.x, n.y, c.from.outPos.x, c.from.outPos.y) < 20) {
    if (n.xfer <= 0) { n.xfer = .07; if (from.out > 0 && n.stack.length < 10) { from.out--; n.stack.push(c.from.outItem); } else n.mode = 'deliver'; }
  }
}

// =====================================================================
//  BOSSE
// =====================================================================
// def: { id, ownKey (Feld in S.own), deadKey (Feld in S), home, rect, zone, hp, speed, name, dmg, attack(b,dt,ph), draw(b,t), onDeath(b), r, hpZ }
function defineBoss(def) { KIT.bosses.push(def); def.b = null; }
function spawnKitBoss(def) { def.b = { x: def.home.x, y: def.home.y, hp: def.hp, max: def.hp, low: def.hp, hitCd: 0, flash: 0, anim: 0, face: -1, castT: 2.5, sumT: 8, bite: 0, dash: null }; }
function updateBosses(dt) {
  for (const def of KIT.bosses) {
    if (S.own[def.ownKey] && !S[def.deadKey] && !def.b) spawnKitBoss(def);
    const b = def.b; if (!b || b.dead) continue;
    if (b.flash > 0) b.flash -= dt;
    const inArena = !(player.dead > 0) && zoneOf(player.x, player.y) === def.zone && (!def.leash || inRect(player.x, player.y, def.rect));
    if (!inArena) {
      for (const c of KIT.creatures) if (c.extra) c.dead = 1; // Gerufene Helfer verschwinden, wenn man flieht
      b.hp = Math.min(b.max, b.low + b.max * .15, b.hp + b.max * .0015 * dt); // heilt langsam, aber nie ganz
      moveTo(b, def.home.x, def.home.y, 60, dt); b.dash = null; continue;
    }
    const ph = b.hp > b.max * .66 ? 1 : b.hp > b.max * .33 ? 2 : 3;
    if (b.dash) { b.dash.t -= dt; if (b.dash.t <= 0) { b.x = b.dash.x; b.y = b.dash.y; b.dash = null; } continue; }
    const d = dist(b.x, b.y, player.x, player.y);
    if (d > (def.r || 40) + 10 && !b.still) moveTo(b, player.x, player.y, def.speed * (ph === 3 ? 1.25 : 1), dt);
    b.bite -= dt; if (d < (def.r || 40) + 14 && b.bite <= 0) { b.bite = 1; hurtPlayer(def.dmg); }
    def.attack(b, dt, ph);
    b.x = clamp(b.x, def.rect.x0 + 50, def.rect.x1 - 50); b.y = clamp(b.y, def.rect.y0 + 40, def.rect.y1 - 30);
  }
}
function hurtKitBoss(def, n) {
  const b = def.b; b.hp -= n; b.flash = .12; b.low = Math.min(b.low, b.hp); snd('hit'); burst(b.x, b.y, 50, def.col || '#8fa0b4', 4, 140, 4);
  if (b.hp > 0) return;
  b.dead = 1; S[def.deadKey] = 1; snd('boom'); shake = 18; buzz([80, 40, 120]);
  burst(b.x, b.y, 50, def.col || '#8fa0b4', 34, 280, 6); burst(b.x, b.y, 40, '#ffffff', 22, 220, 6);
  for (const c of KIT.creatures) if (c.extra) c.dead = 1;
  def.onDeath(b); save();
}
// Rote Warnkreise (wie beim Yeti), optional mit Sprung des Bosses
function bossCast(x, y, r, t, dmg, cb) { casts.push({ x, y, r, t, T: t, wolf: 1, dmg, cb }); }
const kitBossNear = () => KIT.bosses.find(d => d.b && !d.b.dead && zoneOf(player.x, player.y) === d.zone && (!d.leash || inRect(player.x, player.y, d.rect)));

// =====================================================================
//  TRUHEN (geben Ausrüstung)
// =====================================================================
// spot: { x, y, zone, tier, on() }  – zerschlagen mit den Äxten, kommen nach 5 Minuten wieder
function addChests(list) { for (const c of list) KIT.chests.push(Object.assign({ hp: 5, max: 5, hitCd: 0, stump: 0, shake: 0, flash: 0 }, c)); }
function hitChest(c, n) {
  c.hp -= n; c.shake = .25; snd('chop'); burst(c.x, c.y, 20, '#c9935c', 4, 90, 3);
  if (c.hp > 0) return;
  c.stump = 300; c.hp = c.max; snd('gem'); burst(c.x, c.y, 30, '#ffd84a', 20, 200, 5);
  gearDrop(c.tier, c.x, c.y); emit('chest');
}

// =====================================================================
//  ZUSAMMENSPIEL MIT DEM SPIEL
// =====================================================================
function kitUpdate(dt) {
  for (const def of KIT.nodes) for (const o of def.list) {
    if (o.shake > 0) o.shake -= dt; if (o.flash > 0) o.flash -= dt;
    if (o.stump > 0) { o.stump -= dt; if (o.stump <= 0) { o.stump = 0; o.hp = o.max; } }
  }
  for (const c of KIT.chests) { if (c.shake > 0) c.shake -= dt; if (c.stump > 0) c.stump -= dt; }
  updateCreatures(dt); updateMachines(dt); updateBosses(dt);
  for (const n of KIT.helpers) updateKitHelper(n, dt);
  for (const f of KIT.update) f(dt);
}
function kitSwing(nearF, cd, damage, dt, z) {
  let hit = false;
  for (const def of KIT.nodes) {
    if (!def.on() || !def.zones.includes(z)) continue;
    for (const o of def.list) { if (o.stump) continue; o.hitCd -= dt; if (o.hitCd <= 0 && nearF(o, def.r || 22)) { o.hitCd = cd; hitNode(def, o, damage, 'player'); hit = true; } }
  }
  for (const c of KIT.creatures) {
    const def = KIT.cdefs[c.kind]; if (!def.zones.includes(z)) continue;
    c.hitCd -= dt; if (c.hitCd <= 0 && nearF(c, 20 + (def.size || 0))) { c.hitCd = cd; hurtCreature(c, damage, 'player'); hit = true; }
  }
  for (const def of KIT.bosses) { const b = def.b; if (!b || b.dead) continue; b.hitCd -= dt; if (b.hitCd <= 0 && nearF(b, (def.r || 40))) { b.hitCd = cd; hurtKitBoss(def, damage); hit = true; } }
  for (const c of KIT.chests) { if (c.stump > 0 || !c.on() || c.zone !== z) continue; c.hitCd -= dt; if (c.hitCd <= 0 && nearF(c, 18)) { c.hitCd = cd; hitChest(c, 1); hit = true; } }
  return hit;
}
function kitSolids(a) {
  for (const m of KIT.machines) if (m.own() && m.r) a.push({ x: m.x, y: m.y, r: m.r });
  for (const def of KIT.bosses) if (def.b && !def.b.dead) a.push({ x: def.b.x, y: def.b.y, r: (def.r || 40) - 10 });
}
function kitGround(t) {
  for (const f of KIT.ground) f(t);
  // Maschinen-Felder
  for (const m of KIT.machines) {
    if (!m.own()) continue;
    for (const p of [m.inPos, m.outPos]) { rr(p.x - 26, p.y - 24, 52, 48, 8, 'rgba(60,62,70,.85)'); rr(p.x - 22, p.y - 20, 44, 40, 6, 'rgba(255,255,255,.06)'); }
  }
}
function kitAdd(add, t) {
  for (const def of KIT.nodes) { if (!def.on()) continue; for (const o of def.list) if (onScreen(o.x, o.y)) add(o.y, () => { at(o.x, o.y); def.draw(o, t); }); }
  for (const c of KIT.creatures) if (onScreen(c.x, c.y)) { const def = KIT.cdefs[c.kind]; add(c.y, () => { at(c.x, c.y); def.draw(c, t); if (c.hp < c.max) screenHp(c, def.hpZ || 46, c.hp / c.max); }); }
  for (const m of KIT.machines) {
    if (!m.own()) continue; const s = mst(m.id);
    add(m.y, () => { at(m.x, m.y); m.draw(t, s); });
    add(m.inPos.y, () => drawPile(m.inPos.x, m.inPos.y, m.inItem, s.in));
    add(m.outPos.y, () => drawPile(m.outPos.x, m.outPos.y, m.outItem, s.out));
  }
  for (const def of KIT.bosses) { const b = def.b; if (b && !b.dead && onScreen(b.x, b.y, 220)) add(b.y, () => { at(b.x, b.y); def.draw(b, t); screenHp(b, def.hpZ || 110, b.hp / b.max, '#ffb12b'); }); }
  for (const c of KIT.chests) if (c.on() && c.stump <= 0 && onScreen(c.x, c.y)) add(c.y, () => { at(c.x, c.y); drawChest(c, t); });
  for (const n of KIT.helpers) add(n.y, () => {
    const def = KIT.hdefs[n.kind]; at(n.x, n.y); drawPerson(def.col, n.anim, true, n.face, def.opts || {});
    if (def.gather) { const a = n.axeA; at(n.x + Math.cos(a) * 34, n.y + Math.sin(a) * 34, 14); drawAxe(a * 3); }
    drawStack(n.x - 4 * n.face, n.y - 6, n.stack, 30);
  });
  for (const f of KIT.add) f(add, t);
}
function kitOverlay(t) {
  const lab = (o, s) => { const pp = P(o.x, o.y); txt(s, pp[0], pp[1] + 34 * Z, 11 * clamp(Z * 1.2, .8, 1.2), 'rgba(255,255,255,.9)', 'center', 'rgba(0,0,0,.35)', 700); };
  for (const m of KIT.machines) if (m.own() && onScreen(m.x, m.y, 300)) { lab(m.inPos, m.inLab); lab(m.outPos, m.outLab); }
  for (const f of KIT.overlay) f(t);
}
function kitHUD(top) {
  for (const f of KIT.hud) f(top);
  const def = kitBossNear();
  if (def) {
    const b = def.b, bw = Math.min(260, W - 160), bx = W / 2 - bw / 2, by = H - 104;
    rr(bx, by, bw, 16, 8, 'rgba(25,35,50,.7)'); rr(bx + 2, by + 2, (bw - 4) * clamp(b.hp / b.max, 0, 1), 12, 6, '#ff8a2a');
    txt('👑 ' + def.name.replace(/^den /, ''), W / 2, by - 10, 13, '#ffffff', 'center', 'rgba(0,0,0,.5)');
  }
}
// Hinweis: liegengebliebene Ausrüstung und Fundstücke aufheben; Truhen in der Nähe öffnen
KIT.hintEarly.push(st => {
  const d = nearestOf(drops, player.x, player.y, o => o.type === 'gearbox' || o.type === 'find');
  if (d && dist(d.x, d.y, player.x, player.y) < 700) return { x: d.x, y: d.y, t: d.type === 'gearbox' ? 'Heb die Ausrüstung auf 🎁' : 'Heb das Fundstück auf ✨' };
  return null;
});
KIT.hintLate.push(st => {
  const z = zoneOf(player.x, player.y);
  const c = nearestOf(KIT.chests, player.x, player.y, o => o.on() && o.stump <= 0 && o.zone === z);
  return c && dist(c.x, c.y, player.x, player.y) < 600 ? { x: c.x, y: c.y + 30, t: 'Öffne die Truhe 🎁', soft: 1 } : null;
});
// Hinweis: zum Kampf gegen einen Kapitel-Boss
function kitBossHint(st) {
  for (const def of KIT.bosses) {
    const b = def.b; if (!b || b.dead) continue;
    // Angeschlagen? Am nächsten Feuer erholen (dort heilt man langsam), dann weiterkämpfen
    if (player.hp < 45) KIT.resting = true;
    if (player.hp >= 92) KIT.resting = false;
    if (KIT.resting) { const w = KIT.warm.filter(w => w.on()).sort((a, c) => dist(a.x, a.y, player.x, player.y) - dist(c.x, c.y, player.x, player.y))[0]; if (w && dist(w.x, w.y, player.x, player.y) < 1200) return { x: w.x, y: w.y + 60, t: 'Erhol dich am Feuer 🔥' }; return null; }
    if (st.length > 6) return null;
    return { x: b.x, y: b.y + 50, t: 'Besiege ' + def.name + '! Weiche den roten Kreisen aus', soft: 1 };
  }
  return null;
}
// Maschinen-Hinweise: Rohstoff im Rucksack -> zur Maschine; fertige Ware abholen
function machineHint(st) {
  // An einer Ausgabe erst den Rucksack füllen, sonst pendelt man mit einem einzigen Teil hin und her
  for (const m of KIT.machines) {
    if (!m.own() || m.outCur || !st.includes(m.outItem)) continue;
    if (mst(m.id).out > 0 && st.length < cap() && near(m.outPos, 60)) return { ...m.outPos, t: 'Nimm mehr ' + m.outLab + ' mit' };
  }
  for (const m of KIT.machines) {
    if (!m.own() || mst(m.id).in >= 120) continue; // voll: erst muss die Ware weiter
    if (st.includes(m.inItem)) return { x: m.inPos.x, y: m.inPos.y, t: m.hint || ('Bring es zu: ' + m.name) };
  }
  return null;
}
function drawChest(c, t) {
  ctx.rotate(c.shake > 0 ? Math.sin(t * 50) * .06 : 0);
  shadow(18, 7);
  const g = c.tier >= 3 ? ['#7a4fb0', '#9b6fd0'] : c.tier >= 2 ? ['#2f6fa8', '#4a95d1'] : ['#8a5a32', '#a8764a'];
  rr(-16, -20, 32, 20, 3, g[0]); rr(-17, -26, 34, 9, 4, g[1]);
  rr(-17, -22, 34, 3, 1, '#e8c25a'); rr(-3, -22, 6, 9, 2, '#e8c25a');
  ell(0, -36 + Math.sin(t * 3) * 2, 3, 3, 'rgba(255,230,120,.9)');
}
