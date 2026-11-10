'use strict';
// Glutfrost – Kapitel 5: Die Weiße Weite
// Östlich des Passes: Schneeochsen -> Fell -> Schneiderei -> Kleidung. Schlitten für weite Wege,
// Whiteouts (eisige Schneestürme) und Polarlichter. Am Ende: der Schneewyrm.
// =====================================================================
const WEITE = { x0: 130, x1: 1500, y0: -1900, y1: -1000 };
const WYRM_X = 1100, WYRM_Y = -1500;                   // Wyrm-Senke oben rechts
const TAILOR = { x: 360, y: -1330, r: 28 }, YURT = { x: 240, y: -1480, r: 34 };
addZone({ id: 'weite', r: WEITE, parent: 'pass', wp: [[PASS.x1 - 40, -1200], [PASS.x1 + 50, -1200]], sub: (x, y) => (x > WYRM_X && y < WYRM_Y) ? 'wyrm' : 'weite',
  subs: [{ id: 'wyrm', parent: 'weite', wp: [[1300, WYRM_Y + 50], [1300, WYRM_Y - 50]] }] });
GATES.gY = 'wyrmGate';
fence(FIELD.x1, WEITE.y1, WEITE.x1, WEITE.y1); fence(WEITE.x1, WEITE.y0, WEITE.x1, WEITE.y1); fence(WEITE.x0, WEITE.y0, WEITE.x1, WEITE.y0); fence(WEITE.x0, WEITE.y0, WEITE.x0, PASS.y0);
fence(WYRM_X, WEITE.y0, WYRM_X, WYRM_Y); fence(WYRM_X, WYRM_Y, 1250, WYRM_Y); fence(1250, WYRM_Y, 1350, WYRM_Y, 'gY'); fence(1350, WYRM_Y, WEITE.x1, WYRM_Y);
const weiteOpen = () => S.own.weite;
KIT.warm.push({ x: YURT.x, y: YURT.y, r: 250, on: () => S.own.tailor });
const WFIRE = { x: 1000, y: -1430 }; // Feuer vor der Wyrm-Senke
KIT.warm.push({ x: WFIRE.x, y: WFIRE.y, r: 240, on: () => S.own.wyrmGate });
KIT.add.push((add, t) => { if (S.own.wyrmGate && onScreen(WFIRE.x, WFIRE.y)) add(WFIRE.y, () => { at(WFIRE.x, WFIRE.y); drawBrazier(t, true); }); });

// ---------- Wetter: Whiteout & Polarlicht ----------
let auroraT = 0;
const inWeite = () => ['weite', 'wyrm'].includes(zoneOf(player.x, player.y));
const coldMul = () => (inWeite() ? (blizzard() ? 1.8 : 1.25) : 1);   // in der Weite ist es kälter, im Whiteout eisig
const salesMul = () => auroraT > 0 ? 1.5 : 1;                        // Polarlicht: alle zahlen mehr
KIT.update.push(dt => {
  if (auroraT > 0) auroraT -= dt;
  else if (S.ch >= 5 && typeof darkness === 'function' && darkness() > .6 && !KIT.auroraNight) {
    KIT.auroraNight = true;
    if (Math.random() < .5) { auroraT = 55; snd('gem'); banner = { t: 4.5, a: '✨ Polarlicht!', b: 'Unter dem Nordlicht zahlen alle 50 % mehr.' }; emit('aurora', 1, false); }
  }
  if (darkness() <= 0) KIT.auroraNight = false;
});
KIT.overlay.push(t => {
  if (auroraT <= 0) return;
  screenT(); const a = Math.min(1, auroraT / 5, (55 - auroraT) / 3) * .55;
  for (let i = 0; i < 3; i++) {
    const g = ctx.createLinearGradient(0, 0, 0, H * .45);
    g.addColorStop(0, `rgba(${[90, 255, 170][i]},${[255, 120, 255][i]},${[170, 220, 140][i]},${a * .6})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (.18 + .08 * i) + Math.sin(x / 90 + t * .6 + i * 2) * 30);
    ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();
  }
});
KIT.hud.push(top => {
  if (auroraT > 0) txt('✨ Polarlicht – Preise +50 % (' + Math.ceil(auroraT) + 's)', W / 2, top + 156, 14, '#c8ffe6', 'center', '#1d4a3d');
  else if (blizzard() && inWeite()) txt('🌨️ Whiteout – bleib in der Nähe der Jurte!', W / 2, top + 156, 13, '#ffffff', 'center', '#2a5d86');
});

// ---------- Schneeochsen ----------
defineCreature({ kind: 'ox', zones: ['weite'], rect: { x0: WEITE.x0 + 250, x1: WYRM_X - 20, y0: WEITE.y0 + 30, y1: WEITE.y1 - 20 }, mode: 'flee', speed: 70, hp: () => 14 + S.lv.furnace,
  count: () => weiteOpen() ? 9 : 0, respawn: 5, on: weiteOpen, col: '#a07850', size: 8, hpZ: 56,
  drop: (c, src) => { const n = 2 + (bookMul('weite') > 1 ? 1 : 0); spawnDrops('fur', n, c.x, c.y); spawnDrops('raw', 2, c.x, c.y); if (src === 'player') { emit('ox'); discover('ox'); rollFind('ox', c.x, c.y); } },
  draw: (c, t) => {
    ctx.scale(c.face * 1.15, 1.15); shadow(30, 9);
    const bob = Math.sin(c.anim) * 1.5, lg = Math.sin(c.anim) * 4;
    for (const [x, s] of [[-18, 1], [-7, -1], [8, -1], [18, 1]]) rr(x, -13, 6, 13 + lg * .3 * s, 2, '#4a3828');
    ell(0, -24 + bob, 28, 16, '#6b5038'); ell(-2, -30 + bob, 24, 11, '#7d6046'); ell(0, -12 + bob, 26, 6, '#5a4230'); // Zottelfell
    ell(26, -22 + bob, 10, 9, '#4a3828'); poly([20, -30 + bob, 30, -36 + bob, 34, -28 + bob], '#e8e2d0'); poly([20, -30 + bob, 14, -38 + bob, 12, -30 + bob], '#e8e2d0');
    ell(31, -22 + bob, 1.6, 1.6, '#111');
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-14, -38 + bob, 20, 3);
    if (c.flash > 0) { ctx.globalAlpha = .5; ell(0, -24, 30, 18, '#ff4d4d'); ctx.globalAlpha = 1; }
  } });
const oxen = () => KIT.creatures.filter(c => c.kind === 'ox');

// ---------- Schneiderei ----------
const M_TAILOR = { id: 'tailor', name: 'Schneiderei', own: () => S.own.tailor, x: TAILOR.x, y: TAILOR.y, r: TAILOR.r,
  inPos: { x: TAILOR.x - 50, y: TAILOR.y + 80 }, outPos: { x: TAILOR.x + 50, y: TAILOR.y + 80 }, inItem: 'fur', outItem: 'cloth', outCur: 'cloth',
  time: () => cookT() * 3, inLab: 'Fell', outLab: 'Kleidung', hint: 'Bring das Fell zur Schneiderei',
  draw: (t, s) => {
    shadow(32, 11);
    rr(-28, -40, 56, 40, 6, '#8a5a32'); rr(-28, -40, 20, 40, 6, '#a8764a');
    poly([-34, -40, 0, -64, 34, -40], '#c0504d'); poly([0, -64, 34, -40, 0, -40], '#a33f3c');
    rr(-8, -26, 16, 26, 3, '#4a3020');
    // Wäscheleine mit Fellen
    ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(28, -34); ctx.lineTo(56, -30); ctx.stroke();
    for (let i = 0; i < 3; i++) rr(32 + i * 8, -33 + i, 6, 10 + Math.sin(t * 2 + i) * 1.5, 2, i % 2 ? '#c0504d' : '#a07850');
  } };
defineMachine(M_TAILOR);
KIT.matHint.cloth = p => {
  if (!S.own.weite) return null;
  if (S.own.tailor && mst('tailor').out > 0) return { ...M_TAILOR.outPos, t: 'Hol die Kleidung an der Schneiderei 🧶' };
  const o = nearZ(oxen(), 'weite', c => !c.dead);
  return o && { x: o.x, y: o.y, t: 'Jage Schneeochsen – Fell für: ' + p.name() + ' 🦬', soft: 1 };
};
KIT.hintLate.push(st => (S.own.tailor && !S.own.seamstress && !st.length && mst('tailor').out >= 6) ? { ...M_TAILOR.outPos, t: 'Hol die Kleidung an der Schneiderei 🧶' } : null);

// ---------- Helfer ----------
defineHelper({ kind: 'trapper', col: '#5a7a4a', opts: { beard: true, hat: '#a07850' }, gather: { targets: oxen, item: 'fur', to: M_TAILOR,
  hit: (o, n, npc) => { o.hp -= n * 3; o.flash = .12; if (o.hp <= 0) { o.dead = 1; npc.stack.push('fur', 'fur'); burst(o.x, o.y, 20, '#a07850', 10, 140, 4); } } } });
defineHelper({ kind: 'seamstress', col: '#c06a92', opts: { hat: '#f2c27a' }, carry: { from: M_TAILOR, to: null, cur: 'cloth' } });
for (const k of ['trapper', 'seamstress']) if (S.own[k]) spawnKitHelper(k);

// ---------- Schlitten ----------
const SLEDS = [
  { id: 'camp', x: -215, y: -252, n: 'Lager', on: () => S.own.sled },
  { id: 'weite', x: 300, y: -1120, n: 'Weiße Weite', on: () => S.own.sled },
  { id: 'heart', x: PASS_GX + 150, y: -1800, n: 'Eishöhlen', on: () => S.own.sled && S.own.heart },
];
let sled = null; // laufende Fahrt
function sledDest(from) {
  const on = SLEDS.filter(s => s.on() && s !== from);
  const want = on.find(s => s.id === sledWant); if (want) return want;
  if (from.id !== 'camp') return SLEDS[0];
  return on[on.length - 1]; // vom Lager aus: zum entferntesten freigeschalteten Ziel
}
KIT.update.push(dt => {
  if (sled) {
    sled.t += dt; const k = Math.min(1, sled.t / sled.T), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    player.x = lerp(sled.a.x, sled.b.x, e); player.y = lerp(sled.a.y, sled.b.y, e) + 40;
    player.warm = 100; player.hurtT = 0; player.moving = true; player.anim += dt * 6;
    if (k >= 1) { sled = null; sledWant = null; snd('drop'); }
    return;
  }
  if (player.dead > 0) return;
  for (const s of SLEDS) {
    if (!s.on()) continue;
    const on = dist(player.x, player.y, s.x, s.y + 40) < 34;
    if (!on) { s.onT = 0; s.lock = false; continue; }
    s.onT = (s.onT || 0) + dt;
    if (s.onT > .8 && !s.lock) {
      const d = sledDest(s); if (!d) continue;
      sled = { a: s, b: d, t: 0, T: 1.4 + dist(s.x, s.y, d.x, d.y) / 1600 };
      for (const q of SLEDS) q.lock = true; d.onT = 0; snd('buy'); emit('sled', 1, false);
      ftext(player.x, player.y, 70, '🛷 → ' + d.n, '#ffffff', 18);
    }
  }
});
const sledding = () => !!sled;
KIT.add.push((add, t) => {
  for (const s of SLEDS) if (s.on() && onScreen(s.x, s.y)) add(s.y, () => { at(s.x, s.y); drawSled(t, false); });
  if (sled) add(player.y + 1, () => { at(player.x, player.y - 40 + 52); drawSled(t, true); });
});
KIT.ground.push(t => {
  for (const s of SLEDS) if (s.on()) {
    ctx.setLineDash([8, 7]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(s.x - 34, s.y + 16, 68, 48, 10); ctx.stroke(); ctx.setLineDash([]);
  }
});
KIT.overlay.push(t => {
  for (const s of SLEDS) if (s.on() && onScreen(s.x, s.y)) { const d = sledDest(s), pp = P(s.x, s.y + 40); if (d) txt('🛷 ' + d.n, pp[0], pp[1] + 30 * Z, 11 * clamp(Z * 1.2, .8, 1.2), '#ffffff', 'center', 'rgba(0,0,0,.45)', 800); }
});
function drawSled(t, moving) {
  shadow(30, 9);
  rr(-26, -14, 52, 8, 3, '#8a5a32'); rr(-26, -16, 52, 4, 2, '#a8764a');
  ctx.strokeStyle = '#4b5058'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-28, -4); ctx.lineTo(26, -4); ctx.quadraticCurveTo(34, -4, 32, -12); ctx.stroke();
  for (let i = 0; i < 2; i++) { // Hunde
    const x = 38 + i * 22, b = moving ? Math.sin(t * 16 + i) * 2 : 0;
    ell(x, -12 + b, 9, 5, '#d8d4cc'); ell(x + 8, -16 + b, 4.5, 4, '#d8d4cc'); poly([x + 6, -19 + b, x + 7, -24 + b, x + 9, -19 + b], '#8a8f99'); ell(x + 11, -16 + b, 1, 1, '#111');
  }
}
// Hinweis-Pfeil: weite Wege mit dem Schlitten abkürzen (Ziel der Fahrt = Station nahe am Ziel)
let sledWant = null;
function sledHint(h) {
  if (!S.own.sled || sled || player.dead > 0) return h;
  const on = SLEDS.filter(s => s.on()); if (on.length < 2) return h;
  const near1 = (x, y) => on.reduce((a, b) => dist(a.x, a.y, x, y) < dist(b.x, b.y, x, y) ? a : b);
  const ps = near1(player.x, player.y), ds = near1(h.x, h.y);
  if (ps === ds) return h;
  const walk = dist(player.x, player.y, h.x, h.y), via = dist(player.x, player.y, ps.x, ps.y) + dist(ds.x, ds.y, h.x, h.y) + 300;
  if (via >= walk) return h;
  sledWant = ds.id;
  return { x: ps.x, y: ps.y + 40, t: '🛷 Nimm den Schlitten – ' + h.t };
}

// ---------- Truhen ----------
addChests([
  { x: WEITE.x0 + 120, y: WEITE.y0 + 80, zone: 'weite', tier: 2, on: weiteOpen },
  { x: WYRM_X - 80, y: WEITE.y1 - 80, zone: 'weite', tier: 2, on: weiteOpen },
  { x: 700, y: WEITE.y0 + 70, zone: 'weite', tier: 2, on: weiteOpen },
]);

// ---------- Der Schneewyrm ----------
defineCreature({ kind: 'snowling', zones: ['wyrm'], rect: { x0: WYRM_X, x1: WEITE.x1, y0: WEITE.y0, y1: WYRM_Y }, mode: 'hunt', aggro: 900, speed: 85, hp: () => 40, dmg: () => 8, on: () => false, col: '#dff0ff',
  drop: (c) => { discover('snowling'); spawnDrops('cash', 2, c.x, c.y, 50); },
  draw: (c, t) => { ctx.scale(c.face, 1); shadow(14, 5); const b = Math.sin(c.anim) * 2; ell(0, -14 + b, 12, 12, '#eef6ff'); ell(0, -24 + b, 8, 8, '#ffffff'); ell(3, -25 + b, 1.6, 1.6, '#2f6fa8'); ell(-2, -25 + b, 1.6, 1.6, '#2f6fa8'); if (c.flash > 0) { ctx.globalAlpha = .5; ell(0, -16, 14, 16, '#ff4d4d'); ctx.globalAlpha = 1; } } });
const WYRM = { id: 'wyrm', name: 'den Schneewyrm', ownKey: 'wyrmGate', deadKey: 'wyrmDead', zone: 'wyrm', home: { x: 1300, y: -1720 }, rect: { x0: WYRM_X, x1: WEITE.x1, y0: WEITE.y0, y1: WYRM_Y },
  hp: 4200, speed: 70, dmg: 16, r: 44, hpZ: 120, col: '#cfe6f4',
  attack: (b, dt, ph) => {
    b.castT -= dt;
    if (b.burrow > 0) { b.burrow -= dt; return; }
    if (b.castT <= 0) {
      b.castT = ph === 1 ? 3.8 : ph === 2 ? 3 : 2.3;
      if (Math.random() < .55) { // abtauchen und unter dem Spieler auftauchen
        b.burrow = 1.3; const tx = player.x, ty = player.y;
        bossCast(tx, ty, 90, 1.3, 28, () => { if (WYRM.b && !WYRM.b.dead) { WYRM.b.x = tx; WYRM.b.y = ty; shake = Math.max(shake, 8); } });
      } else bossCast(b.x, b.y, 160, 1.3, 24); // Schwanzschlag
      if (ph === 3) bossCast(player.x + rand(-80, 80), player.y + rand(-60, 60), 70, 1.6, 16);
    }
    if (ph >= 2) {
      b.sumT -= dt;
      if (b.sumT <= 0 && KIT.creatures.filter(c => c.extra).length < 5) { b.sumT = 10; ftext(b.x, b.y, 140, 'SSSSHHH!', '#ffffff', 22); for (let i = 0; i < 3; i++) spawnCreature('snowling', b.x + rand(-100, 100), b.y + rand(20, 80), { extra: 1, aggro: 99 }); }
    }
  },
  onDeath: (b) => {
    spawnDrops('cash', 20, b.x, b.y, 600 + 60 * S.lv.furnace); spawnDrops('crystal', 16, b.x, b.y); S.cloth += 40; ftext(b.x, b.y, 120, '+40 Kleidung', '#ffe7b0', 20);
    gearDrop(4, b.x, b.y); gearDrop(4, b.x + 30, b.y); discover('wyrm'); rollFind('wyrm', b.x, b.y);
    banner = { t: 5, a: '🐉 Der Schneewyrm ist besiegt!', b: 'Der Weg zu den Eishöhlen ist frei.' };
  },
  draw: (b, t) => {
    if (b.burrow > 0) { ell(0, -4, 40, 14, '#dfe8f0'); ell(0, -8, 30, 10, '#eef4f8'); for (let i = 0; i < 6; i++) burst(b.x + rand(-30, 30), b.y, 4, '#ffffff', 1, 60, 3); return; }
    ctx.scale(b.face * 1.3, 1.3);
    shadow(54, 14);
    for (let i = 5; i >= 0; i--) { // Körpersegmente
      const x = -60 + i * 18, y = -20 - Math.sin(t * 3 + i * .8) * 8 - i * 4, r = 14 + i * 1.5;
      ell(x, y, r, r * .85, i % 2 ? '#b8d4e8' : '#cfe6f4'); poly([x - 4, y - r * .8, x, y - r - 8, x + 4, y - r * .8], '#ffffff');
    }
    const hx = 54, hy = -46 - Math.sin(t * 3 + 4.8) * 8;
    ell(hx, hy, 20, 16, '#e6f2fa'); poly([hx + 10, hy - 4, hx + 34, hy + 2, hx + 10, hy + 10], '#d4e6f2');
    poly([hx + 14, hy + 6, hx + 18, hy + 14, hx + 22, hy + 6], '#ffffff'); poly([hx + 22, hy + 6, hx + 26, hy + 13, hx + 30, hy + 5], '#ffffff');
    ell(hx + 6, hy - 6, 3.4, 3, '#3d8fd6'); poly([hx - 6, hy - 12, hx - 2, hy - 30, hx + 4, hy - 12], '#ffffff');
    if (b.flash > 0) { ctx.globalAlpha = .45; ell(0, -30, 70, 34, '#ff4d4d'); ctx.globalAlpha = 1; }
  } };
defineBoss(WYRM);

// ---------- Bau-Felder ----------
PADS.push(
  { id: 'weite', x: PASS.x1 - 50, y: -1200, ic: '🏔️', name: () => 'Weiße Weite öffnen', cost: () => S.own.weite ? null : 40000, vis: () => S.ch >= 5, buy: () => S.own.weite = 1 },
  { id: 'tailor', x: TAILOR.x, y: TAILOR.y, ic: '🧵', name: () => 'Schneiderei bauen', req: () => S.own.tailor ? null : { cash: 35000, tools: 40, stone: 60 }, vis: () => S.own.weite, buy: () => S.own.tailor = 1 },
  { id: 'sled', x: 210, y: -1060, ic: '🛷', name: () => 'Schlittenstationen bauen', req: () => S.own.sled ? null : { cash: 30000, tools: 30, wood: 60, iron: 40 }, vis: () => S.own.weite, buy: () => S.own.sled = 1 },
  { id: 'trapper', x: 520, y: -1060, ic: '🪤', name: () => 'Fallensteller anheuern', req: () => S.own.trapper ? null : { cash: 50000, iron: 50 }, vis: () => S.own.tailor, buy: () => { S.own.trapper = 1; spawnKitHelper('trapper'); } },
  { id: 'seamstress', x: 610, y: -1060, ic: '🧶', name: () => 'Näherin anheuern', cost: () => S.own.seamstress ? null : 50000, vis: () => S.own.tailor, buy: () => { S.own.seamstress = 1; spawnKitHelper('seamstress'); } },
  { id: 'wyrmGate', x: 1300, y: WYRM_Y + 70, ic: '🐉', name: () => 'Wyrm-Senke betreten', req: () => S.own.wyrmGate ? null : { cash: 60000, cloth: 40, iron: 60 }, vis: () => S.own.tailor && S.own.sled, buy: () => S.own.wyrmGate = 1 },
);
Object.assign(PAD_TXT, {
  weite: ['Schneeochsen, Fell und Kleidung', 'Die Weiße Weite ist offen. Hier ist es kälter – und im Whiteout eisig!'],
  tailor: ['Macht aus Fell Kleidung 🧶 – mit wärmender Jurte', 'Bring Fell zur Schneiderei. An der Jurte daneben wärmst du dich auf.'],
  sled: ['Schnell zwischen Lager und Weite reisen', 'Stell dich auf eine Schlittenstation – die Hunde bringen dich ans Ziel.'],
  trapper: ['Jagt Schneeochsen und bringt das Fell'],
  seamstress: ['Bringt die Kleidung in den Vorrat'],
  wyrmGate: ['Hier haust der Schneewyrm', 'Der Schneewyrm taucht ab – wo der rote Kreis erscheint, kommt er hoch!'],
});
for (const p of PADS) { const t = PAD_TXT[p.id]; if (t && !p.desc) { p.desc = t[0]; if (t[1]) p.info = () => t[1]; } }
Object.assign(REACT, {
  weite: ['ylva', 'Die Weite! Bleib nie zu lange draußen, wenn der Whiteout kommt.'],
  sled: ['ole', 'Hunde und Kufen – so reist man im Norden.'],
  wyrmGate: ['ylva', 'Achte auf den Boden. Wenn er bebt, lauf!'],
});
QUESTS.ylva.push({ id: 'furq', t: n => `Bring mir ${n} Fell`, item: 'fur', n: () => 8 + S.lv.furnace, ok: () => S.own.weite, r: { cloth: 6 } });
QUESTS.mara.push({ id: 'clothq', t: n => `Näh ${n} Kleidung für die Kinder`, ev: 'cloth', n: () => 15, ok: () => S.own.tailor });

// ---------- Sammelbuch, Erfolge ----------
EXTRA_FINDS.push(
  { id: 'kufe', n: 'Silberne Kufe', ic: '🛷', src: 'ox', p: .05, d: 'Von einem Schlitten, der hier vor langer Zeit zerbrach. Er fuhr nach Norden.' },
  { id: 'schuppe', n: 'Wyrmschuppe', ic: '❄️', src: 'wyrm', p: 1, d: 'Durchsichtig wie Eis – und darunter schimmert ein warmes Glühen.' },
);
BOOK.push({ id: 'weite', n: 'Die Weiße Weite', bonus: '+1 Fell pro Schneeochse', e: [
  { id: 'ox', n: 'Schneeochse', ic: '🦬', d: 'Friedlich, zottelig und schneller, als man denkt.' },
  { id: 'snowling', n: 'Schneegeist', ic: '☃️', d: 'Ruft der Wyrm, kommen sie aus dem Schnee gekrochen.' },
  { id: 'wyrm', n: 'Schneewyrm', ic: '🐉', d: 'Schwimmt durch den Schnee wie ein Fisch durchs Wasser.' },
  ...EXTRA_FINDS.slice(-2),
] });
ACH.push(
  { id: 'cloth100', n: 'Warm eingepackt', d: 'Stell 100 Kleidung her.', ok: () => stv('cloth') >= 100, r: { cash: 10000 } },
  { id: 'aurora', n: 'Nordlicht', d: 'Erlebe ein Polarlicht.', ok: () => stv('aurora') >= 1, r: { crystal: 10 } },
  { id: 'sled20', n: 'Musher', d: 'Fahr 20-mal Schlitten.', ok: () => stv('sled') >= 20, r: { cash: 8000 } },
  { id: 'ox50', n: 'Ochsentreiber', d: 'Erlege 50 Schneeochsen.', ok: () => stv('ox') >= 50, r: { cash: 8000 } },
  { id: 'wyrm1', n: 'Wyrmtöter', d: 'Besiege den Schneewyrm.', ok: () => S.wyrmDead, r: { sparks: 3 } },
  { id: 'furn12', n: 'Weißglut', d: 'Bring den Ofen auf Stufe 12.', ok: () => S.lv.furnace >= 12, r: { sparks: 1 } },
);
STATS.splice(10, 0, ['Schneeochsen erlegt', () => stv('ox')], ['Kleidung genäht', () => stv('cloth')], ['Schlittenfahrten', () => stv('sled')]);

// ---------- Boden ----------
KIT.ground.push(t => {
  if (S.ch < 5 && !S.own.weite) return;
  ctx.fillStyle = '#f4f8fb'; ctx.fillRect(WEITE.x0, WEITE.y0, WEITE.x1 - WEITE.x0, WEITE.y1 - WEITE.y0);
  ctx.fillStyle = S.own.wyrmGate ? '#dfe8f0' : '#e8eef3'; ctx.fillRect(WYRM_X, WEITE.y0, WEITE.x1 - WYRM_X, WYRM_Y - WEITE.y0);
  ctx.fillStyle = 'rgba(210,225,238,.6)';
  for (let i = 0; i < 14; i++) { const x = WEITE.x0 + 80 + (i * 173) % (WEITE.x1 - WEITE.x0 - 160), y = WEITE.y0 + 60 + (i * 97) % 760; ell(x, y, 60 + (i % 3) * 20, 18, 'rgba(220,232,242,.8)'); }
  if (S.own.tailor) { const g = ctx.createRadialGradient(YURT.x, YURT.y, 15, YURT.x, YURT.y, 150); g.addColorStop(0, 'rgba(255,180,90,.45)'); g.addColorStop(1, 'rgba(255,180,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(YURT.x, YURT.y, 150, 0, TAU); ctx.fill(); }
});
KIT.add.push((add, t) => {
  if (!S.own.tailor || !onScreen(YURT.x, YURT.y)) return;
  add(YURT.y, () => { at(YURT.x, YURT.y); shadow(40, 13); poly([-38, 0, -34, -34, 0, -58, 34, -34, 38, 0], '#e9e2c9'); poly([0, -58, 34, -34, 38, 0, 0, 0], '#d6cdb0'); rr(-10, -24, 20, 24, 4, '#7a5230'); smokePuffs(t, 0, -62, 2); });
});

// ---------- Kapitel ----------
CHAPTERS[4] = {
  n: 5, title: 'Die Weiße Weite',
  text: 'Ole erzählt von seinem Großvater, der mit Hundeschlitten durch die Weiße Weite fuhr. Dort ziehen Schneeochsen umher – und ihr Fell ist das wärmste im ganzen Norden.',
  say: 'Kleidung für alle, Schlitten für die langen Wege. Aber hüte dich vor dem Whiteout – und vor dem, was unter dem Schnee schwimmt.',
  goals: [
    { t: 'Öffne die Weiße Weite', ok: () => S.own.weite },
    { t: 'Baue die Schneiderei', ok: () => S.own.tailor },
    { t: 'Baue die Schlittenstationen', ok: () => S.own.sled },
    { get t() { return 'Näh 60 Kleidung (' + Math.min(60, S.run.cloth || 0) + '/60)'; }, ok: () => (S.run.cloth || 0) >= 60 },
    { t: 'Ofen auf Stufe 12 bringen', ok: () => S.lv.furnace >= 12 },
    { t: 'Besiege den Schneewyrm', ok: () => S.wyrmDead },
  ],
};
