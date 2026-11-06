'use strict';
// Glutfrost – Kampf, Bewegung, Update-Schleife, Helfer, Kunden
// =====================================================================
//  KAMPF
// =====================================================================
function killBear(b, src, npc) {
  b.dead = rand(3, 6);
  if (src === 'player') { emit('bear'); discover('bear'); if (b.big) { emit('bigbear'); discover('bigbear'); } rollFind('bear', b.x, b.y); }
  const n = b.big ? randi(5, 6) : randi(2, 3);
  burst(b.x, b.y, 18, '#d8344a', 12, 160, 4);
  burst(b.x, b.y, 18, '#ffffff', 8, 120, 5);
  if (src === 'tower') { for (let i = 0; i < n; i++) fly('raw', b.x, b.y, 20, TOWER.x, TOWER.y + 18, 20, .55 + i * .08, () => conv.push({ d: 0 })); }
  else if (src === 'npc') { for (let i = 0; i < n; i++) npc.stack.push('raw'); }
  else spawnDrops('raw', n, b.x, b.y);
}
function hurt(o, amount, kind, src, npc) {
  o.hp -= amount; o.flash = .12; o.shake = .25;
  if (kind === 'bear') {
    o.aggro = 5; snd('hit'); burst(o.x, o.y, 22, '#e2414f', 4, 90, 3);
    if (o.hp <= 0) killBear(o, src, npc);
  } else if (kind === 'tree') {
    snd('chop'); burst(o.x, o.y, 30, '#c9935c', 5, 90, 3); burst(o.x, o.y, 50, '#ffffff', 4, 70, 3);
    if (o.hp <= 0) {
      o.stump = 28; burst(o.x, o.y, 40, '#7fb0d6', 10, 140, 5);
      if (src === 'player') { emit('tree'); rollFind(o.zone === 'forest' ? 'treeF' : 'treeS', o.x, o.y); }
      if (src === 'npc') { for (let i = 0; i < 3; i++) npc.stack.push('wood'); } else spawnDrops('wood', 3, o.x, o.y);
    }
  } else if (kind === 'rock') {
    snd('hit'); burst(o.x, o.y, 20, '#c7cdd3', 5, 110, 3); burst(o.x, o.y, 20, '#ffb347', 2, 110, 2);
    if (o.hp <= 0) { o.stump = 40; rollFind('rock', o.x, o.y); spawnDrops('iron', 2 + (Math.random() < .4 ? 1 : 0), o.x, o.y); burst(o.x, o.y, 20, '#9aa4ae', 12, 150, 5); }
  } else if (kind === 'stone') {
    snd('hit'); burst(o.x, o.y, 20, '#b8bec5', 5, 110, 3); burst(o.x, o.y, 26, '#ffffff', 2, 80, 3);
    if (o.hp <= 0) { o.stump = 30; rollFind('stone', o.x, o.y); spawnDrops('stone', 4, o.x, o.y); burst(o.x, o.y, 20, '#9aa4ae', 14, 160, 5); }
  } else if (kind === 'crystal') {
    snd('gem'); burst(o.x, o.y, 30, '#ffa64a', 5, 120, 3); burst(o.x, o.y, 30, '#dff3ff', 3, 90, 3);
    if (o.hp <= 0) { o.stump = 40; rollFind('crystal', o.x, o.y); spawnDrops('crystal', randi(2, 3), o.x, o.y); burst(o.x, o.y, 30, '#ff8a2a', 18, 200, 5); shake = Math.max(shake, 4); }
  } else if (kind === 'yeti') {
    snd('hit'); burst(o.x, o.y, 50, '#b47cff', 5, 140, 4);
    if (o.hp <= 0) {
      o.dead = 75; S.yetiKills++; discover('yeti'); rollFind('yeti', o.x, o.y); snd('boom'); shake = 14; buzz([60, 40, 90]);
      spawnDrops('raw', 12, o.x, o.y); spawnDrops('cash', 12, o.x, o.y, 6 + 4 * S.lv.furnace);
      if (S.own.mine) spawnDrops('iron', 8, o.x, o.y);
      if (S.own.lake) spawnDrops('crystal', 4, o.x, o.y);
      burst(o.x, o.y, 50, '#b47cff', 30, 260, 6); burst(o.x, o.y, 40, '#ffffff', 20, 220, 6);
      banner = { t: 3.5, a: 'Yeti besiegt!', b: 'Er kehrt stärker zurück …' };
    }
  }
}
const ORB = 58;
// Äxte treffen alles im Kreis um den Träger. Mehr Äxte => schnellere Treffer.
function swing(owner, nAxes, damage, src, npc, dt) {
  const reach = ORB + 6, cd = 0.42 / nAxes;
  const near = (o, r) => Math.abs(o.x - owner.x) < reach + r && Math.abs(o.y - owner.y) < reach + r && dist(o.x, o.y, owner.x, owner.y) < reach + r;
  let hitSomething = false;
  const z = zoneOf(owner.x, owner.y);
  if (z === 'field' || z === 'camp') for (const b of bears) {
    if (b.dead) continue; b.hitCd -= dt;
    if (b.hitCd <= 0 && near(b, b.big ? 30 : 22)) { b.hitCd = cd; hurt(b, damage, 'bear', src, npc); hitSomething = true; }
  }
  if (z === 'forest' || z === 'settle') for (const t of trees) {
    if (t.stump || t.zone !== z) continue; t.hitCd -= dt;
    if (t.hitCd <= 0 && near(t, 16)) { t.hitCd = cd; hurt(t, damage, 'tree', src, npc); hitSomething = true; }
  }
  if (z === 'forest' && yeti && !yeti.dead && src === 'player') { yeti.hitCd -= dt; if (yeti.hitCd <= 0 && near(yeti, 38)) { yeti.hitCd = cd; hurt(yeti, damage, 'yeti', src); hitSomething = true; } }
  const hitAll = (list, r, kind) => {
    for (const o of list) {
      if (o.stump) continue; o.hitCd -= dt;
      if (o.hitCd <= 0 && near(o, r)) { o.hitCd = cd; hurt(o, damage, kind, src, npc); hitSomething = true; }
    }
  };
  if (z === 'iron') hitAll(rocks, 22, 'rock');
  if (z === 'settle' && S.own.settle) hitAll(stones, 22, 'stone');
  if (z === 'lake' && S.own.lake) hitAll(crystals, 24, 'crystal');
  if (src === 'player' && swingWolves(near, cd, damage, dt)) hitSomething = true;
  if (src === 'player' && kitSwing(near, cd, damage, dt, z)) hitSomething = true;
  return hitSomething;
}

// =====================================================================
//  BEWEGUNG / KOLLISION
// =====================================================================
function solids() {
  const a = [FURN];
  if (S.own.kiln) a.push(KILN);
  if (S.own.tower) a.push(TOWER);
  if (yeti && !yeti.dead) a.push({ x: yeti.x, y: yeti.y, r: 30 });
  a.push(BRAZ);
  if (S.own.smoke) a.push(SMOKE);
  if (S.lv.store) a.push(STORE);
  for (const h of homes()) a.push({ x: h.x, y: h.y, r: 26 });
  ch3Solids(a); kitSolids(a);
  return a;
}
function moveCircle(e, dx, dy, r) {
  const nx = e.x + dx; if (inRegion(nx, e.y)) e.x = nx;
  const ny = e.y + dy; if (inRegion(e.x, ny)) e.y = ny;
  for (let it = 0; it < 2; it++) {
    for (const s of segs) {
      if (!segActive(s)) continue;
      const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L2 = vx * vx + vy * vy;
      const t = clamp(((e.x - s.x1) * vx + (e.y - s.y1) * vy) / L2, 0, 1);
      const px = s.x1 + vx * t, py = s.y1 + vy * t, d = dist(e.x, e.y, px, py);
      if (d < r && d > 0.0001) { const k = (r - d) / d; const nx2 = e.x + (e.x - px) * k, ny2 = e.y + (e.y - py) * k; if (inRegion(nx2, ny2)) { e.x = nx2; e.y = ny2; } }
    }
    for (const c of solids()) {
      const d = dist(e.x, e.y, c.x, c.y), m = c.r + r;
      if (d < m && d > 0.0001) { const nx2 = c.x + (e.x - c.x) / d * m, ny2 = c.y + (e.y - c.y) / d * m; if (inRegion(nx2, ny2)) { e.x = nx2; e.y = ny2; } }
    }
  }
}

// Wegpunkte für Helfer
// Zonen bilden einen Baum (Wurzel: Lager). WP[z] = Wegpunkte vom Elternbereich in die Zone.
const WP = {
  field: [[0, -195], [0, -300]], forest: [[150, -92], [262, -130], [370, -130]], iron: [[-150, -92], [-262, -130], [-370, -130]],
  settle: [[-140, 185], [-236, 255], [-236, 420]], lake: [[LAKE_X + 60, LAKE_GATE.y], [LAKE_X - 60, LAKE_GATE.y]],
  pass: [[PASS_GX, -960], [PASS_GX, -1050]], den: [[PASS_GX, DEN_Y + 40], [PASS_GX, DEN_Y - 50]],
};
const ZPAR = { field: 'camp', forest: 'camp', iron: 'camp', settle: 'camp', lake: 'settle', pass: 'field', den: 'pass' };
function zchain(z) { const c = [z]; while (ZPAR[c[c.length - 1]]) c.push(ZPAR[c[c.length - 1]]); return c; }
function route(a, b) {
  if (a === b) return [];
  const ca = zchain(a), cb = zchain(b), lca = ca.find(z => cb.includes(z));
  let p = [];
  for (const z of ca) { if (z === lca) break; p = p.concat(WP[z].slice().reverse()); }
  const down = [];
  for (const z of cb) { if (z === lca) break; down.unshift(WP[z]); }
  for (const w of down) p = p.concat(w);
  return p;
}
// Kernbereich einer Zone (ohne Zugangskorridor). Im Korridor muss erst der Eingang angesteuert werden.
const CORE = {
  field: (x, y) => inRect(x, y, FIELD), forest: (x, y) => inRect(x, y, FOREST), iron: (x, y) => inRect(x, y, MINE),
  settle: (x, y) => y >= SB.y0, lake: () => true, pass: () => true, den: () => true,
};
function planPath(x0, y0, x1, y1) {
  const a = zoneOf(x0, y0), b = zoneOf(x1, y1);
  let p = route(a, b);
  const inCorr = a !== 'camp' && !CORE[a](x0, y0);
  if (inCorr && a === b && CORE[b](x1, y1)) p = [WP[a][WP[a].length - 1]];
  else if (inCorr && a !== b && p.length) p = p.slice(1);
  return p.concat([[x1, y1]]);
}
function npcGo(n, tx, ty, sp, dt) {
  n.replan -= dt;
  if ((!n.path.length && dist(n.x, n.y, tx, ty) > 12) || dist(tx, ty, n.gx, n.gy) > 60) {
    n.path = planPath(n.x, n.y, tx, ty); n.gx = tx; n.gy = ty; n.replan = .6;
  } else if (n.path.length) n.path[n.path.length - 1] = [tx, ty];
  if (!n.path.length) return true;
  const [px, py] = n.path[0], d = dist(n.x, n.y, px, py);
  if (d < 10) { n.path.shift(); return n.path.length === 0; }
  const s = Math.min(d, sp * dt);
  n.x += (px - n.x) / d * s; n.y += (py - n.y) / d * s; n.anim += dt * 10; n.face = px > n.x ? 1 : -1;
  return false;
}

// =====================================================================
//  UPDATE
// =====================================================================
function update(dt) {
  S.time += dt;
  shake = Math.max(0, shake - dt * 40);
  hudCash = lerp(hudCash, S.cash, Math.min(1, dt * 10)); if (Math.abs(hudCash - S.cash) < .5) hudCash = S.cash;
  hudBump = Math.max(0, hudBump - dt * 4);
  const t = S.time;

  // ---------- Spieler ----------
  if (player.dead > 0) {
    player.dead -= dt;
    if (player.dead <= 0) { player.dead = 0; player.x = 0; player.y = 120; player.hp = 100; player.warm = 100; } // genau 0, sonst gilt man als „tot“ (Rundungsrest)
  } else {
    const [ix, iy] = inputVec();
    const cold = player.warm <= 0 ? .6 : 1;
    const sp = speed() * cold;
    player.moving = Math.hypot(ix, iy) > .05;
    if (player.moving) { firstMove = true; player.anim += dt * 12; if (Math.abs(ix) > .1) player.face = ix > 0 ? 1 : -1; }
    const ox = player.x, oy = player.y;
    moveCircle(player, ix * sp * dt, iy * sp * dt, 14);
    if (player.moving) emit('walk', dist(ox, oy, player.x, player.y) / 20, false);
    player.axeA += dt * (4 + S.lv.axes * .6);
    swing(player, S.lv.axes, dmg(), 'player', null, dt);

    // Wärme & Leben
    const dF = dist(player.x, player.y, FURN.x, FURN.y);
    const inCamp = inHexPt(player.x, player.y, HR);
    if (dF < heatR() || inCamp || nearBraz()) player.warm = Math.min(100, player.warm + 22 * dt);
    else player.warm = Math.max(0, player.warm - (blizzard() ? 7 : 2.2) * (1 - .22 * S.lv.coat) * (1 - gearV('cold')) * coldMul() * dt);
    if (player.warm <= 0) { player.hp -= 6 * dt; if (Math.random() < dt * 2) ftext(player.x, player.y, 70, 'Kalt!', '#9fd8ff', 16); }
    if (inCamp) player.hp = Math.min(100, player.hp + 14 * dt);
    else if (nearWarm()) player.hp = Math.min(100, player.hp + 5 * dt); // an Feuern und Öfen draußen heilt man langsam
    player.hurtT -= dt;
    if (player.hp <= 0) {
      player.dead = 2.2; emit('deaths', 1, false); burst(player.x, player.y, 30, '#9fd8ff', 24, 200, 5);
      for (const it of player.stack) drops.push({ type: it, v: 1, x: player.x, y: player.y, z: 30, vx: rand(-120, 120), vy: rand(-120, 120), vz: rand(100, 250), age: -1 });
      player.stack.length = 0; banner = { t: 2.5, a: 'Erfroren …', b: 'Zurück zum Ofen. Achte auf die Wärme!' };
    }

    // Transfers an Stationen
    xferT -= dt;
    if (xferT <= 0) {
      if (doTransfers()) xferT = .055;
    }
    // Bau-Felder
    for (const p of PADS) {
      const on = dist(player.x, player.y, p.x, p.y) < 32;
      if (!on) { p.lock = false; p.onT = 0; continue; }
      p.onT = (p.onT || 0) + dt;
      if (padActive(p) && !p.lock && p.onT > .3) payPad(p, dt);
    }
  }

  // ---------- Stationen ----------
  grillT += dt;
  if (S.grillIn > 0 && S.grillOut < 120 && grillT >= cookT() && !frozen('grill')) { grillT = 0; S.grillIn--; S.grillOut++; burst(FURN.x - 40, FURN.y, 50, '#ffb12b', 2, 40, 2); }
  if (S.own.kiln) { kilnT += dt; if (S.kilnIn > 0 && S.kilnOut < 120 && kilnT >= cookT() * 1.5 && !frozen('kiln')) { kilnT = 0; S.kilnIn--; S.kilnOut++; } }
  if (S.own.smoke) { smokeT += dt; if (S.fishIn > 0 && S.smokeOut < 120 && smokeT >= cookT() * 1.3) { smokeT = 0; S.fishIn--; S.smokeOut++; } }

  // ---------- Eislöcher (Angeln) ----------
  playerHole = null;
  if (S.own.lake && !(player.dead > 0) && zoneOf(player.x, player.y) === 'lake') {
    let bd = 52;
    for (const h of holes) { if (h.cd > 0) continue; const d = dist(h.x, h.y, player.x, player.y); if (d < bd) { bd = d; playerHole = h; } }
  }
  for (const h of holes) {
    h.np = 0;
    if (h.cd > 0) { h.cd -= dt; h.t = 0; continue; }
    if (h === playerHole) {
      h.t += dt;
      if (h.t >= fishT()) {
        h.t = 0; h.cd = HOLE_CD; splash(h);
        const nf = randi(1, 2) + (Math.random() < .25 ? 1 : 0);
        spawnDrops('fish', nf, h.x, h.y); emit('fish', nf); catchFish(); rollFind('fish', h.x, h.y);
      }
    } else h.t = Math.max(0, h.t - dt * 2);
  }

  // ---------- Turm ----------
  if (S.own.tower) {
    towerT -= dt;
    let best = null, bd = 330;
    for (const b of bears) { if (b.dead) continue; const d = dist(b.x, b.y, TOWER.x, TOWER.y); if (d < bd) { bd = d; best = b; } }
    if (best) towerAim = Math.atan2(best.y - TOWER.y, best.x - TOWER.x);
    if (towerT <= 0 && best) {
      towerT = Math.max(.6, 1.4 - .15 * (S.lv.furnace - 1));
      bolts.push({ x: TOWER.x, y: TOWER.y, z: 52, tgt: best, sp: 650 });
    }
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i], g = b.tgt;
    if (g.dead) { bolts.splice(i, 1); continue; }
    const d = dist(b.x, b.y, g.x, g.y);
    if (d < 14) { bolts.splice(i, 1); g.aggro = 0; hurt(g, 2, 'bear', 'tower'); g.aggro = 0; continue; }
    b.x += (g.x - b.x) / d * b.sp * dt; b.y += (g.y - b.y) / d * b.sp * dt; b.z = lerp(b.z, 20, dt * 4);
  }
  // Förderband
  const convLen = dist(...CONV[0], ...CONV[1]) + dist(...CONV[1], ...CONV[2]);
  for (let i = conv.length - 1; i >= 0; i--) { conv[i].d += 85 * dt; if (conv[i].d >= convLen) { conv.splice(i, 1); S.grillIn++; } }

  // ---------- Bären ----------
  const pInField = zoneOf(player.x, player.y) === 'field' && !(player.dead > 0);
  for (const b of bears) {
    if (b.flash > 0) b.flash -= dt;
    if (b.dead) { b.dead -= dt; if (b.dead <= 0) spawnBear(b); continue; }
    b.aggro -= dt;
    let sp = 0;
    if (b.aggro > 0 && b.big && pInField) {
      const d = dist(b.x, b.y, player.x, player.y);
      if (d > 30) { b.vx = (player.x - b.x) / d; b.vy = (player.y - b.y) / d; sp = 95; }
      else { sp = 0; if (player.hurtT <= 0) { hurtPlayer(5); player.hurtT = 1; } }
    } else {
      b.wt -= dt;
      if (b.wt <= 0) { b.wt = rand(1.5, 4); const a = rand(0, TAU); const m = Math.random() < .4 ? 0 : 1; b.vx = Math.cos(a) * m; b.vy = Math.sin(a) * m; }
      sp = 28;
    }
    b.x = clamp(b.x + b.vx * sp * dt, FIELD.x0 + 25, FIELD.x1 - 25);
    b.y = clamp(b.y + b.vy * sp * dt, FIELD.y0 + 25, FIELD.y1 - 35);
    if (sp > 0 && (b.vx || b.vy)) { b.anim += dt * sp / 9; if (Math.abs(b.vx) > .1) b.face = b.vx > 0 ? 1 : -1; }
  }
  // ---------- Bäume & Felsen ----------
  for (const tr of trees) { if (tr.shake > 0) tr.shake -= dt; if (tr.stump > 0) { tr.stump -= dt; if (tr.stump <= 0) { tr.stump = 0; tr.hp = tr.max; } } }
  for (const list of [rocks, stones, crystals]) for (const r of list) {
    if (r.shake > 0) r.shake -= dt; if (r.flash > 0) r.flash -= dt;
    if (r.stump > 0) { r.stump -= dt; if (r.stump <= 0) { r.stump = 0; r.hp = r.max; } }
  }

  // ---------- Yeti ----------
  if (yeti) updateYeti(dt);
  for (let i = casts.length - 1; i >= 0; i--) {
    const c = casts[i]; c.t -= dt;
    if (c.t <= 0) {
      casts.splice(i, 1); snd('boom'); if (c.cb) c.cb(c);
      if (!c.wolf) for (let k = 0; k < 9; k++) { const a = rand(0, TAU), rr2 = rand(0, c.r * .8); shards.push({ x: c.x + Math.cos(a) * rr2, y: c.y + Math.sin(a) * rr2, h: rand(20, 46), life: 1.1, rot: rand(-.4, .4) }); }
      burst(c.x, c.y, 10, c.wolf ? '#ffffff' : '#b47cff', 18, 200, 5);
      if (!(player.dead > 0) && dist(player.x, player.y, c.x, c.y) < c.r) hurtPlayer(c.dmg || 22, true);
      if (dist(player.x, player.y, c.x, c.y) < 400) shake = Math.max(shake, 7);
    }
  }
  for (let i = shards.length - 1; i >= 0; i--) { shards[i].life -= dt; if (shards[i].life <= 0) shards.splice(i, 1); }

  // ---------- Helfer ----------
  for (const n of npcs) updateNpc(n, dt);

  // ---------- Überlebende ----------
  for (const k in queues) updateQueue(queues[k], dt);

  // ---------- Drops ----------
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.age += dt;
    if (d.z > 0 || d.vz > 0) { d.vz -= 700 * dt; d.z += d.vz * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.z <= 0) { d.z = 0; d.vz = 0; d.vx = d.vy = 0; } }
    if (d.age > 70) { drops.splice(i, 1); continue; }
    if (player.dead > 0 || d.age < .45) continue;
    const isCur = CURR[d.type] || d.type === 'find' || d.type === 'gearbox';
    if (!isCur && player.stack.length >= cap()) { if (S.time - (player.fullMsg || 0) > 2.5 && dist(d.x, d.y, player.x, player.y) < 90) { player.fullMsg = S.time; ftext(player.x, player.y, 90, 'Voll!', '#ffb35c', 18); } continue; }
    const dd = dist(d.x, d.y, player.x, player.y);
    if (dd < 95) {
      const s = Math.min(dd, (420 + (95 - dd) * 6) * dt);
      d.x += (player.x - d.x) / (dd || 1) * s; d.y += (player.y - d.y) / (dd || 1) * s; d.z = lerp(d.z, 25, dt * 8);
      if (dd < 16) {
        drops.splice(i, 1);
        if (d.type === 'cash') { S.cash += d.v; snd('coin'); }
        else if (d.type === 'find') pickFind(d);
        else if (d.type === 'gearbox') pickGearbox(d);
        else if (isCur) { S[d.type] += 1; emit(d.type); snd(d.type === 'crystal' ? 'gem' : 'pick'); ftext(player.x, player.y, 60, '+1 ' + CURR[d.type], d.type === 'crystal' ? '#ffc27a' : '#dfe6ec', 15); }
        else { player.stack.push(d.type); snd('pick'); }
      }
    }
  }
  // ---------- Flieger / Partikel ----------
  for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i]; f.t += dt; if (f.t >= f.dur) { flyers.splice(i, 1); f.cb && f.cb(); } }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.vz -= 600 * dt; p.z += p.vz * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.z < 0) { p.z = 0; p.vz *= -.3; p.vx *= .5; p.vy *= .5; }
  }
  for (let i = texts.length - 1; i >= 0; i--) { texts[i].life -= dt; texts[i].z += 40 * dt; if (texts[i].life <= 0) texts.splice(i, 1); }

  // ---------- Schneesturm ----------
  if (S.own.forest && S.time >= S.nextBliz + 28) { S.nextBliz += 150; emit('bliz', 1, false); }

  // ---------- Kampagne & Langzeitmotivation ----------
  updateChapter(dt); updateQuests(dt); checkAch(dt); updateCh3(dt); kitUpdate(dt);
  if (blizWarn() && !banner && S.time - (S._warned || 0) > 20) { S._warned = S.time; snd('warn'); banner = { t: 4, a: '❄️ Schneesturm zieht auf!', b: 'Draußen wird es eiskalt – Kohle zahlt jetzt doppelt.' }; }
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }

  // ---------- Kamera ----------
  const ty = player.y - 70 / TY;
  camX = lerp(camX, player.x, Math.min(1, dt * 6));
  camY = lerp(camY, ty, Math.min(1, dt * 6));

  saveT -= dt; if (saveT <= 0) { saveT = 4; save(); }
}

const CURR = { cash: 'Geld', iron: 'Eisen', stone: 'Stein', crystal: 'Kristall', tools: 'Werkzeug', cloth: 'Kleidung' }; // Vorräte, nicht im Rucksack
const nearBraz = () => (S.own.settle && dist(player.x, player.y, BRAZ.x, BRAZ.y) < brazR()) || (S.own.pass && dist(player.x, player.y, YFIRE.x, YFIRE.y) < 260) || nearWarm();
function splash(h) {
  snd('splash'); burst(h.x, h.y, 4, '#7fc4ee', 10, 120, 4); burst(h.x, h.y, 4, '#ffffff', 6, 90, 3);
}
function take(stack, type) { for (let i = stack.length - 1; i >= 0; i--) if (stack[i] === type) { stack.splice(i, 1); return true; } return false; }
function buzz(p) { if (!S.muted && navigator.vibrate) try { navigator.vibrate(p); } catch (e) { } }
function hurtPlayer(n, txt) {
  if (player.dead > 0) return;
  player.hp -= n; player.hurtT = Math.max(player.hurtT, .8); snd('hurt'); buzz(35);
  shake = Math.max(shake, 6 + n * .25); burst(player.x, player.y, 30, '#ff6060', 6, 90, 3);
  if (txt) ftext(player.x, player.y, 70, '-' + n, '#ff7777', 20);
}
const near = (p, r = 36) => dist(player.x, player.y, p.x, p.y) < r;
function stackTopZ(n) { return 34 + n * 5; }

function doTransfers() {
  const st = player.stack, n = st.length, full = n >= cap();
  const give = (type, p, onArrive) => {
    if (!take(st, type)) return false;
    fly(type, player.x, player.y - 6, stackTopZ(n), p.x, p.y, 12, .28, onArrive); snd('drop'); return true;
  };
  if (questTransfer(give)) return true;
  if (ammoTransfer(give)) return true;
  if (machineTransfer(give, st, full)) return true;
  if (near(GRILL_IN) && give('raw', GRILL_IN, () => S.grillIn++)) return true;
  if (near(GRILL_OUT) && !full && S.grillOut > 0) { S.grillOut--; st.push('cooked'); snd('pick'); return true; }
  if (near({ x: MEAT_CT.zx, y: MEAT_CT.zy }, 42) && S.meatCt < 60 && give('cooked', MEAT_CT, () => S.meatCt++)) return true;
  if (S.own.kiln) {
    if (near(KILN_IN) && give('wood', KILN_IN, () => S.kilnIn++)) return true;
    if (near(KILN_OUT) && !full && S.kilnOut > 0) { S.kilnOut--; st.push('coal'); snd('pick'); return true; }
  }
  if (S.own.coalCt && near({ x: COAL_CT.zx, y: COAL_CT.zy }, 42) && S.coalCt < 60 && give('coal', COAL_CT, () => S.coalCt++)) return true;
  if (S.own.smoke) {
    if (near(FISH_IN) && give('fish', FISH_IN, () => S.fishIn++)) return true;
    if (S.own.stall && near(SMOKE_OUT) && !full && S.smokeOut > 0) { S.smokeOut--; st.push('smoked'); snd('pick'); return true; }
  }
  if (S.own.stall && near({ x: STALL.zx, y: STALL.zy }, 42) && S.stallCt < 60 && give('smoked', STALL, () => S.stallCt++)) return true;
  for (const [pos, key] of [[CASH, 'cashPile'], [CASH2, 'cashPile2']]) {
    if (near(pos, 46) && S[key] > 0) {
      const k = Math.max(1, Math.ceil(S[key] / 12)); S[key] -= k; S.cash += k; snd('coin');
      fly('cash', pos.x, pos.y, 10, player.x, player.y, 40, .25);
      return true;
    }
  }
  return false;
}
function payPad(p, dt) {
  const r = reqOf(p); if (!r) return;
  const pd = paidOf(p);
  p.acc = (p.acc || 0) + dt;
  if (p.acc < .045) return; p.acc = 0;
  let moved = false;
  for (const k in r) {
    const rem = r[k] - (pd[k] || 0); if (rem <= 0) continue;
    if (k === 'wood') { // Holz kommt Stück für Stück aus dem Rucksack
      const z = stackTopZ(player.stack.length);
      if (take(player.stack, 'wood')) { pd.wood = (pd.wood || 0) + 1; fly('wood', player.x, player.y - 6, z, p.x, p.y, 4, .25); moved = true; }
      continue;
    }
    const have = S[k] || 0; if (have <= 0) continue;
    const n = Math.min(have, rem, Math.max(1, Math.ceil(r[k] / 35)));
    S[k] -= n; pd[k] = (pd[k] || 0) + n; moved = true;
    fly(k, player.x, player.y, 40, p.x, p.y, 4, .22);
  }
  if (moved) snd(r.wood || r.stone ? 'drop' : 'coin');
  if (Object.keys(r).every(k => (pd[k] || 0) >= r[k])) {
    S.paid[p.id] = {}; const nm = p.name(); p.buy(); emit('built', 1, false); react(p.id); snd('buy'); shake = Math.max(shake, 5); buzz([25, 40, 25]);
    if (p.info && !banner) { const inf = p.info(); if (inf) banner = { t: 4.5, a: nm + ' ✔', b: inf }; } for (const q of PADS) if (dist(q.x, q.y, p.x, p.y) < 5) q.lock = true;
    burst(p.x, p.y, 10, '#ffe066', 26, 220, 5); burst(p.x, p.y, 10, '#5ee67a', 16, 200, 5);
    ftext(p.x, p.y, 60, nm + ' ✔', '#7cff9a', 20);
    save();
  }
}

function updateYeti(dt) {
  const y = yeti;
  if (y.flash > 0) y.flash -= dt;
  if (y.dead) { y.dead -= dt; if (y.dead <= 0) spawnYeti(); return; }
  const pz = zoneOf(player.x, player.y) === 'forest' && !(player.dead > 0);
  const d = dist(y.x, y.y, player.x, player.y);
  let tx = 820, ty = -150, sp = 55;
  if (pz && d < 430) { tx = player.x; ty = player.y; sp = 62; }
  const dd = dist(y.x, y.y, tx, ty);
  if (y.rest > 0) y.rest -= dt;
  else if (dd > 42) { y.x += (tx - y.x) / dd * sp * dt; y.y += (ty - y.y) / dd * sp * dt; y.anim += dt * 5; y.face = tx > y.x ? 1 : -1; }
  y.x = clamp(y.x, FOREST.x0 + 60, FOREST.x1 - 40); y.y = clamp(y.y, FOREST.y0 + 40, FOREST.y1 - 30);
  if (pz && d < 430) {
    y.castT -= dt;
    if (y.castT <= 0) { y.castT = Math.max(2.6, 3.8 - S.yetiKills * .25); y.rest = 1.6; casts.push({ x: player.x, y: player.y, r: 85, t: 1.25, T: 1.25 }); }
    if (d < 48 && player.hurtT <= 0) { hurtPlayer(8); player.hurtT = 1; }
  }
}

function updateNpc(n, dt) {
  n.axeA += dt * 5; n.xfer -= dt;
  const SP = 150;
  if (n.kind === 'hunter' || n.kind === 'lumber') {
    const isH = n.kind === 'hunter', dest = isH ? GRILL_IN : KILN_IN, item = isH ? 'raw' : 'wood';
    if (!isH && !S.own.kiln) return;
    const capN = 8;
    if (n.stack.length >= capN || (n.mode === 'return' && n.stack.length > 0)) {
      n.mode = 'return';
      if (npcGo(n, dest.x + rand(-2, 2), dest.y, SP, dt) || dist(n.x, n.y, dest.x, dest.y) < 24) {
        if (n.xfer <= 0 && n.stack.length) {
          n.xfer = .08; const z = 30 + n.stack.length * 5; n.stack.pop();
          fly(item, n.x, n.y, z, dest.x, dest.y, 12, .25, isH ? () => S.grillIn++ : () => S.kilnIn++);
        }
      }
      if (!n.stack.length) n.mode = 'hunt';
      return;
    }
    n.mode = 'hunt';
    // Ziel suchen
    const pool = isH ? bears : trees;
    if (!n.target || (isH ? n.target.dead : n.target.stump)) {
      let best = null, bd = 1e9;
      for (const o of pool) {
        if (isH ? o.dead : (o.stump || o.zone !== 'forest')) continue;
        if (npcs.some(m => m !== n && m.target === o)) continue;
        const d = dist(o.x, o.y, n.x, n.y) + (isH ? 0 : Math.abs(o.y + 130) * .5);
        if (d < bd) { bd = d; best = o; }
      }
      n.target = best;
    }
    const g = n.target; if (!g) return;
    const d = dist(n.x, n.y, g.x, g.y);
    if (d > 40) npcGo(n, g.x, g.y + (isH ? 0 : 20), SP, dt);
    else {
      n.hitT -= dt;
      if (n.hitT <= 0) { n.hitT = .5; hurt(g, 1, isH ? 'bear' : 'tree', 'npc', n); if (isH) g.aggro = 0; }
    }
    return;
  }
  // Fischer: angelt an freien Eislöchern und bringt den Fang zur Räucherei
  if (n.kind === 'fisher') {
    if (!S.own.smoke || !S.own.lake) return;
    if (n.stack.length >= 8 || (n.mode === 'return' && n.stack.length)) {
      n.mode = 'return'; n.target = null;
      if (npcGo(n, FISH_IN.x, FISH_IN.y, SP, dt) || dist(n.x, n.y, FISH_IN.x, FISH_IN.y) < 24) {
        if (n.xfer <= 0 && n.stack.length) {
          n.xfer = .08; const z = 30 + n.stack.length * 5; n.stack.pop();
          fly('fish', n.x, n.y, z, FISH_IN.x, FISH_IN.y, 12, .25, () => S.fishIn++);
        }
      }
      if (!n.stack.length) n.mode = 'fish';
      return;
    }
    n.mode = 'fish';
    if (!n.target || n.target.cd > 0) {
      let best = null, bd = 1e9;
      for (const h of holes) {
        if (h.cd > 0 || h === playerHole || npcs.some(m => m !== n && m.target === h)) continue;
        const d = dist(h.x, h.y, n.x, n.y); if (d < bd) { bd = d; best = h; }
      }
      n.target = best; n.fishT = 0;
    }
    const h = n.target;
    if (!h) { npcGo(n, LAKE_X - 60, LAKE_GATE.y, SP * .6, dt); return; }
    if (dist(n.x, n.y, h.x + 28, h.y + 6) > 14) { npcGo(n, h.x + 28, h.y + 6, SP, dt); n.fishT = 0; }
    else {
      n.face = -1; n.fishT = (n.fishT || 0) + dt; h.np = n.fishT / 2.2;
      if (n.fishT >= 2.2) { n.fishT = 0; h.cd = HOLE_CD; splash(h); for (let i = randi(1, 2); i > 0; i--) n.stack.push('fish'); n.target = null; }
    }
    return;
  }
  // Thekenhelfer / Markthelfer: holt bis zu 10 Stück ab und bringt sie zur passenden Theke
  const jobs = SERVE[n.kind]; if (!jobs) return;
  if (n.mode === 'deliver') {
    if (!n.stack.length) { n.mode = 'fill'; n.src = null; return; }
    const it = n.stack[n.stack.length - 1], j = jobs.find(o => o.item === it);
    if (npcGo(n, j.ct.zx, j.ct.zy + 4, SP, dt) || dist(n.x, n.y, j.ct.zx, j.ct.zy) < 20) {
      if (n.xfer <= 0 && S[j.ctKey] < 60) { n.xfer = .08; const z = 30 + n.stack.length * 5; n.stack.pop(); fly(it, n.x, n.y, z, j.ct.x, j.ct.y, 24, .25, () => S[j.ctKey]++); }
    }
    return;
  }
  if (!n.src) {
    let best = null;
    for (const j of jobs) if (j.on() && S[j.ctKey] < 25 && S[j.key] > 0 && (!best || S[j.ctKey] < S[best.ctKey])) best = j;
    n.src = best;
  }
  if (!n.src) { if (n.stack.length) n.mode = 'deliver'; else { const ip = { server: [0, 150], seller: [-300, 520], armorer: [150, -200] }[n.kind]; npcGo(n, ip[0], ip[1], SP * .6, dt); } return; }
  const j = n.src;
  if (npcGo(n, j.pos.x, j.pos.y + 6, SP, dt) || dist(n.x, n.y, j.pos.x, j.pos.y) < 20) {
    if (n.xfer <= 0) {
      n.xfer = .07;
      if (S[j.key] > 0 && n.stack.length < 10) { S[j.key]--; n.stack.push(j.item); }
      else { n.mode = 'deliver'; n.src = null; }
    }
  }
}
const SERVE = {
  server: [
    { key: 'grillOut', pos: GRILL_OUT, item: 'cooked', ct: MEAT_CT, ctKey: 'meatCt', on: () => true },
    { key: 'kilnOut', pos: KILN_OUT, item: 'coal', ct: COAL_CT, ctKey: 'coalCt', on: () => S.own.coalCt },
  ],
  seller: [{ key: 'smokeOut', pos: SMOKE_OUT, item: 'smoked', ct: STALL, ctKey: 'stallCt', on: () => S.own.stall }],
  armorer: [{ key: 'kilnOut', pos: KILN_OUT, item: 'coal', ct: AMMO, ctKey: 'ammoC', on: () => S.own.ammoSt }],
};

function updateQueue(q, dt) {
  if (!q.on()) return;
  q.spawnT -= dt;
  if (q.spawnT <= 0 && q.list.length < q.max()) {
    const col = q.cols[randi(0, q.cols.length - 1)];
    if (q.res) { // Bewohner kommen aus einer Hütte
      const hs = homes(), h = hs[randi(0, hs.length - 1)];
      q.spawnT = rand(2.2, 3.8) / (1 + .3 * S.lv.huts);
      q.list.push({ x: h.x, y: h.y + 14, home: h, want: randi(2, 3 + 2 * S.lv.huts), got: 0, state: 'come', col, anim: 0, takeT: 0, face: 1 });
    } else {
      q.spawnT = rand(1.6, 3.2) / (blizzard() && q.key === 'coalCt' ? 2 : 1) / (1 + .12 * S.lv.huts);
      q.list.push({ x: q.ct.x + rand(-45, 45), y: 820, want: randi(2, 3 + S.lv.furnace), got: 0, state: 'come', col, anim: 0, takeT: 0, face: 1 });
    }
  }
  for (let i = q.list.length - 1; i >= 0; i--) {
    const s = q.list[i];
    let tx, ty;
    if (s.state === 'leave') { if (q.res) { tx = s.home.x; ty = s.home.y + 14; } else { tx = s.lx; ty = 880; } }
    else { const idx = q.list.filter(o => o.state !== 'leave').indexOf(s);[tx, ty] = queueSpot(q, idx); }
    const d = dist(s.x, s.y, tx, ty);
    if (d > 3) { const sp = s.state === 'leave' ? 120 : 125; const k = Math.min(d, sp * dt); s.x += (tx - s.x) / d * k; s.y += (ty - s.y) / d * k; s.anim += dt * 10; s.face = tx >= s.x ? 1 : -1; }
    if (s.state === 'leave' && (q.res ? d < 5 : s.y > 870)) { q.list.splice(i, 1); continue; }
    if (s.state !== 'leave') {
      const idx = q.list.filter(o => o.state !== 'leave').indexOf(s);
      if (idx === 0 && d < 6) {
        s.takeT -= dt;
        if (s.takeT <= 0 && S[q.key] > 0 && s.got < s.want && !frozen(q.key)) {
          s.takeT = .2; S[q.key]--; s.got++;
          fly(q.item, q.ct.x + rand(-20, 20), q.ct.y, 26, s.x, s.y, 30, .2);
        }
        if (s.got >= s.want) {
          const amount = Math.round(s.want * q.price() * (q.item === 'cooked' ? bookMul('animals') : q.item === 'smoked' ? bookMul('fish') : 1) * gearMul('cash') * (1 + .1 * glutLv('cash')) * salesMul() * priceMul() * (bookMul('heart') > 1 ? 1.05 : 1));
          s.state = 'leave'; s.lx = q.ct.x + rand(-40, 40);
          S.sold += s.want; emit('served'); emit({ cooked: 'meatSold', coal: 'coalSold', smoked: 'fishSold' }[q.item], s.want, false); emit('earned', amount, false);
          const bills = Math.min(8, amount);
          for (let b = 0; b < bills; b++) {
            const last = b === bills - 1, val = last ? amount - Math.floor(amount / bills) * (bills - 1) : Math.floor(amount / bills);
            fly('cash', s.x, s.y, 40, q.at.x + rand(-14, 14), q.at.y + rand(-8, 8), 10, .45 + b * .06, () => { S[q.pile] += val; });
          }
          ftext(s.x, s.y, 80, '+' + amount + ' $', '#7cff9a', 18); snd('coin');
        }
      }
    }
  }
}
