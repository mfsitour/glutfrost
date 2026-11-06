'use strict';
// Glutfrost – Kapitel 4: Die Erzgrube
// Westlich des Passes: Erzadern -> Schmelzofen -> Barren -> Amboss -> Werkzeug.
// Bjarne schmiedet Ausrüstung. Am Ende wartet der Eisgolem.
// =====================================================================
const ORE = { x0: -1250, x1: -430, y0: -1700, y1: -1000 };
const GOLEM_X = -950;                                   // Zaun zur Golemhalle
const SMELT = { x: -560, y: -1360, r: 30 }, ANVIL = { x: -770, y: -1360, r: 24 };
const FORGE_PAD = { x: -880, y: -1140 };
addZone({ id: 'ore', r: ORE, parent: 'pass', wp: [[PASS.x0 + 40, -1200], [PASS.x0 - 50, -1200]], sub: (x, y) => x < GOLEM_X ? 'golem' : 'ore',
  subs: [{ id: 'golem', parent: 'ore', wp: [[GOLEM_X + 50, -1350], [GOLEM_X - 50, -1350]] }] });
GATES.gG = 'golemGate';
fence(ORE.x0, ORE.y0, ORE.x1, ORE.y0); fence(ORE.x0, ORE.y0, ORE.x0, ORE.y1); fence(ORE.x0, ORE.y1, -600, ORE.y1);
fence(GOLEM_X, ORE.y0, GOLEM_X, -1400); fence(GOLEM_X, -1400, GOLEM_X, -1300, 'gG'); fence(GOLEM_X, -1300, GOLEM_X, ORE.y1);
const oreOpen = () => S.own.ore;
KIT.warm.push({ x: SMELT.x, y: SMELT.y, r: 240, on: () => S.own.smelt });
const GFIRE = { x: GOLEM_X + 60, y: -1230 }; // Feuer vor der Golemhalle
KIT.warm.push({ x: GFIRE.x, y: GFIRE.y, r: 240, on: () => S.own.golemGate });
KIT.add.push((add, t) => { if (S.own.golemGate && onScreen(GFIRE.x, GFIRE.y)) add(GFIRE.y, () => { at(GFIRE.x, GFIRE.y); drawBrazier(t, true); }); });

// ---------- Erzadern ----------
const veins = addNodes({
  kind: 'vein', zones: ['ore'], on: oreOpen, hp: 10, regrow: 25, r: 24, col: '#6b6f78',
  pts: placeNodes(10, { x0: GOLEM_X + 20, x1: ORE.x1 - 20, y0: ORE.y0 + 20, y1: ORE.y1 - 20 },
    [{ x: SMELT.x, y: SMELT.y + 40, r: 150 }, { x: ANVIL.x, y: ANVIL.y + 40, r: 140 }, { x: FORGE_PAD.x, y: FORGE_PAD.y, r: 90 }, { x: PASS.x0 - 40, y: -1200, r: 110 }], 95),
  drop: (o, src, npc) => {
    const n = 2 + (bookMul('ore') > 1 ? 1 : 0);
    if (npc) { for (let i = 0; i < n; i++) npc.stack.push('ore'); } else { spawnDrops('ore', n, o.x, o.y); emit('ore', n); rollFind('vein', o.x, o.y); }
  },
  draw: (o, t) => {
    if (o.stump) { ell(0, -3, 16, 6, '#7d828b'); return; }
    ctx.rotate(o.shake > 0 ? Math.sin(t * 50) * .05 : 0);
    shadow(26, 9);
    poly([-24, 0, -18, -26, -4, -36, 14, -30, 24, -12, 22, 0], '#5d616a'); poly([-4, -36, 14, -30, 24, -12, 22, 0, 4, 0], '#787d87');
    for (const [x, y, s] of [[-10, -18, 4], [6, -24, 3.5], [12, -10, 3], [-4, -8, 2.5]]) { ell(x, y, s, s * .8, '#ff9a3c'); ell(x - 1, y - 1, s * .4, s * .3, '#ffe0a0'); }
    if (o.flash > 0) { ctx.globalAlpha = .4; ell(0, -16, 26, 20, '#ffffff'); ctx.globalAlpha = 1; }
  },
});

// ---------- Schmelzofen & Amboss ----------
const M_SMELT = { id: 'smelt', name: 'Schmelzofen', own: () => S.own.smelt, x: SMELT.x, y: SMELT.y, r: SMELT.r,
  inPos: { x: SMELT.x - 50, y: SMELT.y + 80 }, outPos: { x: SMELT.x + 50, y: SMELT.y + 80 }, inItem: 'ore', outItem: 'bar',
  time: () => cookT() * 2.2, inLab: 'Erz', outLab: 'Barren', hint: 'Bring das Erz zum Schmelzofen',
  draw: (t, s) => {
    shadow(34, 12);
    rr(-30, -54, 60, 54, 10, '#8a8f99'); rr(-30, -54, 24, 54, 10, '#a3a9b3');
    rr(-14, -28, 28, 22, 8, '#3a2a24'); ell(0, -16, 10, 6, s.in > 0 ? '#ff8a2a' : '#5a3a2a');
    rr(10, -86, 14, 36, 4, '#6f747d'); smokePuffs(t, 17, -90, s.in > 0 ? 3 : 1);
  } };
const M_ANVIL = { id: 'anvil', name: 'Amboss', own: () => S.own.anvil, x: ANVIL.x, y: ANVIL.y, r: ANVIL.r,
  inPos: { x: ANVIL.x - 50, y: ANVIL.y + 80 }, outPos: { x: ANVIL.x + 50, y: ANVIL.y + 80 }, inItem: 'bar', outItem: 'tools', outCur: 'tools',
  time: () => cookT() * 3, inLab: 'Barren', outLab: 'Werkzeug', hint: 'Bring die Barren zum Amboss',
  draw: (t, s) => {
    shadow(24, 9);
    rr(-14, -20, 28, 20, 4, '#7a5230'); rr(-14, -20, 10, 20, 4, '#946640');
    poly([-22, -30, 22, -30, 14, -20, -14, -20], '#4b5058'); poly([22, -30, 32, -27, 22, -24], '#4b5058'); rr(-22, -34, 44, 5, 2, '#6b717c');
    const k = s.in > 0 ? Math.abs(Math.sin(t * 6)) : 0;
    ctx.save(); ctx.translate(-4, -40 - k * 10); ctx.rotate(-.5 + k * .4); rr(-2, -18, 4, 22, 2, '#7a5230'); rr(-7, -22, 14, 7, 2, '#5d616a'); ctx.restore();
    if (s.in > 0 && k > .95) burst(ANVIL.x, ANVIL.y, 36, '#ffd84a', 2, 60, 2);
  } };
defineMachine(M_SMELT); defineMachine(M_ANVIL);
KIT.matHint.tools = p => {
  const sa = mst('anvil'), ss = mst('smelt');
  if (!S.own.ore) return null;
  if (S.own.anvil && sa.out > 0) return { ...M_ANVIL.outPos, t: 'Hol das Werkzeug am Amboss 🔨' };
  if (S.own.anvil && ss.out > 0) return { ...M_SMELT.outPos, t: 'Hol die Barren am Schmelzofen' };
  const v = nearZ(veins, 'ore', o => !o.stump) || soonest(veins);
  return v && { x: v.x, y: v.y, t: 'Bau Erz in der Erzgrube ab – Werkzeug für: ' + p.name() + ' ⛏️', soft: 1 };
};
// Fertige Barren und Werkzeug abholen (niedrige Priorität, nach dem Kaufen)
KIT.hintLate.push(st => {
  if (!S.own.anvil || st.some(i => i !== 'bar') || st.length >= cap() - 4) return null;
  if (mst('smelt').out >= 6 && !S.own.smith) return { ...M_SMELT.outPos, t: 'Hol die Barren am Schmelzofen' };
  if (mst('anvil').out >= 6 && !S.own.prentice) return { ...M_ANVIL.outPos, t: 'Hol das Werkzeug am Amboss 🔨' };
  return null;
});

// ---------- Helfer ----------
defineHelper({ kind: 'miner', col: '#5a6a7a', opts: { beard: true, hat: '#ffd84a' }, gather: { targets: () => veins, hit: (o, n, npc) => { const def = KIT.nodes.find(d => d.kind === 'vein'); hitNode(def, o, n, 'npc', npc); }, item: 'ore', to: M_SMELT } });
defineHelper({ kind: 'smith', col: '#6b4a32', opts: { apron: '#3d2c22' }, carry: { from: M_SMELT, to: M_ANVIL } });
defineHelper({ kind: 'prentice', col: '#8a6a4a', opts: { apron: '#5a3c22', hat: '#d9c9a8' }, carry: { from: M_ANVIL, to: null, cur: 'tools' } });
for (const k of ['miner', 'smith', 'prentice']) if (S.own[k]) spawnKitHelper(k);

// ---------- Truhen ----------
addChests([
  { x: GOLEM_X + 60, y: ORE.y0 + 70, zone: 'ore', tier: 1, on: oreOpen },
  { x: ORE.x1 - 70, y: ORE.y0 + 70, zone: 'ore', tier: 1, on: oreOpen },
  { x: GOLEM_X + 70, y: ORE.y1 - 60, zone: 'ore', tier: 1, on: oreOpen },
]);

// ---------- Der Eisgolem ----------
defineCreature({ kind: 'icechunk', zones: ['golem'], rect: { x0: ORE.x0, x1: GOLEM_X, y0: ORE.y0, y1: ORE.y1 }, mode: 'hunt', aggro: 900, speed: 70, hp: () => 30, dmg: () => 6, on: () => false, col: '#9fd0f0', size: 4,
  drop: (c) => spawnDrops('crystal', 1, c.x, c.y),
  draw: (c, t) => { ctx.scale(c.face, 1); shadow(16, 6); const b = Math.sin(c.anim) * 1.5; poly([-14, 0, -12, -18 + b, -2, -26 + b, 12, -20 + b, 14, 0], '#9fc6de'); poly([-2, -26 + b, 12, -20 + b, 14, 0, 2, 0], '#cfe6f4'); ell(4, -14 + b, 2, 2, '#2f6fa8'); ell(9, -14 + b, 2, 2, '#2f6fa8'); if (c.flash > 0) { ctx.globalAlpha = .5; ell(0, -12, 16, 14, '#ff4d4d'); ctx.globalAlpha = 1; } } });
const GOLEM = { id: 'golem', name: 'den Eisgolem', ownKey: 'golemGate', deadKey: 'golemDead', zone: 'golem', home: { x: -1110, y: -1350 }, rect: { x0: ORE.x0, x1: GOLEM_X, y0: ORE.y0, y1: ORE.y1 },
  hp: 3200, speed: 42, dmg: 14, r: 46, hpZ: 150, col: '#9fc6de',
  attack: (b, dt, ph) => {
    b.castT -= dt;
    if (b.castT <= 0) {
      b.castT = ph === 1 ? 3.4 : ph === 2 ? 2.8 : 2.1;
      if (Math.random() < .45) bossCast(b.x, b.y, 140, 1.4, 26); // Stampfer um ihn herum
      else for (let i = 0; i < (ph === 3 ? 2 : 1); i++) bossCast(player.x + (i ? rand(-90, 90) : 0), player.y + (i ? rand(-60, 60) : 0), 70, 1.2 + i * .4, 18); // Eisbrocken-Wurf
    }
    if (ph >= 2) {
      b.sumT -= dt;
      if (b.sumT <= 0 && KIT.creatures.filter(c => c.extra).length < 4) { b.sumT = 11; ftext(b.x, b.y, 160, 'KRRRK!', '#cfe6f4', 22); for (let i = 0; i < 2; i++) spawnCreature('icechunk', b.x + rand(-90, 90), b.y + rand(30, 70), { extra: 1, aggro: 99 }); }
    }
  },
  onDeath: (b) => {
    spawnDrops('cash', 18, b.x, b.y, 300 + 40 * S.lv.furnace); spawnDrops('crystal', 12, b.x, b.y); S.tools += 30; ftext(b.x, b.y, 120, '+30 Werkzeug', '#ffe7b0', 20);
    gearDrop(4, b.x, b.y); discover('golem'); rollFind('golem', b.x, b.y);
    banner = { t: 5, a: '🪨 Der Eisgolem zerbricht!', b: 'In seinem Inneren glüht ein Splitter – warm wie das Glutherz.' };
  },
  draw: (b, t) => {
    ctx.scale(b.face * 1.6, 1.6); shadow(40, 13);
    const bob = Math.sin(b.anim) * 1.5, lg = Math.sin(b.anim) * 4;
    rr(-22, -30, 16, 30 + lg * .2, 5, '#7f9fb6'); rr(6, -30, 16, 30 - lg * .2, 5, '#7f9fb6');
    poly([-34, -30 + bob, -30, -78 + bob, -8, -96 + bob, 22, -90 + bob, 36, -60 + bob, 32, -30 + bob], '#8fb3cc');
    poly([-8, -96 + bob, 22, -90 + bob, 36, -60 + bob, 32, -30 + bob, 4, -30 + bob], '#b6d3e6');
    rr(-48, -84 + bob - lg * .3, 16, 46, 6, '#7f9fb6'); rr(32, -84 + bob + lg * .3, 16, 46, 6, '#a3c2d8');
    poly([-10, -112 + bob, 0, -96 + bob, -20, -96 + bob], '#cfe6f4'); poly([14, -110 + bob, 20, -92 + bob, 4, -94 + bob], '#cfe6f4');
    const gl = .6 + Math.sin(t * 4) * .3; ell(0, -62 + bob, 10, 10, `rgba(120,200,255,${gl})`); ell(0, -62 + bob, 5, 5, '#e8f6ff');
    ell(-6, -84 + bob, 3, 2.5, '#2f6fa8'); ell(10, -84 + bob, 3, 2.5, '#2f6fa8');
    if (b.flash > 0) { ctx.globalAlpha = .45; ell(0, -60, 44, 44, '#ff4d4d'); ctx.globalAlpha = 1; }
  } };
defineBoss(GOLEM);

// ---------- Bau-Felder ----------
PADS.push(
  { id: 'ore', x: PASS.x0 + 50, y: -1200, ic: '⛏️', name: () => 'Erzgrube öffnen', cost: () => S.own.ore ? null : 12000, vis: () => S.ch >= 4, buy: () => S.own.ore = 1 },
  { id: 'smelt', x: SMELT.x, y: SMELT.y, ic: '🔥', name: () => 'Schmelzofen bauen', req: () => S.own.smelt ? null : { cash: 8000, stone: 60 }, vis: () => S.own.ore, buy: () => S.own.smelt = 1 },
  { id: 'anvil', x: ANVIL.x, y: ANVIL.y, ic: '🔨', name: () => 'Amboss bauen', req: () => S.own.anvil ? null : { cash: 10000, iron: 30 }, vis: () => S.own.smelt, buy: () => S.own.anvil = 1 },
  { id: 'forge', x: FORGE_PAD.x, y: FORGE_PAD.y, ic: '⚒️', name: () => 'Ausrüstung schmieden', optional: () => (S.run.forged || 0) >= 1, req: () => ({ cash: 3000 + 2000 * (S.run.forged || 0), tools: 20 + 15 * (S.run.forged || 0) }), vis: () => S.own.anvil, buy: () => { emit('forged', 1, false); gainGear(makeGear('forge')); } },
  { id: 'miner', x: ORE.x1 - 70, y: -1050, ic: '⛏️', name: () => 'Bergmann anheuern', cost: () => S.own.miner ? null : 12000, vis: () => S.own.smelt, buy: () => { S.own.miner = 1; spawnKitHelper('miner'); } },
  { id: 'smith', x: ORE.x1 - 160, y: -1050, ic: '🧑‍🏭', name: () => 'Schmiedegeselle', cost: () => S.own.smith ? null : 15000, vis: () => S.own.anvil, buy: () => { S.own.smith = 1; spawnKitHelper('smith'); } },
  { id: 'prentice', x: ORE.x1 - 250, y: -1050, ic: '🧒', name: () => 'Lehrling anheuern', cost: () => S.own.prentice ? null : 15000, vis: () => S.own.smith, buy: () => { S.own.prentice = 1; spawnKitHelper('prentice'); } },
  { id: 'golemGate', x: GOLEM_X + 70, y: -1350, ic: '🪨', name: () => 'Golemhalle öffnen', req: () => S.own.golemGate ? null : { cash: 15000, tools: 120 }, vis: () => S.own.anvil && (S.run.forged || 0) >= 1, buy: () => S.own.golemGate = 1 },
);
Object.assign(PAD_TXT, {
  ore: ['Erz, Schmiede und Ausrüstung', 'Die Erzgrube ist offen. Schlag Erz aus den Adern und bring es zum Schmelzofen.'],
  smelt: ['Macht aus Erz Barren – und wärmt', 'Leg Erz links vor den Schmelzofen. Am Feuer bleibt es warm.'],
  anvil: ['Macht aus Barren Werkzeug 🔨', 'Bring Barren zum Amboss. Werkzeug brauchst du für Ofen, Bauten und Ausrüstung.'],
  forge: ['Bjarne schmiedet dir ein Ausrüstungsteil', 'Neue Ausrüstung! Schau ins Tagebuch unter „Ausrüstung“.'],
  miner: ['Baut Erz ab und bringt es zum Schmelzofen'],
  smith: ['Trägt Barren zum Amboss'],
  prentice: ['Bringt das Werkzeug in den Vorrat'],
  golemGate: ['Dahinter schläft der Eisgolem', 'Der Eisgolem erwacht! Weiche seinen Stampfern und Würfen aus (rote Kreise).'],
});
for (const p of PADS) { const t = PAD_TXT[p.id]; if (t && !p.desc) { p.desc = t[0]; if (t[1]) p.info = () => t[1]; } }
Object.assign(REACT, {
  ore: ['bjarne', 'Erz! Echtes Erz! Jetzt baue ich dir eine richtige Schmiede.'],
  anvil: ['bjarne', 'Der Amboss steht. Bring mir Werkzeug, und ich schmiede dir was Feines.'],
  golemGate: ['ylva', 'Der Golem ist langsam – aber wenn er trifft, dann richtig.'],
});
QUESTS.bjarne.push(
  { id: 'oreq', t: n => `Bring mir ${n} Erz`, item: 'ore', n: () => 10 + S.lv.furnace, ok: () => S.own.ore, r: { tools: 6 } },
  { id: 'toolq', t: n => `Stell ${n} Werkzeug her`, ev: 'tools', n: () => 15, ok: () => S.own.anvil },
);

// ---------- Sammelbuch, Erfolge, Fundstücke ----------
EXTRA_FINDS.push(
  { id: 'lampe', n: 'Grubenlampe', ic: '🏮', src: 'vein', p: .04, d: 'Rußig, aber sie brennt noch. Hier haben einmal Bergleute gearbeitet.' },
  { id: 'hacke', n: 'Alte Spitzhacke', ic: '⛏️', src: 'vein', p: .03, d: 'In den Griff ist eine kleine Flamme geschnitzt – wie auf der alten Münze.' },
  { id: 'golemherz', n: 'Golemherz', ic: '💠', src: 'golem', p: 1, d: 'Ein Splitter, der warm pulsiert. Er zeigt nach Norden, wo das Eis am dicksten ist.' },
);
BOOK.push({ id: 'ore', n: 'Die Erzgrube', bonus: '+1 Erz pro Erzader', e: [
  { id: 'golem', n: 'Eisgolem', ic: '🗿', d: 'Ein wandelnder Eisberg. Langsam, aber unaufhaltsam.' },
  { id: 'icechunk', n: 'Eisbrocken', ic: '🧊', d: 'Kleine Splitter des Golems, die ein Eigenleben entwickeln.' },
  ...EXTRA_FINDS.slice(-3),
] });
const _iceDrop = KIT.cdefs.icechunk.drop; KIT.cdefs.icechunk.drop = c => { discover('icechunk'); _iceDrop(c); };
ACH.push(
  { id: 'forge1', n: 'Geschmiedet', d: 'Lass Bjarne ein Ausrüstungsteil schmieden.', ok: () => (S.run.forged || 0) >= 1, r: { tools: 10 } },
  { id: 'forge5', n: 'Meisterschmied', d: 'Schmiede 5 Ausrüstungsteile.', ok: () => (S.run.forged || 0) >= 5, r: { sparks: 1 } },
  { id: 'tools200', n: 'Werkzeugkiste', d: 'Stell 200 Werkzeug her.', ok: () => stv('tools') >= 200, r: { cash: 5000 } },
  { id: 'epic', n: 'Episch!', d: 'Finde ein episches Ausrüstungsteil.', ok: () => Object.values(S.gear).concat(S.inv).some(g => g && g.r >= 2), r: { cash: 3000 } },
  { id: 'legend', n: 'Legendär!', d: 'Finde ein legendäres Ausrüstungsteil.', ok: () => Object.values(S.gear).concat(S.inv).some(g => g && g.r >= 3), r: { sparks: 2 } },
  { id: 'golem1', n: 'Golembrecher', d: 'Besiege den Eisgolem.', ok: () => S.golemDead, r: { sparks: 2 } },
  { id: 'furn9', n: 'Schmiedefeuer', d: 'Bring den Ofen auf Stufe 9.', ok: () => S.lv.furnace >= 9, r: { cash: 8000 } },
);
STATS.splice(7, 0, ['Erz abgebaut', () => stv('ore')], ['Werkzeug hergestellt', () => stv('tools')], ['Truhen geöffnet', () => stv('chest')]);

// ---------- Boden ----------
KIT.ground.push(t => {
  if (S.ch < 4 && !S.own.ore) return;
  ctx.fillStyle = S.own.ore ? '#dcd8d2' : '#e2e6ea'; ctx.fillRect(ORE.x0, ORE.y0, ORE.x1 - ORE.x0, ORE.y1 - ORE.y0);
  ctx.fillStyle = S.own.golemGate ? '#cfd6de' : '#d9dee4'; ctx.fillRect(ORE.x0, ORE.y0, GOLEM_X - ORE.x0, ORE.y1 - ORE.y0);
  // Gleise
  ctx.strokeStyle = 'rgba(110,80,50,.55)'; ctx.lineWidth = 4;
  for (const dy of [-8, 8]) { ctx.beginPath(); ctx.moveTo(PASS.x0, -1200 + dy); ctx.lineTo(SMELT.x + 60, -1200 + dy); ctx.lineTo(ANVIL.x - 120, -1200 + dy); ctx.stroke(); }
  for (let x = ANVIL.x - 110; x < PASS.x0; x += 22) rr(x, -1212, 6, 24, 2, 'rgba(110,80,50,.45)');
  if (S.own.smelt) { const g = ctx.createRadialGradient(SMELT.x, SMELT.y, 20, SMELT.x, SMELT.y, 170); g.addColorStop(0, 'rgba(255,170,80,.45)'); g.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SMELT.x, SMELT.y, 170, 0, TAU); ctx.fill(); }
});

// ---------- Kapitel ----------
CHAPTERS[3] = {
  n: 4, title: 'Die Erzgrube',
  text: 'Auf der zerrissenen Karte des Rudelführers ist eine alte Erzgrube eingezeichnet, gleich westlich des Passes. Bjarne ist kaum zu halten: Mit echtem Erz kann er endlich eine richtige Schmiede bauen.',
  say: 'Erz, Barren, Werkzeug – und dann schmiedet Bjarne dir Ausrüstung. Doch in der Tiefe der Grube schläft etwas Großes.',
  goals: [
    { t: 'Öffne die Erzgrube', ok: () => S.own.ore },
    { t: 'Baue den Schmelzofen', ok: () => S.own.smelt },
    { t: 'Baue den Amboss', ok: () => S.own.anvil },
    { t: 'Lass Bjarne Ausrüstung schmieden', ok: () => (S.run.forged || 0) >= 1 },
    { t: 'Ofen auf Stufe 9 bringen', ok: () => S.lv.furnace >= 9 },
    { t: 'Besiege den Eisgolem', ok: () => S.golemDead },
  ],
};
