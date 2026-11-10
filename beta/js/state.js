'use strict';
// Glutfrost – Spielstand und abgeleitete Werte
// =====================================================================
//  SPIELSTAND
// =====================================================================
// Die Beta (Unterordner /beta/) hat einen eigenen Spielstand, damit Tests nie den echten Fortschritt berühren.
const LIVE_KEY = 'glutfrost-save-v1';
const BETA = location.pathname.includes('/beta/');
const KEY = BETA ? 'glutfrost-beta-save-v1' : LIVE_KEY;
let hudCash = 0, hudBump = 0, prevCash = 0;
const DEF = () => ({
  cash: 0, iron: 0, stone: 0, crystal: 0,
  lv: { axes: 1, cap: 0, boots: 0, coat: 0, sharp: 0, furnace: 1, hunter: 0, huts: 0, store: 0, wall: 0, watch: 0 },
  own: { tower: 0, forest: 0, kiln: 0, coalCt: 0, mine: 0, server: 0, lumber: 0, settle: 0, smoke: 0, stall: 0, lake: 0, fisher: 0, seller: 0,
    pass: 0, wall: 0, watch1: 0, watch2: 0, ammoSt: 0, armorer: 0, den: 0 },
  paid: {}, grillIn: 0, grillOut: 0, kilnIn: 0, kilnOut: 0, meatCt: 0, coalCt: 0, cashPile: 0,
  fishIn: 0, smokeOut: 0, stallCt: 0, cashPile2: 0,
  time: 0, nextBliz: 0, won: 0, sold: 0, yetiKills: 0, muted: 0, helpSeen: 0,
  // Kampagne
  ch: 0, chSeen: 0,           // aktuelles Kapitel (0 = noch nicht ermittelt) und zuletzt gezeigte Kapiteltafel
  quests: [], offers: {}, qNext: {}, qDone: 0,
  // Langzeitmotivation
  st: {}, ach: {}, book: {}, sparks: 0, diaryNew: 0,
  // Kapitel 3: Tag und Nacht, Munition, Rudelführer
  dayT: 0, nightNo: 0, nightsOk: 0, shots: 0, ammoW: 0, ammoC: 0, bossDead: 0, frz: {}, music: 1,
  // Kapitel 4–6 und Endspiel
  tools: 0, cloth: 0, m: {}, gear: { axe: null, coat: null, boots: null, charm: null }, inv: [],
  run: {}, // Zähler nur für diesen Durchlauf (S.st zählt über alle „Neues Feuer“ hinweg)
  // Spielfigur: gewählter Held (kleiner Bonus) und frei anpassbares Aussehen
  hero: 'finn', look: { skin: 0, coat: 0, head: 'hood', hair: 0, beard: 1, scarf: 0 },
  golemDead: 0, wyrmDead: 0, guardDead: 0, nests: 0, siege: 0, finale: 0, glut: {}, ng: 0, bestNight: 0,
});
let S = DEF();
function load() {
  try {
    let raw = localStorage.getItem(KEY);
    // Erste Beta-Runde: mit einer Kopie des echten Spielstands starten (das Original bleibt unberührt)
    if (!raw && BETA) { raw = localStorage.getItem(LIVE_KEY); if (raw) localStorage.setItem(KEY, raw); }
    const j = JSON.parse(raw);
    // Fehlende Felder alter Spielstände mit Standardwerten auffüllen
    if (j) { const d = DEF(), lv = Object.assign(d.lv, j.lv || {}), own = Object.assign(d.own, j.own || {}); S = Object.assign(d, j); S.lv = lv; S.own = own; S.paid = j.paid || {}; S.st = j.st || {}; S.ach = j.ach || {}; S.book = j.book || {}; S.offers = j.offers || {}; S.qNext = j.qNext || {}; S.quests = j.quests || []; S.frz = j.frz || {}; S.m = j.m || {}; S.gear = Object.assign(d.gear, j.gear || {}); S.inv = j.inv || []; S.glut = j.glut || {}; S.run = j.run || Object.assign({}, S.st); S.look = Object.assign(d.look, j.look || {}); }
  } catch (e) { }
}
// Helden: wählbare Spielfigur mit kleinem Bonus (Aussehen ist nur ein Vorschlag und frei änderbar)
const HEROES = [
  { id: 'finn', n: 'Finn', role: 'der Jäger', d: '+10 % Schaden', v: { dmg: .10 }, look: { skin: 0, coat: 0, head: 'hood', hair: 0, beard: 1, scarf: 0 } },
  { id: 'runa', n: 'Runa', role: 'die Läuferin', d: '+8 % Lauftempo', v: { speed: .08 }, look: { skin: 1, coat: 1, head: 'band', hair: 3, beard: 0, scarf: 0 } },
  { id: 'tjark', n: 'Tjark', role: 'der Träger', d: '+6 Tragkraft', v: { cap: 6 }, look: { skin: 3, coat: 4, head: 'fur', hair: 1, beard: 2, scarf: 0 } },
  { id: 'edda', n: 'Edda', role: 'die Händlerin', d: '+8 % Verkaufspreis', v: { cash: .08 }, look: { skin: 2, coat: 3, head: 'cap', hair: 2, beard: 0, scarf: 2 } },
  { id: 'bo', n: 'Bo', role: 'der Köhler', d: 'Kühlt 15 % langsamer aus', v: { cold: .15 }, look: { skin: 4, coat: 5, head: 'bare', hair: 5, beard: 2, scarf: 1 } },
];
function heroV(k) { const h = HEROES.find(x => x.id === S.hero); return (h && h.v[k]) || 0; }
const heroMul = k => 1 + heroV(k);
let resetting = false;
function save() { if (resetting) return; S.lastSeen = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
load();
hudCash = prevCash = S.cash;

const cap = () => 10 + 8 * S.lv.cap + 10 * S.lv.store + 5 * glutLv('cap') + heroV('cap');
const speed = () => 195 * (1 + 0.16 * S.lv.boots) * bookMul('finds') * gearMul('speed') * (1 + .08 * glutLv('speed')) * heroMul('speed');
// Schärfen: Stufen 1–4 je +1 Schaden, Stufen 5–10 je +0,5
const dmg = () => (1 + Math.min(4, S.lv.sharp) + .5 * Math.max(0, S.lv.sharp - 4)) * gearMul('dmg') * heroMul('dmg');
const heatR = () => 330 + 45 * S.lv.furnace;
const cookT = () => 0.75 / (1 + 0.35 * (Math.min(S.lv.furnace, 15) - 1)) / (1 + .15 * glutLv('cook'));
// Ab Ofenstufe 7 steigen alle Preise mit jeder Stufe um 22 % (das Lager wird reicher)
const priceMul = () => Math.pow(1.22, Math.max(0, S.lv.furnace - 6));
const meatPrice = () => 1 + S.lv.furnace;
const coalPrice = () => (2 + S.lv.furnace) * (blizzard() ? 2 : 1);
const fishPrice = () => 3 + S.lv.furnace + S.lv.huts;
const fishT = () => 1.3;          // Sekunden am Eisloch bis zum Biss
const HOLE_CD = 8;                // so lange friert ein Loch nach einem Fang zu
const brazR = () => 300 + 25 * S.lv.huts;
const blizzard = () => S.own.forest && S.time >= S.nextBliz && S.time < S.nextBliz + 28;
const blizWarn = () => S.own.forest && S.time >= S.nextBliz - 6 && S.time < S.nextBliz;
