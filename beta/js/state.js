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
  lv: { axes: 1, cap: 0, boots: 0, coat: 0, sharp: 0, furnace: 1, hunter: 0, huts: 0, store: 0 },
  own: { tower: 0, forest: 0, kiln: 0, coalCt: 0, mine: 0, server: 0, lumber: 0, settle: 0, smoke: 0, stall: 0, lake: 0, fisher: 0, seller: 0 },
  paid: {}, grillIn: 0, grillOut: 0, kilnIn: 0, kilnOut: 0, meatCt: 0, coalCt: 0, cashPile: 0,
  fishIn: 0, smokeOut: 0, stallCt: 0, cashPile2: 0,
  time: 0, nextBliz: 0, won: 0, sold: 0, yetiKills: 0, muted: 0, helpSeen: 0,
  // Kampagne
  ch: 0, chSeen: 0,           // aktuelles Kapitel (0 = noch nicht ermittelt) und zuletzt gezeigte Kapiteltafel
  quests: [], offers: {}, qNext: {}, qDone: 0,
  // Langzeitmotivation
  st: {}, ach: {}, book: {}, sparks: 0, diaryNew: 0,
});
let S = DEF();
function load() {
  try {
    let raw = localStorage.getItem(KEY);
    // Erste Beta-Runde: mit einer Kopie des echten Spielstands starten (das Original bleibt unberührt)
    if (!raw && BETA) { raw = localStorage.getItem(LIVE_KEY); if (raw) localStorage.setItem(KEY, raw); }
    const j = JSON.parse(raw);
    // Fehlende Felder alter Spielstände mit Standardwerten auffüllen
    if (j) { const d = DEF(), lv = Object.assign(d.lv, j.lv || {}), own = Object.assign(d.own, j.own || {}); S = Object.assign(d, j); S.lv = lv; S.own = own; S.paid = j.paid || {}; S.st = j.st || {}; S.ach = j.ach || {}; S.book = j.book || {}; S.offers = j.offers || {}; S.qNext = j.qNext || {}; S.quests = j.quests || []; }
  } catch (e) { }
}
let resetting = false;
function save() { if (resetting) return; S.lastSeen = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
load();
hudCash = prevCash = S.cash;

const cap = () => 10 + 8 * S.lv.cap + 10 * S.lv.store;
const speed = () => 195 * (1 + 0.16 * S.lv.boots) * bookMul('finds');
const dmg = () => 1 + S.lv.sharp;
const heatR = () => 330 + 45 * S.lv.furnace;
const cookT = () => 0.75 / (1 + 0.35 * (S.lv.furnace - 1));
const meatPrice = () => 1 + S.lv.furnace;
const coalPrice = () => (2 + S.lv.furnace) * (blizzard() ? 2 : 1);
const fishPrice = () => 3 + S.lv.furnace + S.lv.huts;
const fishT = () => 1.3;          // Sekunden am Eisloch bis zum Biss
const HOLE_CD = 8;                // so lange friert ein Loch nach einem Fang zu
const brazR = () => 300 + 25 * S.lv.huts;
const blizzard = () => S.own.forest && S.time >= S.nextBliz && S.time < S.nextBliz + 28;
const blizWarn = () => S.own.forest && S.time >= S.nextBliz - 6 && S.time < S.nextBliz;
