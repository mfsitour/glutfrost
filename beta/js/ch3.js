'use strict';
// Glutfrost – Kapitel 3: Der Wolfspass
// Tag und Nacht, Wölfe, nächtliche Angriffe aufs Lager, Palisade, Wachtürme mit Munitionslager,
// der Rudelführer als Boss, Ylva und die Musik.
// =====================================================================
//  TAG & NACHT
// =====================================================================
const DAY_LEN = 360;                       // ein ganzer Tag: 6 Minuten
const DUSK = 270, NIGHT = 285, DAWN = 345; // Dämmerung, Nacht, Morgengrauen
const dayOn = () => S.own.pass;            // Tag und Nacht beginnen mit dem Öffnen des Passes
const phase = () => S.dayT % DAY_LEN;
const isNight = () => dayOn() && phase() >= NIGHT && phase() < DAWN;
function darkness() {
  if (!dayOn()) return 0;
  const p = phase();
  if (p < DUSK) return 0;
  if (p < NIGHT) return (p - DUSK) / (NIGHT - DUSK);
  if (p < DAWN) return 1;
  return 1 - (p - DAWN) / (DAY_LEN - DAWN);
}
// Wer vor diesem Update schon in Kapitel 3 war („bald verfügbar“), bekommt die neue Kapiteltafel noch einmal
if (S.ch >= 3 && S.chSeen >= 3 && !S.own.pass && !S.k3intro) S.chSeen = 2;
S.k3intro = 1;
// Geladener Spielstand mitten in der Nacht: lieber mit einem neuen Morgen anfangen
if (dayOn() && phase() >= DUSK) S.dayT += DAY_LEN - phase();

// =====================================================================
//  WÖLFE
// =====================================================================
let wolves = [], wbolts = [], boss = null, nightRun = null, ammoT = 0, wTowerT = [0, 0], wAim = [-1.57, -1.57];
let wolfHp = () => 8 + 3 * Math.min(8, S.nightNo);
function spawnWolf(kind, x, y) {
  const shadow = Math.random() < (kind === 'atk' ? .12 : .05);
  const w = { kind, x, y, hp: wolfHp() * (shadow ? 1.5 : 1), max: 0, hitCd: 0, flash: 0, anim: rand(0, 6), face: 1, vx: 0, vy: 0, wt: 0, aggro: 0, bite: 0, shadow, path: [], state: 'come', loot: 0 };
  w.max = w.hp; wolves.push(w); return w;
}
function roamSpot() { return [rand(PASS.x0 + 40, PASS.x1 - 40), rand(DEN_Y + 60, PASS.y1 - 60)]; }
function keepRoamers(dt) {
  if (!S.own.pass) return;
  const n = wolves.filter(w => w.kind === 'roam').length;
  ch3.roamT = (ch3.roamT || 0) - dt;
  if (n < 5 && ch3.roamT <= 0) { ch3.roamT = 8; const [x, y] = roamSpot(); if (dist(x, y, player.x, player.y) > 280) spawnWolf('roam', x, y); }
}
const ch3 = {};
// Ziel eines Angreifers: Geldstapel, sonst Ofen, Kohlenmeiler oder Fleischtheke
function wolfTarget() {
  if (S.cashPile >= 20) return { k: 'cash', x: CASH.x, y: CASH.y - 10 };
  const opts = [{ k: 'grill', x: GRILL_OUT.x, y: GRILL_OUT.y - 20 }, { k: 'meatCt', x: MEAT_CT.zx, y: MEAT_CT.zy - 20 }];
  if (S.own.kiln) opts.push({ k: 'kiln', x: KILN_OUT.x, y: KILN_OUT.y - 20 });
  return opts[randi(0, opts.length - 1)];
}
const wallUp = () => S.own.wall && ch3.wallHp > 0;
const wallMax = () => Math.round((60 + 10 * S.nightNo) * (1 + .25 * S.lv.wall)); // „Palisade verstärken“: +25 % je Stufe
const frozen = k => (S.frz[k] || 0) > S.time;
function hurtWolf(w, n, src) {
  if (w.dead) return;
  if (src === 'player') n *= bookMul('pass') > 1 ? 1.1 : 1;
  w.hp -= n; w.flash = .12; w.aggro = 4; snd('hit'); burst(w.x, w.y, 22, '#8a8f99', 4, 90, 3);
  if (w.hp > 0) return;
  w.dead = 1; burst(w.x, w.y, 20, '#9aa0aa', 14, 160, 5); burst(w.x, w.y, 20, '#ffffff', 8, 120, 5);
  spawnDrops('raw', randi(1, 2), w.x, w.y);
  spawnDrops('cash', randi(2, 3), w.x, w.y, 3 + S.lv.furnace);
  if (w.loot > 0) { spawnDrops('cash', Math.min(10, w.loot), w.x, w.y, Math.ceil(w.loot / Math.min(10, w.loot))); w.loot = 0; ftext(w.x, w.y, 60, 'Zurückgeholt!', '#7cff9a', 16); }
  emit('wolf', 1, src === 'player'); discover('wolf'); if (w.shadow) discover('shadow');
  if (src === 'player') rollFind('wolf', w.x, w.y);
}
function swingWolves(near, cd, damage, dt) {
  let hit = false;
  for (const w of wolves) {
    if (w.dead) continue; w.hitCd -= dt;
    if (w.hitCd <= 0 && near(w, 22)) { w.hitCd = cd; hurtWolf(w, damage, 'player'); hit = true; }
  }
  if (boss && !boss.dead) { boss.hitCd -= dt; if (boss.hitCd <= 0 && near(boss, 40)) { boss.hitCd = cd; hurtBoss(damage); hit = true; } }
  return hit;
}
function moveTo(o, tx, ty, sp, dt) {
  const d = dist(o.x, o.y, tx, ty); if (d < 2) return true;
  const k = Math.min(d, sp * dt); o.x += (tx - o.x) / d * k; o.y += (ty - o.y) / d * k;
  o.anim += dt * sp / 10; if (Math.abs(tx - o.x) > 1) o.face = tx > o.x ? 1 : -1;
  return d < 4;
}
function biteCheck(w, dt) {
  w.bite -= dt;
  if (!(player.dead > 0) && dist(w.x, w.y, player.x, player.y) < 30 && w.bite <= 0) { w.bite = .9; hurtPlayer(w.kind === 'atk' ? 5 : 6); }
}
function updateWolf(w, dt) {
  if (w.flash > 0) w.flash -= dt;
  const pd = player.dead > 0 ? 1e9 : dist(w.x, w.y, player.x, player.y);
  if (w.kind === 'roam') {
    const inPass = zoneOf(player.x, player.y) === 'pass';
    if (inPass && pd < 170) w.aggro = 3;
    if (w.aggro > 0 && inPass) { w.aggro -= dt; if (pd > 26) moveTo(w, player.x, player.y, 120, dt); }
    else {
      w.wt -= dt;
      if (w.wt <= 0) { w.wt = rand(1.5, 4); const a = rand(0, TAU), m = Math.random() < .35 ? 0 : 1; w.vx = Math.cos(a) * m; w.vy = Math.sin(a) * m; }
      w.x += w.vx * 40 * dt; w.y += w.vy * 40 * dt; if (w.vx || w.vy) { w.anim += dt * 4; if (Math.abs(w.vx) > .1) w.face = w.vx > 0 ? 1 : -1; }
    }
    w.x = clamp(w.x, PASS.x0 + 25, PASS.x1 - 25); w.y = clamp(w.y, DEN_Y + 30, PASS.y1 - 25);
    biteCheck(w, dt); return;
  }
  // Angreifer: Pass -> Eisfeld -> Nordtor -> Ziel im Lager -> mit Beute zurück
  if (w.state === 'flee') { // erst durchs Nordtor, dann über das Eisfeld zurück in den Pass
    if (w.y > NGATE.y - 30) moveTo(w, w.fx, NGATE.y - 40, 175, dt);
    else if (moveTo(w, PASS_GX, -1040, 175, dt) || w.y < -1030) w.gone = 1;
    return;
  }
  if (pd < 110 && w.y > -1000) { w.aggro = 2; }
  if (w.aggro > 0) { w.aggro -= dt; if (pd > 26) moveTo(w, player.x, player.y, 150, dt); biteCheck(w, dt); return; }
  if (w.y < NGATE.y - 22) { // noch draußen
    const gx = clamp(w.x, NGATE.x0 + 12, NGATE.x1 - 12);
    if (w.y < -985) moveTo(w, PASS_GX + rand(-20, 20), -970, 135, dt); // aus dem Passtor heraus
    else if (wallUp() && w.y > NGATE.y - 48) { // an der Palisade
      w.anim += dt * 6; w.bite -= dt;
      if (w.bite <= 0) { w.bite = .7; ch3.wallHp -= 3; burst(w.x, NGATE.y - 4, 20, '#a87a4a', 3, 80, 3); if (ch3.wallHp <= 0) { ch3.wallHp = 0; snd('boom'); shake = 8; banner = { t: 3, a: '💥 Die Palisade ist gebrochen!', b: 'Halte die Wölfe vom Lager fern!' }; } }
    } else moveTo(w, gx, wallUp() ? NGATE.y - 40 : NGATE.y + 30, 135, dt);
    return;
  }
  if (!w.tgt) w.tgt = wolfTarget();
  if (moveTo(w, w.tgt.x, w.tgt.y, 135, dt)) steal(w);
}
function steal(w) {
  const t = w.tgt; nightRun && (nightRun.stolen = true);
  if (t.k === 'cash' && S.cashPile > 0) { const n = Math.ceil(S.cashPile * .3); S.cashPile -= n; w.loot = n; ftext(w.x, w.y, 70, '-' + n + ' $ gestohlen!', '#ff8080', 18); emit('stolen', n, false); }
  else { S.frz[t.k] = S.time + 45; ftext(w.x, w.y, 70, '❄ eingefroren!', '#bfe6ff', 18); emit('frozen', 1, false); }
  snd('warn'); buzz(60); w.state = 'flee'; w.fx = rand(-30, 30);
}

// =====================================================================
//  NACHT-ANGRIFFE
// =====================================================================
function updateNight(dt) {
  if (!dayOn()) return;
  const before = phase();
  S.dayT += dt;
  const p = phase();
  if (before < DUSK && p >= DUSK) { snd('warn'); banner = { t: 4.5, a: '🌙 Die Nacht bricht herein!', b: 'Ylva: „Die Wölfe kommen – zurück ins Lager!“' }; }
  if (before < NIGHT && p >= NIGHT) {
    S.nightNo++;
    nightRun = { left: Math.min(14, 3 + 2 * (S.nightNo - 1)), t: 0, stolen: false };
    if (S.own.wall) ch3.wallHp = wallMax();
  }
  if (nightRun && nightRun.left > 0 && isNight()) {
    nightRun.t -= dt;
    if (nightRun.t <= 0) { nightRun.t = rand(1.6, 3); nightRun.left--; spawnWolf('atk', PASS_GX + rand(-30, 30), -1020); }
  }
  if (before < DAWN && p >= DAWN && nightRun) {
    // Morgengrauen: übrige Angreifer fliehen
    for (const w of wolves) if (w.kind === 'atk' && !w.dead) { w.state = 'flee'; w.fx = rand(-120, 0); w.aggro = 0; }
    if (!nightRun.stolen) { S.nightsOk++; emit('nightOk', 1, true); toast('🌅 Nacht überstanden!', 'Die Wölfe haben nichts erbeutet.'); }
    else toast('🌅 Der Morgen graut', 'Die Wölfe haben Beute gemacht – stärke die Verteidigung.');
    emit('nights', 1, false); nightRun = null;
    if (S.own.wall) ch3.wallHp = wallMax();
    save();
  }
}
// =====================================================================
//  WACHTÜRME & MUNITION
// =====================================================================
const ammo = () => S.shots + 3 * S.ammoW + 6 * S.ammoC;
function useShot() {
  if (S.shots <= 0) { if (S.ammoC > 0) { S.ammoC--; S.shots += 6; } else if (S.ammoW > 0) { S.ammoW--; S.shots += 3; } }
  if (S.shots <= 0) return false;
  S.shots--; return true;
}
function updateTowers(dt) {
  WATCH.forEach((tw, i) => {
    if (!S.own[i ? 'watch2' : 'watch1']) return;
    wTowerT[i] -= dt;
    let best = null, bd = 300;
    for (const w of wolves) { if (w.dead || w.gone) continue; const d = dist(w.x, w.y, tw.x, tw.y); if (d < bd) { bd = d; best = w; } }
    if (best) wAim[i] = Math.atan2(best.y - tw.y, best.x - tw.x);
    if (best && wTowerT[i] <= 0) {
      if (!useShot()) { if (S.time - (ch3.noAmmoMsg || 0) > 6) { ch3.noAmmoMsg = S.time; ftext(tw.x, tw.y, 90, 'Keine Munition!', '#ff9a6a', 16); } wTowerT[i] = 1; return; }
      wTowerT[i] = .8; wbolts.push({ x: tw.x, y: tw.y, z: 60, tgt: best, sp: 700 });
    }
  });
  for (let i = wbolts.length - 1; i >= 0; i--) {
    const b = wbolts[i], g = b.tgt;
    if (g.dead || g.gone) { wbolts.splice(i, 1); continue; }
    const d = dist(b.x, b.y, g.x, g.y);
    if (d < 14) { wbolts.splice(i, 1); hurtWolf(g, 3 + Math.floor(S.lv.furnace / 2) + S.lv.watch, 'tower'); continue; }
    b.x += (g.x - b.x) / d * b.sp * dt; b.y += (g.y - b.y) / d * b.sp * dt; b.z = lerp(b.z, 20, dt * 4);
  }
}
// Holz und Kohle ins Munitionslager bringen (aus doTransfers)
function ammoTransfer(give) {
  if (!S.own.ammoSt || !near({ x: AMMO.zx, y: AMMO.zy }, 40)) return false;
  if (S.ammoC + S.ammoW >= 60) return false;
  if (give('coal', AMMO, () => S.ammoC++)) return true;
  // Holz nur, wenn keine Baustelle es braucht
  if (!siteFor('wood') && give('wood', AMMO, () => S.ammoW++)) return true;
  return false;
}

// =====================================================================
//  DER RUDELFÜHRER
// =====================================================================
const BOSS_MAX = 1400;
function spawnBoss() { boss = { x: BOSS_HOME.x, y: BOSS_HOME.y, hp: BOSS_MAX, max: BOSS_MAX, low: BOSS_MAX, hitCd: 0, flash: 0, anim: 0, face: -1, castT: 2.5, howlT: 6, bite: 0, dash: null, adds: 0 }; }
if (S.own.den && !S.bossDead) spawnBoss();
function hurtBoss(n) {
  const b = boss; b.hp -= n * (bookMul('pass') > 1 ? 1.1 : 1); b.flash = .12; b.low = Math.min(b.low, b.hp);
  snd('hit'); burst(b.x, b.y, 50, '#5a5f6a', 4, 140, 4);
  if (b.hp > 0) return;
  b.dead = 1; S.bossDead = 1; snd('boom'); shake = 16; buzz([80, 40, 120]);
  spawnDrops('cash', 16, b.x, b.y, 40 + 10 * S.lv.furnace); spawnDrops('crystal', 8, b.x, b.y); spawnDrops('raw', 10, b.x, b.y);
  discover('boss'); rollFind('boss', b.x, b.y);
  burst(b.x, b.y, 50, '#3a3f4a', 30, 260, 6); burst(b.x, b.y, 40, '#ffffff', 20, 220, 6);
  banner = { t: 5, a: '🐺 Der Rudelführer ist besiegt!', b: 'Der Pass nach Norden ist frei.' };
  for (const w of wolves) if (w.kind === 'add') w.dead = 1;
  save();
}
function updateBoss(dt) {
  const b = boss; if (!b || b.dead) return;
  if (b.flash > 0) b.flash -= dt;
  const inDen = zoneOf(player.x, player.y) === 'den' && !(player.dead > 0);
  if (!inDen) {
    // Spieler weg: langsam heilen, aber nie ganz (höchstens ein Viertel über den Tiefststand)
    b.hp = Math.min(b.max, b.low + b.max * .25, b.hp + 6 * dt);
    moveTo(b, BOSS_HOME.x, BOSS_HOME.y, 60, dt); b.dash = null; return;
  }
  const ph = b.hp > b.max * .66 ? 1 : b.hp > b.max * .33 ? 2 : 3;
  if (b.dash) { // Sprung zum markierten Kreis
    b.dash.t -= dt;
    if (b.dash.t <= 0) { b.x = b.dash.x; b.y = b.dash.y; b.dash = null; }
    return;
  }
  const d = dist(b.x, b.y, player.x, player.y);
  if (d > 44) moveTo(b, player.x, player.y, ph === 3 ? 95 : 75, dt);
  b.bite -= dt; if (d < 50 && b.bite <= 0) { b.bite = 1; hurtPlayer(10); }
  b.castT -= dt;
  if (b.castT <= 0) {
    b.castT = ph === 1 ? 3.6 : ph === 2 ? 3 : 2.2;
    const n = ph === 3 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const tx = player.x + (i ? rand(-90, 90) : 0), ty = player.y + (i ? rand(-60, 60) : 0);
      casts.push({ x: tx, y: ty, r: 64, t: 1.1 + i * .5, T: 1.1 + i * .5, wolf: 1, dmg: 20, cb: i ? null : c => { if (boss && !boss.dead) boss.dash = { x: c.x, y: c.y, t: 0 }; } });
    }
  }
  if (ph >= 2) {
    b.howlT -= dt;
    const adds = wolves.filter(w => w.kind === 'add' && !w.dead).length;
    if (b.howlT <= 0 && adds < 4) {
      b.howlT = 12; snd('warn'); ftext(b.x, b.y, 130, 'AUUUUH!', '#dfe6ff', 22);
      for (let i = 0; i < 2; i++) { const w = spawnWolf('roam', b.x + rand(-80, 80), b.y + rand(20, 60)); w.kind = 'add'; w.aggro = 99; }
    }
  }
  b.x = clamp(b.x, PASS.x0 + 50, PASS.x1 - 50); b.y = clamp(b.y, PASS.y0 + 40, DEN_Y - 30);
}
function updateAdds(w, dt) {
  if (w.flash > 0) w.flash -= dt;
  if (!(player.dead > 0) && zoneOf(player.x, player.y) === 'den') { if (dist(w.x, w.y, player.x, player.y) > 26) moveTo(w, player.x, player.y, 125, dt); biteCheck(w, dt); }
  w.x = clamp(w.x, PASS.x0 + 30, PASS.x1 - 30); w.y = clamp(w.y, PASS.y0 + 30, DEN_Y - 25);
}

// =====================================================================
//  UPDATE
// =====================================================================
function updateCh3(dt) {
  if (S.ch < 3 && !S.own.pass) return;
  if (S.own.wall && ch3.wallHp == null) ch3.wallHp = wallMax();
  updateNight(dt);
  keepRoamers(dt);
  for (const w of wolves) w.kind === 'add' ? updateAdds(w, dt) : updateWolf(w, dt);
  wolves = wolves.filter(w => !w.dead && !w.gone);
  updateTowers(dt);
  if (S.own.den && !S.bossDead && !boss) spawnBoss();
  updateBoss(dt);
  for (const k in S.frz) if (S.frz[k] <= S.time) delete S.frz[k];
  updateMusic();
}
function ch3Solids(a) {
  if (S.own.watch1) a.push(WATCH[0]);
  if (S.own.watch2) a.push(WATCH[1]);
  if (S.own.pass) a.push(YFIRE);
  if (boss && !boss.dead) a.push({ x: boss.x, y: boss.y, r: 30 });
}

// =====================================================================
//  BAU-FELDER, TEXTE, FIGUR, AUFTRÄGE, SAMMELBUCH, ERFOLGE
// =====================================================================
PADS.push(
  { id: 'pass', x: PASS_GX, y: -930, ic: '🏔️', name: () => 'Wolfspass öffnen', cost: () => S.own.pass ? null : 4500, vis: () => S.ch >= 3, buy: () => { S.own.pass = 1; S.dayT = 0; } },
  { id: 'wall', x: 0, y: -262, ic: '🪵', name: () => 'Palisade bauen', req: () => S.own.wall ? null : { cash: 4000, wood: 50 }, vis: () => S.own.pass, buy: () => { S.own.wall = 1; ch3.wallHp = wallMax(); } },
  { id: 'watch1', x: WATCH[0].x, y: WATCH[0].y, ic: '🗼', name: () => 'Wachturm bauen', req: () => S.own.watch1 ? null : { cash: 6000, stone: 50 }, vis: () => S.own.pass, buy: () => { S.own.watch1 = 1; S.shots += 30; } },
  { id: 'ammoSt', x: AMMO.x, y: AMMO.y, ic: '🧺', name: () => 'Munitionslager bauen', req: () => S.own.ammoSt ? null : { cash: 2500, wood: 30 }, vis: () => S.own.watch1, buy: () => S.own.ammoSt = 1 },
  { id: 'watch2', x: WATCH[1].x, y: WATCH[1].y, ic: '🗼', name: () => '2. Wachturm bauen', req: () => S.own.watch2 ? null : { cash: 10000, stone: 60 }, vis: () => S.own.ammoSt && S.nightsOk >= 1, buy: () => S.own.watch2 = 1 },
  // Dauerhafte Verwendung für Stein und Eisen: beliebig oft verstärken (freiwillig, der Pfeil führt nicht dorthin)
  { id: 'wallUp', x: 70, y: -215, ic: '🪨', name: () => 'Palisade verstärken ' + (S.lv.wall + 1), desc: 'Hält 25 % mehr aus · stehen bleiben', optional: () => true, req: () => ({ cash: Math.round(1500 * (S.lv.wall + 1) * priceMul()), stone: 40 + 25 * S.lv.wall }), vis: () => S.own.wall, buy: () => { S.lv.wall++; ch3.wallHp = wallMax(); } },
  { id: 'watchUp', x: -70, y: -215, ic: '⛓️', name: () => 'Wachtürme verstärken ' + (S.lv.watch + 1), desc: 'Bolzen treffen härter · stehen bleiben', optional: () => true, req: () => ({ cash: Math.round(1500 * (S.lv.watch + 1) * priceMul()), iron: 30 + 20 * S.lv.watch }), vis: () => S.own.watch1, buy: () => S.lv.watch++ },
  { id: 'armorer', x: 180, y: -215, ic: '🛡️', name: () => 'Zeugwart anheuern', cost: () => S.own.armorer ? null : 8000, vis: () => S.own.ammoSt && S.own.lumber && S.own.kiln, buy: () => { S.own.armorer = 1; spawnNpc('armorer'); } },
  { id: 'den', x: PASS_GX, y: DEN_Y + 70, ic: '🐺', name: () => 'Höhle betreten', cost: () => S.own.den ? null : 8000, vis: () => S.own.wall && S.own.watch1 && S.nightsOk >= 5, buy: () => { S.own.den = 1; spawnBoss(); } },
);
Object.assign(PAD_TXT, {
  pass: ['Der Weg nach Norden – nachts kommen Wölfe', 'Der Pass ist offen. Ab jetzt gibt es Tag und Nacht – nachts greifen Wölfe an!'],
  wall: ['Hält die Wölfe am Nordtor auf', 'Die Palisade bremst die Wölfe. Sie wird jeden Morgen repariert.'],
  watch1: ['Schießt auf Wölfe – braucht Munition', 'Der Wachturm schießt auf Wölfe. Er braucht Holz oder Kohle als Munition.'],
  ammoSt: ['Holz & Kohle für die Wachtürme', 'Bring Holz oder Kohle hierher: Kohle gibt 6 Schuss, Holz 3.'],
  watch2: ['Doppelte Feuerkraft am Nordtor'],
  armorer: ['Bringt Kohle ins Munitionslager', 'Der Zeugwart füllt das Munitionslager jetzt mit Kohle aus dem Meiler.'],
  den: ['Stell dich dem Rudelführer!', 'Der Rudelführer wartet in der Höhle. Weiche seinen Sprüngen (rote Kreise) aus!'],
});
for (const p of PADS) { const t = PAD_TXT[p.id]; if (t && !p.desc) { p.desc = t[0]; if (t[1]) p.info = () => t[1]; } }
if (S.own.armorer && !npcs.some(n => n.kind === 'armorer')) spawnNpc('armorer');
NPC_COL.armorer = '#7a6a8a';

FIG.ylva = { name: 'Ylva', role: 'die Kundschafterin', x: YFIRE.x + 46, y: YFIRE.y + 18, coat: '#3f7a4a', face: -1, opts: { hat: '#e9e2c9', staff: '#cfd6dd' }, vis: () => S.own.pass };
CHAT.ylva = [
  () => isNight() ? 'Die Wölfe sind unterwegs! Zum Lager, schnell!' : 'Nachts kommen sie über den Pass. Halte die Palisade.',
  () => S.own.watch1 ? 'Die Türme brauchen Munition – Kohle hält am längsten.' : 'Ein Wachturm am Nordtor würde uns retten.',
  () => S.bossDead ? 'Ohne ihren Anführer sind die Wölfe nur noch halb so mutig.' : 'Der Rudelführer haust in der Höhle hinter dem Pass.',
];
QUESTS.ylva = [
  { id: 'wolves', t: n => `Erlege ${n} Wölfe`, ev: 'wolf', n: () => 6 + S.lv.furnace, ok: () => S.own.pass },
  { id: 'night', t: () => 'Überstehe eine Nacht ohne Verluste', ev: 'nightOk', n: () => 1, ok: () => S.own.wall },
  { id: 'wood', t: n => `Bring mir ${n} Holz für die Wachfeuer`, item: 'wood', n: () => 10 + S.lv.furnace, ok: () => true },
  { id: 'coal', t: n => `Bring mir ${n} Kohle`, item: 'coal', n: () => 8 + S.lv.furnace, ok: () => S.own.kiln, r: { crystal: 3 } },
];
FIRST_OFFER.ylva = 40;
Object.assign(REACT, {
  pass: ['ylva', 'Der Pass ist offen. Bleib nachts in der Nähe des Lagers!'],
  wall: ['bjarne', 'Die Palisade steht. Die hält was aus.'],
  watch1: ['ylva', 'Von da oben sieht man sie kommen.'],
  den: ['ylva', 'Viel Glück. Pass auf seine Sprünge auf!'],
});
EXTRA_FINDS.push(
  { id: 'kette', n: 'Wolfszahnkette', ic: '📿', src: 'wolf', p: .05, d: 'Jemand hat sie vor langer Zeit getragen – vielleicht eine Jägerin.' },
  { id: 'karte', n: 'Zerrissene Karte', ic: '🗺️', src: 'boss', p: 1, d: 'Hinter dem Pass ist eine alte Erzgrube eingezeichnet. Bjarne wird Augen machen.' },
);
BOOK.push({ id: 'pass', n: 'Der Wolfspass', bonus: '+10 % Schaden gegen Wölfe', e: [
  { id: 'wolf', n: 'Wolf', ic: '🐺', d: 'Jagt im Rudel. Nachts wird er mutig.' },
  { id: 'shadow', n: 'Schattenwolf', ic: '🌑', d: 'Schwarz wie die Nacht und zäher als seine Brüder.' },
  { id: 'boss', n: 'Rudelführer', ic: '👑', d: 'Narbig, riesig, klug. Er springt, bevor man ihn kommen sieht.' },
  EXTRA_FINDS[EXTRA_FINDS.length - 2], EXTRA_FINDS[EXTRA_FINDS.length - 1],
] });
ACH.push(
  { id: 'night1', n: 'Erste Nachtwache', d: 'Wehre einen Nachtangriff ab.', ok: () => S.nightsOk >= 1, r: { cash: 300 } },
  { id: 'night10', n: 'Unbezwingbar', d: 'Wehre 10 Nachtangriffe ab.', ok: () => S.nightsOk >= 10, r: { cash: 1500, sparks: 1 } },
  { id: 'wolf50', n: 'Wolfsjäger', d: 'Erlege 50 Wölfe.', ok: () => stv('wolf') >= 50, r: { cash: 800 } },
  { id: 'boss1', n: 'Rudelbezwinger', d: 'Besiege den Rudelführer.', ok: () => S.bossDead, r: { sparks: 2 } },
  { id: 'furn7', n: 'Glutwächter', d: 'Bring den Ofen auf Stufe 7.', ok: () => S.lv.furnace >= 7, r: { cash: 1000 } },
);
STATS.splice(5, 0, ['Wölfe erlegt', () => stv('wolf')], ['Nächte überstanden', () => S.nightsOk + ' / ' + stv('nights')]);

// =====================================================================
//  HINWEISE
// =====================================================================
function ch3Hint(st) {
  if (!dayOn()) return null;
  // Nachts: Angreifer bekämpfen
  if (isNight() || wolves.some(w => w.kind === 'atk' && w.state !== 'flee')) {
    const w = nearestOf(wolves, player.x, player.y, o => o.kind === 'atk' && o.state !== 'flee' && o.y > -1000);
    if (w && player.hp > 25) return { x: w.x, y: w.y, t: 'Verteidige das Lager! 🐺', soft: 1 };
  }
  const p = phase();
  if (p >= DUSK - 20 && p < NIGHT && zoneOf(player.x, player.y) !== 'camp' && dist(player.x, player.y, 0, 0) > 500) return { x: 0, y: -200, t: 'Zurück ins Lager – die Nacht kommt! 🌙' };
  return null;
}
function ammoHint(st) {
  if (!S.own.ammoSt || ammo() >= 90) return null;
  if (st.includes('coal') || (st.includes('wood') && !siteFor('wood'))) return { x: AMMO.zx, y: AMMO.zy, t: 'Bring Munition zum Munitionslager 🧺' };
  if (!S.own.armorer && S.kilnOut > 0 && st.length === 0 && ammo() < 40) return { ...KILN_OUT, t: 'Hol Kohle für die Wachtürme' };
  return null;
}
function bossHint(st) {
  if (!boss || boss.dead || player.hp < 70 || st.length > 4) return null;
  return { x: boss.x, y: boss.y + 40, t: 'Besiege den Rudelführer! Weiche den roten Kreisen aus', soft: 1 };
}

// =====================================================================
//  ZEICHNEN
// =====================================================================
function drawCh3Ground(t) {
  if (S.ch < 3 && !S.own.pass) return;
  // Pass: felsiger Weg zwischen Klippen
  ctx.fillStyle = '#e6ebf0'; ctx.fillRect(PASS.x0, PASS.y0, PASS.x1 - PASS.x0, PASS.y1 - PASS.y0);
  ctx.fillStyle = 'rgba(200,210,222,.6)';
  ctx.beginPath(); ctx.moveTo(PASS_GX - 40, PASS.y1); ctx.quadraticCurveTo(PASS_GX + 90, -1200, PASS_GX - 20, DEN_Y); ctx.lineTo(PASS_GX + 40, DEN_Y); ctx.quadraticCurveTo(PASS_GX + 150, -1200, PASS_GX + 40, PASS.y1); ctx.closePath(); ctx.fill();
  // Höhle
  ctx.fillStyle = S.own.den ? '#d3d9e0' : '#dde2e8'; ctx.fillRect(PASS.x0, PASS.y0, PASS.x1 - PASS.x0, DEN_Y - PASS.y0);
  ell(PASS_GX, PASS.y0 + 40, 120, 60, '#59606c'); ell(PASS_GX, PASS.y0 + 46, 96, 44, '#2f343d');
  // Klippen an den Seiten
  for (let y = PASS.y0; y < PASS.y1; y += 70) {
    for (const [x0, s] of [[PASS.x0, -1], [PASS.x1, 1]]) {
      const w = 40 + ((y * 7) % 30);
      poly([x0, y, x0 + s * w, y + 20, x0 + s * (w - 12), y + 70, x0, y + 70], '#aab4c0');
      poly([x0, y + 10, x0 + s * (w - 16), y + 26, x0 + s * (w - 22), y + 60, x0, y + 60], '#c3ccd6');
    }
  }
  // Ylvas Feuer: Wärmeschein
  const g = ctx.createRadialGradient(YFIRE.x, YFIRE.y, 8, YFIRE.x, YFIRE.y, 110);
  g.addColorStop(0, 'rgba(255,190,90,.45)'); g.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(YFIRE.x, YFIRE.y, 110, 0, TAU); ctx.fill();
  // Munitionslager-Feld
  if (S.own.ammoSt) { rr(AMMO.x - 28, AMMO.y - 24, 56, 48, 8, 'rgba(60,62,70,.85)'); }
}
function addCh3(add, t) {
  if (S.ch < 3 && !S.own.pass) return;
  add(YFIRE.y, () => { at(YFIRE.x, YFIRE.y); drawBrazier(t, true); });
  if (S.own.wall) add(NGATE.y, () => drawWall(t));
  WATCH.forEach((w, i) => { if (S.own[i ? 'watch2' : 'watch1']) add(w.y, () => { at(w.x, w.y); drawWatch(t, wAim[i]); }); });
  if (S.own.ammoSt) add(AMMO.y, () => { at(AMMO.x, AMMO.y); drawAmmo(); });
  for (const w of wolves) if (onScreen(w.x, w.y)) add(w.y, () => { at(w.x, w.y); drawWolf(w, t); if (w.hp < w.max) screenHp(w, 40, w.hp / w.max); if (w.loot) { at(w.x, w.y, 40); drawItem('cash'); } });
  if (boss && !boss.dead && onScreen(boss.x, boss.y, 200)) add(boss.y, () => { at(boss.x, boss.y); drawBoss(boss, t); screenHp(boss, 110, boss.hp / boss.max, '#ffb12b'); });
  for (const k of ['grill', 'kiln', 'meatCt']) if (frozen(k)) {
    const p = k === 'grill' ? GRILL_OUT : k === 'kiln' ? KILN_OUT : { x: MEAT_CT.zx, y: MEAT_CT.zy };
    add(p.y + 1, () => { at(p.x, p.y, 30); ctx.globalAlpha = .85; txt('❄', 0, 0, 26, '#bfe6ff', 'center', 'rgba(20,60,100,.5)'); ctx.globalAlpha = 1; });
  }
}
function drawWolfBolts() { for (const b of wbolts) { at(b.x, b.y, b.z); const a = Math.atan2(b.tgt.y - b.y, b.tgt.x - b.x); ctx.rotate(Math.atan2(Math.sin(a) * TY, Math.cos(a))); rr(-10, -1.5, 20, 3, 1, '#4a3020'); poly([10, -3, 15, 0, 10, 3], '#e8eef4'); } }
function drawWolf(w, t) {
  const s = w.kind === 'add' ? 1.05 : 1;
  ctx.scale(w.face * s, s);
  shadow(22, 7);
  const bob = Math.sin(w.anim) * 1.5, lg = Math.sin(w.anim) * 4;
  const body = w.shadow ? '#3a3d48' : '#8d939e', dark = w.shadow ? '#24262e' : '#6b717c', belly = w.shadow ? '#4a4e5a' : '#c9ced6';
  rr(-15, -12, 5, 12 + lg * .3, 2, dark); rr(-6, -12, 5, 12 - lg * .3, 2, dark);
  rr(7, -12, 5, 12 - lg * .3, 2, dark); rr(15, -12, 5, 12 + lg * .3, 2, dark);
  poly([-20, -20 + bob, -36, -30 + bob + Math.sin(t * 6 + w.x) * 3, -30, -16 + bob], dark); // Schwanz
  ell(0, -19 + bob, 22, 10, body); ell(-2, -14 + bob, 18, 5, belly);
  ell(21, -24 + bob, 9, 8, body); poly([24, -24 + bob, 37, -21 + bob, 26, -17 + bob], body); // Kopf & Schnauze
  poly([16, -29 + bob, 18, -39 + bob, 22, -30 + bob], dark); poly([22, -30 + bob, 25, -39 + bob, 28, -29 + bob], dark); // Ohren
  ell(36, -21 + bob, 1.8, 1.6, '#1a1a1a');
  ell(25, -26 + bob, 1.6, 1.4, darkness() > .3 || w.shadow ? '#ffd34d' : '#1a1a1a');
  if (w.flash > 0) { ctx.globalAlpha = .5; ell(4, -20, 28, 13, '#ff4d4d'); ctx.globalAlpha = 1; }
}
function drawBoss(b, t) {
  ctx.scale(b.face * 1.9, 1.9);
  shadow(30, 10);
  const bob = Math.sin(b.anim) * 1.5, lg = Math.sin(b.anim) * 4;
  rr(-16, -13, 6, 13 + lg * .3, 2, '#2a2c33'); rr(-6, -13, 6, 13 - lg * .3, 2, '#2a2c33');
  rr(7, -13, 6, 13 - lg * .3, 2, '#2a2c33'); rr(16, -13, 6, 13 + lg * .3, 2, '#2a2c33');
  poly([-20, -22 + bob, -38, -34 + bob + Math.sin(t * 5) * 3, -31, -17 + bob], '#2a2c33');
  ell(0, -21 + bob, 24, 12, '#4b505c'); ell(10, -27 + bob, 16, 12, '#5d6370'); // Mähne
  ell(23, -27 + bob, 10, 9, '#4b505c'); poly([26, -27 + bob, 40, -23 + bob, 28, -19 + bob], '#4b505c');
  poly([17, -32 + bob, 19, -44 + bob, 23, -33 + bob], '#2a2c33'); poly([23, -33 + bob, 27, -44 + bob, 30, -32 + bob], '#2a2c33');
  ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(20, -33 + bob); ctx.lineTo(27, -24 + bob); ctx.stroke(); // Narbe
  ell(26, -29 + bob, 2, 1.7, '#ff5a3a'); ell(39, -23 + bob, 2, 1.8, '#111');
  if (b.flash > 0) { ctx.globalAlpha = .5; ell(4, -22, 30, 15, '#ff4d4d'); ctx.globalAlpha = 1; }
}
function drawWall(t) {
  const hp = ch3.wallHp || 0, broken = hp <= 0, n = 7;
  for (let i = 0; i < n; i++) {
    const x = lerp(NGATE.x0 + 4, NGATE.x1 - 4, i / (n - 1)), h = broken ? (i % 2 ? 10 : 16) : 34 + (i % 2) * 4;
    at(x, NGATE.y);
    rr(-5, -h, 10, h, 2, '#8a5a32'); poly([-5, -h, 0, -h - 7, 5, -h], broken ? '#6b4426' : '#a8764a');
    rr(-5, -h, 4, h, 2, 'rgba(255,255,255,.12)');
  }
  if (!broken) { at(0, NGATE.y); rr(-58, -24, 116, 5, 2, '#6b4426'); rr(-58, -12, 116, 5, 2, '#6b4426'); }
  if (hp < wallMax() && S.own.wall) { at(0, NGATE.y, 50); rr(-30, -4, 60, 7, 3, 'rgba(0,0,0,.4)'); rr(-29, -3, 58 * clamp(hp / wallMax(), 0, 1), 5, 2, '#ffb34d'); }
}
function drawWatch(t, aim) {
  shadow(22, 9);
  rr(-16, -46, 32, 46, 4, '#9aa3ad'); rr(-16, -46, 12, 46, 4, '#b4bcc5');
  for (let y = -40; y < 0; y += 10) { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(-16, y, 32, 2); }
  rr(-22, -54, 44, 10, 3, '#7a5230'); rr(-22, -54, 44, 4, 2, '#946640');
  ctx.save(); ctx.translate(0, -62); ctx.rotate(Math.atan2(Math.sin(aim) * TY, Math.cos(aim)));
  rr(-4, -3, 22, 6, 2, '#5a3c22'); rr(10, -9, 3, 18, 1, '#3b2a1c'); ctx.restore();
  const fl = Math.sin(t * 12) * 1.5; ell(18, -64, 4, 6 + fl, '#ffb12b'); ell(18, -63, 2, 3, '#fff2b0');
}
function drawAmmo() {
  shadow(20, 8);
  rr(-18, -22, 36, 22, 3, '#8a5a32'); rr(-18, -22, 36, 5, 2, '#a8764a');
  const n = Math.min(8, Math.ceil((S.ammoW + S.ammoC) / 4));
  for (let i = 0; i < n; i++) { at(AMMO.x - 9 + (i % 3) * 9, AMMO.y - 2, 22 + Math.floor(i / 3) * 5); drawItem(i % 2 && S.ammoC ? 'coal' : S.ammoW ? 'wood' : 'coal'); }
}
// Nacht: dunkle Schicht mit Lichtkreisen um Ofen, Feuer, Türme und Spieler
let nightCv = null;
function drawNight() {
  const k = Math.max(darkness(), typeof caveDark === 'function' ? caveDark() : 0); if (k <= 0) return;
  if (!nightCv) nightCv = document.createElement('canvas');
  if (nightCv.width !== cv.width || nightCv.height !== cv.height) { nightCv.width = cv.width; nightCv.height = cv.height; }
  const g = nightCv.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, nightCv.width, nightCv.height);
  g.fillStyle = `rgba(12,22,52,${.62 * k})`; g.fillRect(0, 0, nightCv.width, nightCv.height);
  g.globalCompositeOperation = 'destination-out';
  const light = (x, y, r) => {
    const p = P(x, y), R = r * Z * DPR, px = p[0] * DPR, py = p[1] * DPR;
    const gr = g.createRadialGradient(px, py, R * .2, px, py, R); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(px, py, R, R * TY, 0, 0, TAU); g.fill();
  };
  light(FURN.x, FURN.y, 260 + 20 * S.lv.furnace); light(player.x, player.y, 150);
  if (S.own.settle) light(BRAZ.x, BRAZ.y, 180);
  light(YFIRE.x, YFIRE.y, 150);
  WATCH.forEach((w, i) => { if (S.own[i ? 'watch2' : 'watch1']) light(w.x, w.y, 130); });
  for (const w of KIT.warm) if (w.on() && onScreen(w.x, w.y, 400)) light(w.x, w.y, Math.min(caveDark() > 0 ? 170 : 260, w.r));
  screenT(); ctx.drawImage(nightCv, 0, 0, W, H);
  // Leuchtende Wolfsaugen
  if (k > .4) for (const w of wolves) { const p = P(w.x + 24 * w.face, w.y, 26); ell(p[0], p[1], 2.2 * Z, 2 * Z, 'rgba(255,215,90,.9)'); }
}
function drawCh3HUD(top) {
  if (!dayOn()) return;
  const p = phase();
  let s = null;
  if (isNight()) s = '🌙 Nacht ' + S.nightNo + ' – noch ' + Math.ceil(DAWN - p) + 's';
  else if (p >= DUSK - 30 && p < NIGHT) s = '🌙 Nacht in ' + Math.ceil(NIGHT - p) + 's';
  if (s && !blizzard()) txt(s, W / 2, top + 132, 15, '#ffffff', 'center', '#1d2c55');
  // Lebensbalken des Rudelführers, solange man in der Höhle ist
  if (boss && !boss.dead && zoneOf(player.x, player.y) === 'den') {
    const bw = Math.min(260, W - 160), bx = W / 2 - bw / 2, by = H - 104;
    rr(bx, by, bw, 16, 8, 'rgba(25,35,50,.7)'); rr(bx + 2, by + 2, (bw - 4) * clamp(boss.hp / boss.max, 0, 1), 12, 6, '#ff8a2a');
    txt('👑 Rudelführer', W / 2, by - 10, 13, '#ffffff', 'center', 'rgba(0,0,0,.5)');
  }
  if (S.own.ammoSt || S.own.watch1) {
    const x = W - 120, y = hudColY;
    rr(x, y, 108, 34, 17, 'rgba(25,35,50,.55)');
    txt('🏹', x + 20, y + 17, 15, '#fff', 'center', null);
    txt(String(ammo()), x + 96, y + 17, 17, ammo() < 20 ? '#ffb35c' : '#fff', 'right', 'rgba(0,0,0,.35)');
  }
}

// =====================================================================
//  MUSIK (im Code erzeugt, ab Kapitel 3)
// =====================================================================
let musT = 0, musStep = 0;
const DAY_SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3];
const NIGHT_SCALE = [220, 261.6, 293.7, 329.6, 392, 440];
function tone(f, d, v, type = 'sine', when = 0) {
  if (!AC) return;
  const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .05);
}
function updateMusic() {
  if (!AC || S.muted || !S.music || S.ch < 3 || paused) return;
  const now = performance.now();
  if (now < musT) return;
  const night = darkness() > .5, sc = night ? NIGHT_SCALE : DAY_SCALE;
  musStep++;
  if (night) {
    musT = now + 420;
    if (musStep % 2 === 0) tone(55, .35, .05, 'triangle');                // Herzschlag
    if (musStep % 8 === 0) tone(110, 3, .025, 'sawtooth');
    if (Math.random() < .35) tone(sc[randi(0, sc.length - 1)] / 2, 1.2, .018, 'triangle');
  } else {
    musT = now + 900;
    if (musStep % 8 === 0) tone(sc[0] / 2, 6, .02, 'sine');               // Grundton
    if (Math.random() < .55) tone(sc[randi(0, sc.length - 1)], 2.4, .022, 'sine');
  }
}
