'use strict';
// Glutfrost – Entitäten, Warteschlangen und Bau-Felder
// =====================================================================
//  ENTITÄTEN
// =====================================================================
const player = { x: 0, y: 120, hp: 100, warm: 100, stack: [], face: 1, anim: 0, axeA: 0, dead: 0, moving: 0, hurtT: 0 };
let bears = [], trees = [], rocks = [], drops = [], flyers = [], conv = [], parts = [], texts = [], bolts = [], npcs = [], casts = [], shards = [];
let holes = [], crystals = [], stones = [], playerHole = null;
let yeti = null, towerT = 0, towerAim = -Math.PI / 2, grillT = 0, kilnT = 0, smokeT = 0, xferT = 0, saveT = 0, banner = null, firstMove = false;

function spawnBear(b, farFromPlayer = true) {
  let x, y, k = 0;
  do { x = rand(FIELD.x0 + 40, FIELD.x1 - 40); y = rand(FIELD.y0 + 40, FIELD.y1 - 70); k++; }
  while (k < 30 && farFromPlayer && dist(x, y, player.x, player.y) < 300);
  Object.assign(b, { x, y, hp: 3, max: 3, hitCd: 0, aggro: 0, vx: 0, vy: 0, wt: rand(0, 3), dead: 0, flash: 0, anim: rand(0, 6), face: 1, big: Math.random() < .15 });
  if (b.big) { b.hp = b.max = 6; }
  return b;
}
for (let i = 0; i < 24; i++) bears.push(spawnBear({}, false));

(function makeTrees() {
  for (let x = FOREST.x0 + 60; x < FOREST.x1 - 25; x += 74)
    for (let y = FOREST.y0 + 40; y < FOREST.y1 - 20; y += 66) {
      const tx = x + rand(-20, 20) + ((y / 66) % 2) * 26, ty = y + rand(-16, 16);
      if (Math.random() < .3) continue;
      if (dist(tx, ty, 820, -150) < 190) continue;   // Lichtung des Yetis
      if (Math.abs(ty + 130) < 50 && tx < 430) continue; // Eingang frei
      trees.push({ x: tx, y: ty, hp: 4, max: 4, hitCd: 0, stump: 0, shake: 0, s: rand(.9, 1.2), zone: 'forest' });
    }
})();
(function makeRocks() {
  for (let i = 0; i < 400 && rocks.length < 34; i++) {
    const x = rand(MINE.x0 + 50, MINE.x1 - 40), y = rand(MINE.y0 + 40, MINE.y1 - 30);
    if (Math.abs(y + 130) < 50 && x > -430) continue;
    if (dist(x, y, -400, -20) < 80) continue; // Schärf-Feld
    if (rocks.some(r => dist(r.x, r.y, x, y) < 70)) continue;
    rocks.push({ x, y, hp: 8, max: 8, hitCd: 0, stump: 0, shake: 0, s: rand(.85, 1.25), seed: Math.random() });
  }
})();
(function makeSettle() {
  const free = (x, y, list, d) => list.every(o => dist(o.x, o.y, x, y) >= d);
  const gate = (x, y) => dist(x, y, LAKE_X - 30, LAKE_GATE.y) < 95;
  // Eissee: Eislöcher und Feuerkristalle
  for (let i = 0; i < 800 && holes.length < 8; i++) {
    const x = rand(SB.x0 + 50, LAKE_X - 45), y = rand(SB.y0 + 45, SB.y1 - 40);
    if (gate(x, y) || !free(x, y, holes, 100)) continue;
    holes.push({ x, y, t: 0, np: 0, cd: rand(0, 3), bob: rand(0, 6) });
  }
  for (let i = 0; i < 800 && crystals.length < 4; i++) {
    const x = rand(SB.x0 + 45, LAKE_X - 50), y = rand(SB.y0 + 50, SB.y1 - 35);
    if (gate(x, y) || !free(x, y, holes, 80) || !free(x, y, crystals, 130)) continue;
    crystals.push({ x, y, hp: 30, max: 30, hitCd: 0, stump: 0, shake: 0, flash: 0 });
  }
  // Steinbruch und Wäldchen zwischen Siedlung und See (Gasse zum Seetor bleibt frei)
  const all = [];
  for (let i = 0; i < 900 && stones.length < 7; i++) {
    const x = rand(LAKE_X + 35, -588), y = rand(SB.y0 + 40, SB.y1 - 30);
    if (Math.abs(y - LAKE_GATE.y) < 62 || !free(x, y, all, 64)) continue;
    const s = { x, y, hp: 6, max: 6, hitCd: 0, stump: 0, shake: 0, s: rand(.85, 1.15) }; stones.push(s); all.push(s);
  }
  for (let i = 0; i < 900 && all.length < 13; i++) {
    const x = rand(LAKE_X + 30, -588), y = rand(SB.y0 + 30, SB.y1 - 25);
    if (Math.abs(y - LAKE_GATE.y) < 62 || !free(x, y, all, 58)) continue;
    const t = { x, y, hp: 4, max: 4, hitCd: 0, stump: 0, shake: 0, s: rand(.85, 1.05), zone: 'settle' }; trees.push(t); all.push(t);
  }
})();

function spawnYeti() {
  yeti = { x: 820, y: -150, hp: 0, max: 0, hitCd: 0, flash: 0, castT: 3, anim: 0, dead: 0, face: -1, rest: 0 };
  yeti.max = yeti.hp = 90 + 45 * S.yetiKills;
}
if (S.own.forest) spawnYeti();

function spawnNpc(kind) {
  npcs.push({ kind, x: rand(-40, 40), y: 130, stack: [], path: [], gx: 1e9, gy: 1e9, replan: 0, hitT: 0, anim: 0, axeA: 0, target: null, xfer: 0, face: 1 });
}
for (let i = 0; i < S.lv.hunter; i++) spawnNpc('hunter');
if (S.own.server) spawnNpc('server');
if (S.own.lumber) spawnNpc('lumber');
if (S.own.fisher) spawnNpc('fisher');
if (S.own.seller) spawnNpc('seller');

// ---------- Überlebende / Warteschlangen ----------
const COATS = ['#3d82c4', '#4a95d1', '#2f6fa8', '#5aa0c8', '#3b78b0'];
const RES_COATS = ['#c46a3d', '#9a5bb5', '#5a9a6a', '#c9a23a', '#b8505a'];
const queues = {
  meat: { ct: MEAT_CT, key: 'meatCt', item: 'cooked', list: [], spawnT: 1, max: () => 4 + (S.lv.huts >= 2 ? 1 : 0), price: meatPrice, on: () => true, pile: 'cashPile', at: CASH, cols: COATS },
  coal: { ct: COAL_CT, key: 'coalCt', item: 'coal', list: [], spawnT: 1, max: () => 4 + (S.lv.huts >= 2 ? 1 : 0), price: coalPrice, on: () => S.own.coalCt, pile: 'cashPile', at: CASH, cols: COATS },
  // Bewohner der Siedlung kommen aus ihren Hütten zum Marktstand
  fish: { ct: STALL, key: 'stallCt', item: 'smoked', list: [], spawnT: 1, max: () => 3 + S.lv.huts, price: fishPrice, on: () => S.own.stall, pile: 'cashPile2', at: CASH2, cols: RES_COATS, res: 1 },
};
function queueSpot(q, i) { return q.res ? [q.ct.x + (i % 2 ? 10 : -6), q.ct.y + 45 + i * 40] : [q.ct.x + (i % 2 ? 10 : -6), 300 + i * 40]; }

// =====================================================================
//  BAU-FELDER (Upgrades)
// =====================================================================
const PADS = [
  { id: 'axes', x: -200, y: 110, ic: '🪓', name: () => S.lv.axes + 1 + '. Axt', cost: () => [12, 45, 150, 480][S.lv.axes - 1], vis: () => true, buy: () => S.lv.axes++ },
  { id: 'cap', x: -200, y: -50, ic: '🎒', name: () => 'Tragkraft +8', cost: () => [15, 60, 170, 480, 1000][S.lv.cap], vis: () => true, buy: () => S.lv.cap++ },
  { id: 'tower', x: TOWER.x, y: TOWER.y, ic: '🏹', name: () => 'Armbrustturm', cost: () => S.own.tower ? null : 30, vis: () => S.lv.axes >= 2 || S.lv.cap >= 1, buy: () => S.own.tower = 1 },
  { id: 'forest', x: 177, y: -102, ic: '🌲', name: () => 'Wald öffnen', cost: () => S.own.forest ? null : 60, vis: () => S.own.tower, buy: () => { S.own.forest = 1; S.nextBliz = S.time + 70; spawnYeti(); } },
  { id: 'kiln', x: KILN.x, y: KILN.y, ic: '⚒️', name: () => 'Kohlenmeiler', cost: () => S.own.kiln ? null : 40, vis: () => S.own.forest, buy: () => S.own.kiln = 1 },
  { id: 'coalCt', x: COAL_CT.zx, y: COAL_CT.zy, ic: '⚫', name: () => 'Kohle-Theke', cost: () => S.own.coalCt ? null : 40, vis: () => S.own.kiln, buy: () => S.own.coalCt = 1 },
  {
    id: 'furnace', x: 155, y: 170, ic: '🔥', name: () => 'Ofen Stufe ' + (S.lv.furnace + 1),
    req: () => { const l = S.lv.furnace; return l < 5 ? { cash: [120, 360, 900, 1800][l - 1] } : l < 8 ? { cash: [9000, 18000, 28000][l - 5], crystal: [15, 30, 40][l - 5] } : null; },
    // Höchststufe je Kapitel: K2 bis 5, K3 bis 7, danach 8
    vis: () => S.own.tower && (S.lv.furnace < 5 || S.own.lake) && S.lv.furnace < (S.ch >= 4 ? 8 : S.ch >= 3 ? 7 : 5),
    buy: () => {
      S.lv.furnace++;
      if (S.lv.furnace >= 5 && !S.won) S.won = 1; // Kapitelabschluss übernimmt jetzt die Kampagne
      if (S.lv.furnace >= 8 && S.won < 2) { S.won = 2; banner = { t: 8, a: '🔥 Glutfrost-Legende!', b: 'Der Ofen glüht auf Stufe 8 – das Eis weicht zurück.' }; }
    }
  },
  { id: 'hunter', x: -200, y: 30, ic: '🧔', name: () => 'Jäger anheuern', cost: () => [120, 420][S.lv.hunter], vis: () => S.own.tower, buy: () => { S.lv.hunter++; spawnNpc('hunter'); } },
  { id: 'boots', x: 200, y: -50, ic: '🥾', name: () => 'Schneeschuhe', cost: () => [35, 110, 340][S.lv.boots], vis: () => S.own.tower, buy: () => S.lv.boots++ },
  { id: 'coat', x: 200, y: 30, ic: '🧥', name: () => 'Pelzmantel', cost: () => [50, 160, 420][S.lv.coat], vis: () => S.own.forest, buy: () => S.lv.coat++ },
  { id: 'server', x: 200, y: 110, ic: '🧑‍🍳', name: () => 'Thekenhelfer', cost: () => S.own.server ? null : 180, vis: () => S.lv.hunter >= 1, buy: () => { S.own.server = 1; spawnNpc('server'); } },
  { id: 'lumber', x: 155, y: -170, ic: '🪚', name: () => 'Holzfäller', cost: () => S.own.lumber ? null : 220, vis: () => S.own.forest && S.own.kiln, buy: () => { S.own.lumber = 1; spawnNpc('lumber'); } },
  { id: 'mine', x: -177, y: -102, ic: '⛏️', name: () => 'Eisenmine öffnen', cost: () => S.own.mine ? null : 200, vis: () => S.lv.furnace >= 2, buy: () => S.own.mine = 1 },
  { id: 'sharp', x: -400, y: -20, cur: 'iron', ic: '⚔️', name: () => 'Axt schärfen', cost: () => [8, 20, 40, 80][S.lv.sharp], vis: () => S.own.mine, buy: () => S.lv.sharp++ },
  // ---------- Kapitel 2: Siedlung ----------
  { id: 'settle', x: -150, y: 170, ic: '🏘️', name: () => 'Siedlung erschließen', cost: () => S.own.settle ? null : 500, vis: () => S.lv.furnace >= 3, buy: () => S.own.settle = 1 },
  { id: 'smoke', x: SMOKE.x, y: SMOKE.y, ic: '🐟', name: () => 'Räucherei bauen', req: () => S.own.smoke ? null : { cash: 320, wood: 20, stone: 16 }, vis: () => S.own.settle, buy: () => S.own.smoke = 1 },
  { id: 'lake', x: LAKE_X + 40, y: LAKE_GATE.y, ic: '🧊', name: () => 'Eissee öffnen', cost: () => S.own.lake ? null : 650, vis: () => S.own.smoke, buy: () => S.own.lake = 1 },
  { id: 'stall', x: STALL.zx, y: STALL.zy, ic: '🏪', name: () => 'Marktstand bauen', req: () => S.own.stall ? null : { cash: 240, wood: 16 }, vis: () => S.own.smoke, buy: () => S.own.stall = 1 },
  { id: 'huts', x: HUTS[1].x, y: 872, ic: '🏠', name: () => 'Unterkünfte Stufe ' + (S.lv.huts + 1), req: () => [{ cash: 500, wood: 20, stone: 20 }, { cash: 1100, wood: 30, stone: 30 }, { cash: 2200, wood: 45, stone: 45 }][S.lv.huts] || null, vis: () => S.own.stall, buy: () => S.lv.huts++ },
  { id: 'store', x: STORE.x, y: STORE.y + 85, ic: '📦', name: () => S.lv.store ? 'Lagerhaus ausbauen' : 'Lagerhaus bauen', req: () => [{ cash: 400, wood: 20, stone: 25 }, { cash: 900, wood: 35, stone: 40 }][S.lv.store] || null, vis: () => S.own.smoke, buy: () => S.lv.store++ },
  { id: 'fisher', x: -195, y: 690, ic: '🎣', name: () => 'Fischer anheuern', cost: () => S.own.fisher ? null : 700, vis: () => S.own.lake && S.own.stall, buy: () => { S.own.fisher = 1; spawnNpc('fisher'); } },
  { id: 'seller', x: -195, y: 800, ic: '🧺', name: () => 'Markthelfer', cost: () => S.own.seller ? null : 800, vis: () => S.own.fisher, buy: () => { S.own.seller = 1; spawnNpc('seller'); } },
];
const PAD_TXT = {
  axes: ['Mehr Äxte = schnellere Treffer'],
  cap: ['Mehr auf einmal tragen'],
  tower: ['Schießt auf Bären – Fleisch kommt per Band', 'Der Turm jagt jetzt mit – das Fleisch rollt von selbst zum Ofen.'],
  forest: ['Holz für Kohle – Vorsicht, Yeti!', 'Holz → Kohlenmeiler → Kohle. Im Wald lebt der Yeti!'],
  kiln: ['Macht aus Holz Kohle', 'Leg Holz auf das rechte Feld neben dem Ofen.'],
  coalCt: ['Überlebende kaufen Kohle', 'Kohle bringt mehr als Fleisch – im Schneesturm sogar doppelt.'],
  furnace: ['Höhere Preise, schneller, wärmer', 'Höhere Preise, schnelleres Braten und eine größere Wärmezone.'],
  hunter: ['Jagt Bären für dich', 'Dein Jäger bringt ab jetzt Fleisch zum Ofen.'],
  boots: ['Schneller laufen'],
  coat: ['Langsamer auskühlen'],
  server: ['Füllt die Theken automatisch', 'Die Theken werden jetzt automatisch befüllt – deine Helfer verdienen sogar, während du weg bist.'],
  lumber: ['Fällt Bäume für den Kohlenmeiler', 'Holz kommt jetzt automatisch zum Kohlenmeiler.'],
  mine: ['Eisenerz für schärfere Äxte', 'Baue Erz ab und schärfe damit deine Äxte.'],
  sharp: ['Mehr Schaden pro Treffer'],
  settle: ['Erweitere dein Lager nach Südwesten', 'Die Siedlung ist offen! Gebäude brauchen Holz 🪵 und Stein 🪨.'],
  smoke: ['Räuchert Fisch aus dem Eissee', 'Leg Fisch auf das linke Feld vor der Räucherei.'],
  lake: ['Angeln & Feuerkristalle', 'Stell dich neben ein Eisloch zum Angeln. Feuerkristalle 🔶 stärken den Ofen!'],
  stall: ['Bewohner kaufen Räucherfisch', 'Die Bewohner kaufen hier Räucherfisch – sie zahlen gut.'],
  huts: ['Mehr Bewohner & mehr Kunden', 'Mehr Bewohner – mehr Kunden an allen Theken, Fisch wird teurer.'],
  store: ['Tragkraft +10', 'Du kannst jetzt mehr auf einmal tragen.'],
  fisher: ['Angelt für dich', 'Der Fischer bringt ab jetzt Fisch zur Räucherei.'],
  seller: ['Füllt den Marktstand', 'Der Marktstand wird jetzt automatisch befüllt.'],
};
for (const p of PADS) { const t = PAD_TXT[p.id]; if (t) { p.desc = t[0]; if (t[1]) p.info = () => t[1]; } }
// Kosten: entweder cost() + cur (eine Währung) oder req() mit mehreren Ressourcen.
// Holz kommt aus dem Rucksack, alles andere sind Vorräte (Geld, Eisen, Stein, Kristalle).
function reqOf(p) { if (p.req) return p.req(); const c = p.cost(); return c == null ? null : { [p.cur || 'cash']: c }; }
function paidOf(p) {
  let v = S.paid[p.id];
  if (!v || typeof v !== 'object') { v = typeof v === 'number' && v > 0 ? { [p.cur || 'cash']: v } : {}; S.paid[p.id] = v; }
  return v;
}
function remOf(p) { const r = reqOf(p), pd = paidOf(p), o = {}; if (!r) return null; for (const k in r) o[k] = Math.max(0, r[k] - (pd[k] || 0)); return o; }
function padFrac(p) { const r = reqOf(p), pd = paidOf(p); let a = 0, n = 0; for (const k in r) { a += Math.min(1, (pd[k] || 0) / r[k]); n++; } return n ? a / n : 0; }
function padActive(p) { return p.vis() && reqOf(p) != null; }
const countOf = (list, t) => { let n = 0; for (const i of list) if (i === t) n++; return n; };
