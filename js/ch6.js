'use strict';
// Glutfrost – Kapitel 6: Das Glutherz (Finale)
// Hinter der Höhle des Rudelführers: dunkle Eishöhlen mit Spinnennestern, die letzte Belagerung des Lagers,
// der Frostwächter – und das Entfachen des Glutherzens.
// =====================================================================
const HEART = { x0: -900, x1: 130, y0: -2800, y1: -1700 };
const GLUT = { x: -385, y: -2470, r: 56 };              // das Glutherz
addZone({ id: 'heart', r: HEART, parent: 'den', wp: [[PASS_GX, PASS.y0 + 40], [PASS_GX, PASS.y0 - 60]] });
fence(HEART.x0, HEART.y0, HEART.x0, HEART.y1); fence(HEART.x1, HEART.y0, HEART.x1, WEITE.y0); fence(HEART.x0, HEART.y0, HEART.x1, HEART.y0);
const heartOpen = () => S.own.heart;
const inHeart = () => zoneOf(player.x, player.y) === 'heart';
// Höhlen sind dunkel (Licht nur an Feuern, am Glutherz und um dich)
const caveDark = () => inHeart() ? (S.finale ? .25 : .8) : 0;
const BRAZIERS6 = [{ x: PASS_GX + 60, y: -1860 }, { x: -720, y: -2050 }, { x: -40, y: -2050 }, { x: -385, y: -1990 }];
for (const b of BRAZIERS6) KIT.warm.push({ x: b.x, y: b.y, r: 230, on: heartOpen });
KIT.warm.push({ x: GLUT.x, y: GLUT.y, r: 320, on: () => S.finale });

// ---------- Spinnennester ----------
const nestDef = {
  kind: 'nest', zones: ['heart'], on: heartOpen, hp: 450, regrow: 1e9, r: 30, col: '#cfe6f4',
  pts: [[-760, -1900], [-120, -2000], [-700, -2450], [-40, -2580], [-560, -2700]],
  drop: (o) => { S.nestDead = (S.nestDead || []).concat(nestDef.list.indexOf(o)); S.nests = S.nestDead.length; emit('nest'); spawnDrops('crystal', 6, o.x, o.y); spawnDrops('cash', 6, o.x, o.y, 400); rollFind('nest', o.x, o.y); toast('🕸️ Spinnennest zerstört', S.nests + ' / 5'); save(); },
  draw: (o, t) => {
    if (o.stump) { ell(0, -4, 26, 9, '#9aa9b8'); return; }
    ctx.rotate(o.shake > 0 ? Math.sin(t * 50) * .05 : 0);
    shadow(34, 11);
    ell(0, -22, 32, 24, '#dfe9f2'); ell(-6, -26, 24, 18, '#f2f7fb');
    ctx.strokeStyle = 'rgba(160,190,215,.8)'; ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(Math.cos(i) * 40, -22 + Math.sin(i) * 26); ctx.stroke(); }
    for (let i = 0; i < 4; i++) ell(-12 + i * 8, -14 + Math.sin(t * 3 + i) * 2, 3, 3, 'rgba(120,200,255,.8)');
    if (o.flash > 0) { ctx.globalAlpha = .4; ell(0, -22, 34, 26, '#ff4d4d'); ctx.globalAlpha = 1; }
  },
};
const nests = addNodes(nestDef);
for (const i of S.nestDead || []) if (nests[i]) nests[i].stump = 1e9;
defineCreature({ kind: 'spider', zones: ['heart'], rect: HEART, mode: 'hunt', aggro: 380, speed: 105, hp: () => 24 + S.lv.furnace, dmg: () => 7, on: () => false, col: '#bfe6ff', size: 2, hpZ: 30,
  drop: (c, src) => { spawnDrops('crystal', 1, c.x, c.y); spawnDrops('cash', 2, c.x, c.y, 80); if (src === 'player') { emit('spider'); discover('spider'); rollFind('spider', c.x, c.y); } },
  draw: (c, t) => {
    ctx.scale(c.face, 1); shadow(16, 5);
    const b = Math.sin(c.anim * 1.5) * 2;
    ctx.strokeStyle = '#7fa8c8'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(s * (10 + i * 2), -14 + i * 3 + (i % 2 ? b : -b)); ctx.lineTo(s * (14 + i * 2), -2 + i); ctx.stroke(); }
    ell(-5, -10, 9, 7, '#cfe6f4'); ell(6, -11, 6, 5, '#e6f2fa'); ell(9, -12, 1.4, 1.4, '#2f6fa8'); ell(7, -13, 1.2, 1.2, '#2f6fa8');
    if (c.flash > 0) { ctx.globalAlpha = .5; ell(0, -10, 14, 10, '#ff4d4d'); ctx.globalAlpha = 1; }
  } });
// Nester schicken Spinnen, solange man in der Nähe ist
KIT.update.push(dt => {
  if (!heartOpen() || !inHeart()) return;
  for (const o of nests) {
    if (o.stump) continue;
    o.spawnT = (o.spawnT || rand(1, 4)) - dt;
    if (o.spawnT <= 0) {
      o.spawnT = 7;
      const around = KIT.creatures.filter(c => c.kind === 'spider' && dist(c.x, c.y, o.x, o.y) < 400).length;
      if (around < 3 && dist(player.x, player.y, o.x, o.y) < 700) spawnCreature('spider', o.x + rand(-30, 30), o.y + rand(10, 40));
    }
  }
});

// ---------- Glutkristalle (Feuerkristalle in den Höhlen) ----------
const hcrystals = addNodes({
  kind: 'hcrystal', zones: ['heart'], on: heartOpen, hp: 30, regrow: 35, r: 24, col: '#ff9b3d', hitSnd: 'gem',
  pts: placeNodes(7, { x0: HEART.x0 + 60, x1: HEART.x1 - 60, y0: HEART.y0 + 80, y1: HEART.y1 - 120 }, [{ x: GLUT.x, y: GLUT.y + 100, r: 330 }, ...nestDef.pts.map(([x, y]) => ({ x, y, r: 120 })), ...BRAZIERS6.map(b => ({ ...b, r: 90 }))], 160),
  drop: (o) => { spawnDrops('crystal', randi(3, 4), o.x, o.y); shake = Math.max(shake, 3); },
  draw: (o, t) => { if (o.stump) { ell(0, -3, 14, 5, '#8fa0b4'); return; } ctx.save(); drawCrystal(o, t); ctx.restore(); },
});
function heartCrystalHint() {
  if (!heartOpen()) return null;
  const c = nearZ(hcrystals, 'heart', o => !o.stump) || soonest(hcrystals);
  return c && { x: c.x, y: c.y, t: 'Schlag Glutkristalle in den Eishöhlen 🔶', soft: 1 };
}

// ---------- Die letzte Belagerung ----------
// Nach dem Freilegen des Glutherzens: In der nächsten Nacht stürmt alles, was im Norden lebt, auf das Lager.
KIT.update.push(dt => {
  if (S.siege !== 1 || !nightRun) return;
  if (!nightRun.siege) { nightRun.siege = true; nightRun.left = 22; banner = { t: 5, a: '⚔️ Die letzte Belagerung!', b: 'Ylva: „Sie kommen alle! Haltet das Nordtor!“' }; snd('boom'); shake = 10; }
});
KIT.update.push(dt => {
  // Ende der Belagerungsnacht erkennen: nightRun wird bei Tagesanbruch gelöscht
  if (S.siege === 1) {
    if (nightRun && nightRun.siege) KIT.siegeRun = nightRun;
    else if (KIT.siegeRun && !nightRun) {
      if (!KIT.siegeRun.stolen) { S.siege = 2; banner = { t: 5, a: '🌅 Die Belagerung ist überstanden!', b: 'Jetzt wartet nur noch der Frostwächter am Glutherz.' }; emit('siege', 1, false); }
      else toast('⚔️ Die Belagerung geht weiter', 'Die Wölfe haben Beute gemacht – nächste Nacht kommen sie wieder.');
      KIT.siegeRun = null; save();
    }
  }
});

// ---------- Der Frostwächter ----------
const GUARD = { id: 'guard', name: 'den Frostwächter', ownKey: 'guardGate', deadKey: 'guardDead', zone: 'heart', home: { x: GLUT.x, y: GLUT.y + 150 }, rect: { x0: GLUT.x - 380, x1: GLUT.x + 380, y0: GLUT.y - 260, y1: GLUT.y + 330 },
  hp: 9000, speed: 64, dmg: 18, r: 46, hpZ: 180, col: '#9fd0f0', leash: true,
  attack: (b, dt, ph) => {
    b.castT -= dt;
    if (b.castT <= 0) {
      b.castT = ph === 1 ? 3.2 : ph === 2 ? 2.6 : 2;
      const r = Math.random();
      if (r < .35) bossCast(b.x, b.y, 170, 1.4, 28); // Eisring
      else { const n = ph === 3 ? 4 : 3; for (let i = 0; i < n; i++) bossCast(player.x + (i ? rand(-110, 110) : 0), player.y + (i ? rand(-80, 80) : 0), 64, 1.1 + i * .25, 20); } // Eislanzen
      if (ph === 3 && Math.random() < .3) bossCast(player.x, player.y, 110, 1.6, 30, () => { if (GUARD.b && !GUARD.b.dead) GUARD.b.dash = { x: player.x, y: player.y, t: 0 }; });
    }
    if (ph >= 2) {
      b.sumT -= dt;
      if (b.sumT <= 0 && KIT.creatures.filter(c => c.extra).length < 5) { b.sumT = 9; ftext(b.x, b.y, 200, 'KOMMT, KINDER DES EISES!', '#dff0ff', 18); for (let i = 0; i < 3; i++) spawnCreature('spider', b.x + rand(-100, 100), b.y + rand(30, 80), { extra: 1, aggro: 99 }); }
    }
  },
  onDeath: (b) => {
    spawnDrops('cash', 24, b.x, b.y, 1500 + 100 * S.lv.furnace); spawnDrops('crystal', 30, b.x, b.y); gearDrop(5, b.x, b.y); gearDrop(5, b.x + 40, b.y);
    discover('guard'); rollFind('guard', b.x, b.y);
    banner = { t: 6, a: '🛡️ Der Frostwächter fällt!', b: 'Das Glutherz liegt frei. Entfache es!' };
  },
  draw: (b, t) => {
    ctx.scale(b.face * 1.7, 1.7); shadow(36, 12);
    const bob = Math.sin(b.anim) * 1.2, lg = Math.sin(b.anim) * 4;
    rr(-16, -34, 12, 34 + lg * .2, 4, '#7f9fb6'); rr(4, -34, 12, 34 - lg * .2, 4, '#7f9fb6');
    poly([-24, -34 + bob, -22, -86 + bob, 22, -86 + bob, 24, -34 + bob], '#a3c2d8'); poly([0, -86 + bob, 22, -86 + bob, 24, -34 + bob, 0, -34 + bob], '#cfe6f4');
    rr(-14, -112 + bob, 28, 28, 8, '#b6d3e6'); poly([-14, -108 + bob, 0, -132 + bob, 14, -108 + bob], '#e6f2fa'); // Helm
    const g = .7 + Math.sin(t * 5) * .3; ell(-5, -98 + bob, 3, 2, `rgba(120,210,255,${g})`); ell(6, -98 + bob, 3, 2, `rgba(120,210,255,${g})`);
    rr(24, -120 + bob, 4, 110, 2, '#cfe6f4'); poly([22, -120 + bob, 26, -142 + bob, 30, -120 + bob], '#ffffff'); // Speer
    ell(-28, -62 + bob, 13, 22, '#7f9fb6'); ell(-28, -62 + bob, 8, 15, '#a3c2d8'); // Schild
    if (b.flash > 0) { ctx.globalAlpha = .45; ell(0, -70, 34, 56, '#ff4d4d'); ctx.globalAlpha = 1; }
  } };
defineBoss(GUARD);

// ---------- Finale ----------
function ignite() {
  S.finale = 1; S.finaleNight = S.nightNo; emit('finale', 1, false);
  shake = 24; buzz([100, 60, 100, 60, 200]); snd('boom'); setTimeout(() => snd('buy'), 400);
  for (let i = 0; i < 6; i++) burst(GLUT.x + rand(-40, 40), GLUT.y, 60, i % 2 ? '#ffd84a' : '#ff8a2a', 30, 320, 7);
  KIT.flash = 2.5;
  banner = { t: 7, a: '🔥 Das Glutherz brennt!', b: 'Der ewige Winter ist gebrochen.' };
  setTimeout(() => showCredits(), 2600);
  save();
}
function showCredits() {
  $('credits').classList.remove('hidden'); paused = true;
  const el = $('credRoll'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
$('bCred').onclick = () => { $('credits').classList.add('hidden'); paused = ['menu', 'help', 'confirm', 'offline', 'diary', 'chapter'].some(k => !$(k).classList.contains('hidden')); };
KIT.overlay.push(t => {
  if (KIT.flash > 0) { KIT.flash -= 1 / 60; screenT(); ctx.fillStyle = `rgba(255,220,150,${Math.min(.85, KIT.flash / 2.5)})`; ctx.fillRect(0, 0, W, H); }
});

// ---------- Bau-Felder ----------
PADS.push(
  { id: 'heart', x: PASS_GX, y: PASS.y0 + 60, ic: '🕳️', name: () => 'Eishöhlen betreten', cost: () => S.own.heart ? null : 120000, vis: () => S.ch >= 6, buy: () => S.own.heart = 1 },
  { id: 'reveal', x: GLUT.x, y: GLUT.y + 260, ic: '💠', name: () => 'Glutherz freilegen', req: () => S.siege ? null : { cash: 150000, tools: 80, cloth: 80 }, vis: () => S.own.heart && (S.nests || 0) >= 5, buy: () => { S.siege = 1; toast('⚠️ Ylva warnt', 'In der nächsten Nacht greifen sie alle an!'); } },
  { id: 'guardGate', x: GLUT.x + 150, y: GLUT.y + 260, ic: '🛡️', name: () => 'Frostwächter herausfordern', cost: () => S.own.guardGate ? null : 50000, vis: () => S.siege >= 2, buy: () => S.own.guardGate = 1 },
  { id: 'ignite', x: GLUT.x, y: GLUT.y + 110, ic: '🔥', name: () => 'Glutherz entfachen', req: () => S.finale ? null : { cash: 250000, crystal: 80, tools: 400, cloth: 400 }, vis: () => S.guardDead && S.lv.furnace >= 15, buy: ignite },
);
Object.assign(PAD_TXT, {
  heart: ['Dunkle Eishöhlen voller Spinnen', 'Die Eishöhlen sind offen. Nimm dich vor den Spinnennestern in Acht – an den Feuern ist Licht.'],
  reveal: ['Weckt das Glutherz – und alles, was es bewacht', 'Das Glutherz pulsiert. In der nächsten Nacht kommt die letzte Belagerung!'],
  guardGate: ['Der letzte Wächter des Eises'],
  ignite: ['Bring dem Norden die Wärme zurück'],
});
for (const p of PADS) { const t = PAD_TXT[p.id]; if (t && !p.desc) { p.desc = t[0]; if (t[1]) p.info = () => t[1]; } }
Object.assign(REACT, {
  heart: ['mara', 'Das Glutherz … ich spüre es von hier aus.'],
  reveal: ['ylva', 'Alle auf die Mauern! Heute Nacht entscheidet sich alles.'],
  guardGate: ['bjarne', 'Zeig ihm, was meine Schmiede kann!'],
});
QUESTS.ylva.push({ id: 'spiders', t: n => `Erlege ${n} Eisspinnen`, ev: 'spider', n: () => 12, ok: () => S.own.heart, r: { crystal: 10 } });

// ---------- Sammelbuch, Erfolge ----------
EXTRA_FINDS.push(
  { id: 'blume', n: 'Kristallblume', ic: '🌸', src: 'spider', p: .04, d: 'Sie wächst nur dort, wo das Glutherz das Eis von unten wärmt.' },
  { id: 'medaillon', n: 'Altes Medaillon', ic: '📿', src: 'guard', p: 1, d: 'Darin ein Bild: eine junge Frau mit Stab. Auf der Rückseite steht „Mara“.' },
);
BOOK.push({ id: 'heart', n: 'Das Glutherz', bonus: '+5 % auf alle Verkäufe', e: [
  { id: 'spider', n: 'Eisspinne', ic: '🕷️', d: 'Flink, durchsichtig und immer in Gruppen unterwegs.' },
  { id: 'guard', n: 'Frostwächter', ic: '🛡️', d: 'Er wacht seit Jahrhunderten darüber, dass das Glutherz schläft.' },
  ...EXTRA_FINDS.slice(-2),
] });
ACH.push(
  { id: 'nests', n: 'Kammerjäger', d: 'Zerstöre alle 5 Spinnennester.', ok: () => (S.nests || 0) >= 5, r: { cash: 50000 } },
  { id: 'siege', n: 'Die Mauer hält', d: 'Überstehe die letzte Belagerung.', ok: () => S.siege >= 2, r: { sparks: 2 } },
  { id: 'guard1', n: 'Wächterfall', d: 'Besiege den Frostwächter.', ok: () => S.guardDead, r: { sparks: 3 } },
  { id: 'furn15', n: 'Sonnenofen', d: 'Bring den Ofen auf Stufe 15.', ok: () => S.lv.furnace >= 15, r: { sparks: 2 } },
  { id: 'finale', n: 'Glutfrost', d: 'Entfache das Glutherz.', ok: () => S.finale, r: { sparks: 5 } },
);
STATS.splice(13, 0, ['Eisspinnen erlegt', () => stv('spider')], ['Spinnennester zerstört', () => (S.nests || 0) + ' / 5']);

// ---------- Boden & Glutherz ----------
KIT.ground.push(t => {
  if (S.ch < 6 && !S.own.heart) return;
  ctx.fillStyle = S.finale ? '#d9cfc4' : '#c9d4de'; ctx.fillRect(HEART.x0, HEART.y0, HEART.x1 - HEART.x0, HEART.y1 - HEART.y0);
  for (let i = 0; i < 16; i++) { const x = HEART.x0 + 60 + (i * 211) % (HEART.x1 - HEART.x0 - 120), y = HEART.y0 + 80 + (i * 149) % 960; ell(x, y, 40 + (i % 4) * 12, 16, 'rgba(160,185,210,.5)'); }
  // Kristallsäulen an den Wänden
  for (let y = HEART.y0; y < HEART.y1; y += 90) for (const [x0, s] of [[HEART.x0, 1], [HEART.x1, -1]]) poly([x0, y, x0 + s * (30 + (y * 3) % 25), y + 30, x0, y + 70], 'rgba(150,200,235,.7)');
  const g = ctx.createRadialGradient(GLUT.x, GLUT.y, 20, GLUT.x, GLUT.y, S.finale ? 420 : 200);
  g.addColorStop(0, S.finale ? 'rgba(255,170,70,.6)' : 'rgba(120,190,255,.35)'); g.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(GLUT.x, GLUT.y, S.finale ? 420 : 200, 0, TAU); ctx.fill();
  // Nach dem Finale: Frühling rund ums Lager
  if (S.finale) for (const p of SPRING) { ell(p[0], p[1], p[2], p[2] * .6, 'rgba(140,190,110,.55)'); if (p[3]) ell(p[0] + 4, p[1] - 2, 3, 3, p[3]); }
});
const SPRING = Array.from({ length: 70 }, () => { const a = rand(0, TAU), r = rand(320, 900); return [Math.cos(a) * r, Math.sin(a) * r * .9 + 100, rand(14, 34), Math.random() < .4 ? ['#ffd84a', '#ff9ac0', '#ffffff'][randi(0, 2)] : null]; });
KIT.add.push((add, t) => {
  if (S.ch < 6 && !S.own.heart) return;
  for (const b of BRAZIERS6) if (heartOpen() && onScreen(b.x, b.y)) add(b.y, () => { at(b.x, b.y); drawBrazier(t, true); });
  if (onScreen(GLUT.x, GLUT.y, 260)) add(GLUT.y, () => { at(GLUT.x, GLUT.y); drawGlutherz(t); });
});
function drawGlutherz(t) {
  const lit = S.finale, pulse = Math.sin(t * (lit ? 3 : 1.2)) * .5 + .5;
  shadow(60, 18);
  poly([-70, 0, -60, -40, -30, -20, 0, -10, 30, -20, 60, -40, 70, 0], '#9fb6c8');
  const c1 = lit ? '#ff8a2a' : '#7fb6e0', c2 = lit ? '#ffd84a' : '#cfe6f4';
  poly([-36, -30, -20, -110, 0, -150, 22, -110, 38, -30, 0, -14], c1);
  poly([0, -150, 22, -110, 38, -30, 0, -14], lit ? '#ffb347' : '#a9d0ee');
  poly([-10, -40, 0, -120, 8, -50], c2);
  ctx.globalAlpha = .35 + pulse * .4; ell(0, -80, 60 + pulse * 10, 70 + pulse * 10, lit ? 'rgba(255,190,90,.5)' : 'rgba(150,210,255,.35)'); ctx.globalAlpha = 1;
  if (lit && Math.random() < .3) burst(GLUT.x + rand(-20, 20), GLUT.y, 100, '#ffd84a', 1, 60, 3);
}
KIT.hud.push(top => { if (S.siege === 1) txt('⚔️ Die letzte Belagerung steht bevor', W / 2, top + 178, 13, '#ffd0a0', 'center', '#5a2a10'); });
// Hinweise: Nester zerstören
KIT.hintLate.push(st => {
  if (!heartOpen() || st.length > 4 || player.hp < 60) return null;
  const n = nearestOf(nests, player.x, player.y, o => !o.stump);
  return n && { x: n.x, y: n.y + 40, t: 'Zerstöre die Spinnennester 🕸️ (' + (S.nests || 0) + '/5)', soft: 1 };
});

// ---------- Kapitel ----------
CHAPTERS[5] = {
  n: 6, title: 'Das Glutherz',
  text: 'Hinter der Höhle des Rudelführers führt ein Gang tief ins Eis. Dort unten, in Kristallhöhlen voller Spinnen, schläft das Glutherz – bewacht von einem Wächter, älter als jede Legende.',
  say: 'Mein ganzes Leben habe ich auf diesen Tag gewartet. Bring das Glutherz zum Brennen, Kind – für uns alle.',
  goals: [
    { t: 'Betritt die Eishöhlen', ok: () => S.own.heart },
    { get t() { return 'Zerstöre die Spinnennester (' + Math.min(5, S.nests || 0) + '/5)'; }, ok: () => (S.nests || 0) >= 5 },
    { t: 'Überstehe die letzte Belagerung', ok: () => S.siege >= 2 },
    { t: 'Besiege den Frostwächter', ok: () => S.guardDead },
    { t: 'Ofen auf Stufe 15 bringen', ok: () => S.lv.furnace >= 15 },
    { t: 'Entfache das Glutherz', ok: () => S.finale },
  ],
};
