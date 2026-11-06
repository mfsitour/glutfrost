'use strict';
// Glutfrost – Welt-Layout: Gebiete, Zäune, Tore, Deko
// =====================================================================
//  WELT-LAYOUT
// =====================================================================
const HR = 300, HH = HR * Math.sqrt(3) / 2;
const FURN = { x: 0, y: -20, r: 46 };
const GRILL_IN = { x: -95, y: -25 }, GRILL_OUT = { x: -95, y: 65 };
const KILN = { x: 100, y: -112, r: 30 };
const KILN_IN = { x: 95, y: -25 }, KILN_OUT = { x: 95, y: 65 };
const MEAT_CT = { x: -90, y: 262, zx: -90, zy: 222 };
const COAL_CT = { x: 90, y: 262, zx: 90, zy: 222 };
const CASH = { x: 0, y: 205 };
const TOWER = { x: -112, y: -192, r: 22 };
const CONV = [[-112, -172], [-112, -70], [-98, -42]];
const FIELD = { x0: -600, x1: 315, y0: -1000, y1: -256 };
const FOREST = { x0: 315, x1: 1050, y0: -650, y1: 380 };
const MINE = { x0: -1050, x1: -315, y0: -230, y1: 350 };
// Siedlung (Südwesten): Weg SA aus dem Lager, Fläche SB mit Platz, Steinbruch und Eissee
const SA = { x0: -312, x1: -160, y0: 150, y1: 352 };
const SB = { x0: -1150, x1: -160, y0: 350, y1: 900 };
const LAKE_X = -760;                       // Zaun zwischen Siedlung und Eissee
const LAKE_GATE = { x: LAKE_X, y: 620 };
const BRAZ = { x: -380, y: 680, r: 20 };   // Feuerstelle der Siedlung
const SMOKE = { x: -480, y: 420, r: 36 };  // Räucherei
const FISH_IN = { x: -540, y: 510 }, SMOKE_OUT = { x: -420, y: 510 };
const STALL = { x: -250, y: 600, zx: -250, zy: 560 };
const CASH2 = { x: -345, y: 575 };
const STORE = { x: -500, y: 660, r: 34 };
const HUTS = [{ x: -520, y: 805 }, { x: -430, y: 825 }, { x: -340, y: 805 }];
const homes = () => HUTS.slice(0, S.lv.huts >= 2 ? 3 : 2);
// Kapitel 3: Wolfspass nördlich des Eisfelds, oben die Höhle des Rudelführers
const PASS = { x0: -430, x1: 130, y0: -1700, y1: -1000 };
const DEN_Y = -1420;                        // Zaun zwischen Pass und Höhle
const PASS_GX = -150;                       // Mitte der Tore (Pass- und Höhlentor)
const WATCH = [{ x: -62, y: -222, r: 20 }, { x: 62, y: -222, r: 20 }]; // Wachtürme am Nordtor des Lagers
const AMMO = { x: 118, y: -222, zx: 118, zy: -222, r: 18 };            // Munitionslager
const YFIRE = { x: -330, y: -1090, r: 16 };                            // Ylvas Lagerfeuer im Pass
const NGATE = { x0: -45, x1: 45, y: -260 };                            // Lücke im Nordzaun (Palisade)
const BOSS_HOME = { x: PASS_GX, y: -1570 };
// Weitere Gebiete späterer Kapitel (werden in kit.js / chN.js eingetragen)
const XZONES = [];

function hexV(i) { const a = i * Math.PI / 3; return [HR * Math.cos(a), HR * Math.sin(a)]; }
function inHexPt(x, y, R = HR) { const ax = Math.abs(x), ay = Math.abs(y); return ay <= R * 0.866 && 1.732 * ax + ay <= 1.732 * R; }
function inRect(x, y, r) { return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; }
function inRegion(x, y) {
  if (inHexPt(x, y, HR - 4)) return true;
  if (inRect(x, y, FIELD)) return true;
  if (y >= -178 && y <= -82 && ((x >= 185 && x <= 320) || (x <= -185 && x >= -320))) return true;
  if (inRect(x, y, FOREST)) return true;
  if (inRect(x, y, MINE)) return true;
  if (inRect(x, y, SA) || inRect(x, y, SB)) return true;
  if (inRect(x, y, PASS)) return true;
  for (const z of XZONES) if (inRect(x, y, z.r)) return true;
  return false;
}
function zoneOf(x, y) {
  if (inHexPt(x, y, HR - 2)) return 'camp';
  if (x < -160 && (y > 350 || (y > 150 && x > -315))) return x < LAKE_X ? 'lake' : 'settle';
  for (const z of XZONES) if (inRect(x, y, z.r)) return z.sub ? z.sub(x, y) : z.id;
  if (y < -1000) return y < DEN_Y ? 'den' : 'pass';
  if (y < -250 && x < 315) return 'field';
  if (x >= 315) return 'forest';
  if (x <= -315) return 'iron';
  if (y > -180 && y < -80 && x > 0) return 'forest';
  if (y > -180 && y < -80 && x < 0) return 'iron';
  return 'camp';
}

// Zaun-Segmente  k: f=Zaun, gF=Waldtor, gI=Minentor, tM=Fleischtheke, tC=Kohletheke
const segs = [];
function seg(x1, y1, x2, y2, k = 'f') { segs.push({ x1, y1, x2, y2, k }); }
function edge(i, cuts) { // cuts: [[t0,t1,kind],...] Teilstücke der Kante
  const [ax, ay] = hexV(i), [bx, by] = hexV((i + 1) % 6);
  for (const [t0, t1, k] of cuts) seg(lerp(ax, bx, t0), lerp(ay, by, t0), lerp(ax, bx, t1), lerp(ay, by, t1), k);
}
edge(0, [[0, 1, 'f']]);
// untere Kante: von (150,260) nach (-150,260)
edge(1, [[0, 10 / 300, 'f'], [10 / 300, 110 / 300, 'tC'], [110 / 300, 190 / 300, 'f'], [190 / 300, 290 / 300, 'tM'], [290 / 300, 1, 'f']]);
edge(2, [[0, .08, 'f'], [.08, .40, 'gS'], [.40, 1, 'f']]); // Siedlungstor
edge(3, [[0, .35, 'f'], [.35, .65, 'gI'], [.65, 1, 'f']]);
edge(4, [[0, .35, 'f'], [.65, 1, 'f']]); // Nordtor offen
edge(5, [[0, .35, 'f'], [.35, .65, 'gF'], [.65, 1, 'f']]);
// Eisfeld
seg(-600, -258, -152, -258); seg(152, -258, 315, -258);
seg(-600, -1000, PASS_GX - 50, -1000); seg(PASS_GX - 50, -1000, PASS_GX + 50, -1000, 'gP'); seg(PASS_GX + 50, -1000, 315, -1000);
seg(-600, -1000, -600, -258);
// Wolfspass und Höhle
// Seitenwände mit Toren zur Erzgrube (links, Kapitel 4) und zur Weißen Weite (rechts, Kapitel 5), oben zum Glutherz (Kapitel 6)
seg(PASS.x0, PASS.y1, PASS.x0, -1150); seg(PASS.x0, -1150, PASS.x0, -1250, 'gO'); seg(PASS.x0, -1250, PASS.x0, PASS.y0);
seg(PASS.x1, PASS.y1, PASS.x1, -1150); seg(PASS.x1, -1150, PASS.x1, -1250, 'gW'); seg(PASS.x1, -1250, PASS.x1, PASS.y0);
seg(PASS.x0, PASS.y0, PASS_GX - 50, PASS.y0); seg(PASS_GX - 50, PASS.y0, PASS_GX + 50, PASS.y0, 'gH'); seg(PASS_GX + 50, PASS.y0, PASS.x1, PASS.y0);
seg(PASS.x0, DEN_Y, PASS_GX - 50, DEN_Y); seg(PASS_GX - 50, DEN_Y, PASS_GX + 50, DEN_Y, 'gD'); seg(PASS_GX + 50, DEN_Y, PASS.x1, DEN_Y);
// Wald
seg(315, -1000, 315, -175); seg(315, -85, 315, 380);
seg(315, -650, 1050, -650); seg(1050, -650, 1050, 380); seg(315, 380, 1050, 380);
seg(199, -175, 315, -175); seg(251, -85, 315, -85);
// Mine
seg(-315, -230, -315, -175); seg(-315, -85, -315, 350);
seg(-1050, -230, -315, -230); seg(-1050, -230, -1050, 350); seg(-1050, 350, -315, 350);
seg(-315, -175, -199, -175); seg(-315, -85, -251, -85);
// Siedlung + Eissee
seg(-312, 150, -213.4, 150); seg(-160, 242.5, -160, 900);
seg(-1150, 350, -1050, 350); seg(-1150, 350, -1150, 900); seg(-1150, 900, -160, 900);
seg(LAKE_X, 350, LAKE_X, 560); seg(LAKE_X, 560, LAKE_X, 680, 'gE'); seg(LAKE_X, 680, LAKE_X, 900);

const GATES = { gF: 'forest', gI: 'mine', gS: 'settle', gE: 'lake', gP: 'pass', gD: 'den', gO: 'ore', gW: 'weite', gH: 'heart' };
function segActive(s) {
  const g = GATES[s.k];
  return g ? !S.own[g] : true;
}
// Zaunpfähle
const posts = [];
for (const s of segs) {
  if (GATES[s.k] || s.k === 'tM') continue;
  const L = dist(s.x1, s.y1, s.x2, s.y2), n = Math.max(1, Math.round(L / 17));
  for (let i = 0; i <= n; i++) posts.push({ x: lerp(s.x1, s.x2, i / n), y: lerp(s.y1, s.y2, i / n), s, h: rand(22, 27) });
}

// Deko: Bäume außerhalb der Zonen, Schneehügel
const decoTrees = [], mounds = [];
for (let i = 0; i < 900 && decoTrees.length < 300; i++) {
  const x = rand(-1700, 1800), y = rand(-2900, 950);
  if (y < -980 && x > -1300 && x < 1550) continue; // Pass, Erzgrube, Weite, Glutherz
  if (inRegion(x, y) || inHexPt(x, y, HR + 90)) continue;
  if (y > 220 && Math.abs(x) < 420) continue; // Weg der Überlebenden
  if (x > 280 && x < 1100 && y > -700 && y < 420) continue;
  if (x < -280 && x > -1100 && y > -280 && y < 400) continue;
  if (y < -230 && y > -1050 && x > -650 && x < 340) continue;
  if (x < -100 && x > -1220 && y > 280 && y < 970) continue; // Siedlung
  decoTrees.push({ x, y, s: rand(.9, 1.4) });
}
for (let i = 0; i < 70; i++) mounds.push({ x: rand(-1300, 1300), y: rand(-1300, 900), r: rand(20, 70) });
