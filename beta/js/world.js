'use strict';
// Glutfrost – Welt-Layout: Gebiete, Zäune, Tore, Deko
// =====================================================================
//  WELT-LAYOUT
// =====================================================================
const HR = 380, HH = HR * Math.sqrt(3) / 2;
const GATE_Y = -HH / 2;                    // Höhe der Seitentore (Wald, Mine)
const FURN = { x: 0, y: -20, r: 46 };
const GRILL_IN = { x: -95, y: -25 }, GRILL_OUT = { x: -95, y: 65 };
const KILN = { x: 100, y: -112, r: 30 };
const KILN_IN = { x: 95, y: -25 }, KILN_OUT = { x: 95, y: 65 };
const MEAT_CT = { x: -110, y: 331, zx: -110, zy: 291 };
const COAL_CT = { x: 110, y: 331, zx: 110, zy: 291 };
const CASH = { x: 0, y: 270 };
const TOWER = { x: -150, y: -245, r: 22 };
const CONV = [[-150, -225], [-150, -84], [-100, -42]];
const FIELD = { x0: -600, x1: 395, y0: -1000, y1: -325 };
const FOREST = { x0: 395, x1: 1050, y0: -650, y1: 380 };
const MINE = { x0: -1050, x1: -395, y0: -230, y1: 350 };
// Siedlung (Südwesten): Weg SA aus dem Lager, Fläche SB mit Platz, Steinbruch und Eissee
const SA = { x0: -392, x1: -160, y0: 190, y1: 352 };
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
const WATCH = [{ x: -82, y: -292, r: 20 }, { x: 82, y: -292, r: 20 }]; // genug Abstand zum Armbrustturm, damit man dazwischen durchkommt // Wachtürme am Nordtor des Lagers
const AMMO = { x: 165, y: -288, zx: 165, zy: -288, r: 18 };            // Munitionslager
const YFIRE = { x: -330, y: -1090, r: 16 };                            // Ylvas Lagerfeuer im Pass
const NGATE = { x0: -57, x1: 57, y: -329 };                            // Lücke im Nordzaun (Palisade)
const BOSS_HOME = { x: PASS_GX, y: -1570 };
// Weitere Gebiete späterer Kapitel (werden in kit.js / chN.js eingetragen)
const XZONES = [];

function hexV(i) { const a = i * Math.PI / 3; return [HR * Math.cos(a), HR * Math.sin(a)]; }
function inHexPt(x, y, R = HR) { const ax = Math.abs(x), ay = Math.abs(y); return ay <= R * 0.866 && 1.732 * ax + ay <= 1.732 * R; }
function inRect(x, y, r) { return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; }
function inRegion(x, y) {
  if (inHexPt(x, y, HR - 4)) return true;
  if (inRect(x, y, FIELD)) return true;
  if (y >= -215 && y <= -114 && ((x >= 240 && x <= 400) || (x <= -240 && x >= -400))) return true;
  if (inRect(x, y, FOREST)) return true;
  if (inRect(x, y, MINE)) return true;
  if (inRect(x, y, SA) || inRect(x, y, SB)) return true;
  if (inRect(x, y, PASS)) return true;
  for (const z of XZONES) if (inRect(x, y, z.r)) return true;
  return false;
}
function zoneOf(x, y) {
  if (inHexPt(x, y, HR - 2)) return 'camp';
  if (x < -160 && (y > 350 || (y > 190 && x > -395))) return x < LAKE_X ? 'lake' : 'settle';
  for (const z of XZONES) if (inRect(x, y, z.r)) return z.sub ? z.sub(x, y) : z.id;
  if (y < -1000) return y < DEN_Y ? 'den' : 'pass';
  if (y < -320 && x < 395) return 'field';
  if (x >= 395) return 'forest';
  if (x <= -395) return 'iron';
  if (y > -217 && y < -112 && x > 0) return 'forest';
  if (y > -217 && y < -112 && x < 0) return 'iron';
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
// untere Kante: von (190,329) nach (-190,329), Theken bei x = ±110
edge(1, [[0, 30 / 380, 'f'], [30 / 380, 130 / 380, 'tC'], [130 / 380, 250 / 380, 'f'], [250 / 380, 350 / 380, 'tM'], [350 / 380, 1, 'f']]);
edge(2, [[0, .08, 'f'], [.08, .40, 'gS'], [.40, 1, 'f']]); // Siedlungstor
edge(3, [[0, .35, 'f'], [.35, .65, 'gI'], [.65, 1, 'f']]);
edge(4, [[0, .35, 'f'], [.65, 1, 'f']]); // Nordtor offen
edge(5, [[0, .35, 'f'], [.35, .65, 'gF'], [.65, 1, 'f']]);
// Eisfeld
seg(-600, -327, -192, -327); seg(192, -327, 395, -327);
seg(-600, -1000, PASS_GX - 50, -1000); seg(PASS_GX - 50, -1000, PASS_GX + 50, -1000, 'gP'); seg(PASS_GX + 50, -1000, 395, -1000);
seg(-600, -1000, -600, -327);
// Wolfspass und Höhle
// Seitenwände mit Toren zur Erzgrube (links, Kapitel 4) und zur Weißen Weite (rechts, Kapitel 5), oben zum Glutherz (Kapitel 6)
seg(PASS.x0, PASS.y1, PASS.x0, -1150); seg(PASS.x0, -1150, PASS.x0, -1250, 'gO'); seg(PASS.x0, -1250, PASS.x0, PASS.y0);
seg(PASS.x1, PASS.y1, PASS.x1, -1150); seg(PASS.x1, -1150, PASS.x1, -1250, 'gW'); seg(PASS.x1, -1250, PASS.x1, PASS.y0);
seg(PASS.x0, PASS.y0, PASS_GX - 50, PASS.y0); seg(PASS_GX - 50, PASS.y0, PASS_GX + 50, PASS.y0, 'gH'); seg(PASS_GX + 50, PASS.y0, PASS.x1, PASS.y0);
seg(PASS.x0, DEN_Y, PASS_GX - 50, DEN_Y); seg(PASS_GX - 50, DEN_Y, PASS_GX + 50, DEN_Y, 'gD'); seg(PASS_GX + 50, DEN_Y, PASS.x1, DEN_Y);
// Wald
seg(395, -1000, 395, -212); seg(395, -117, 395, 380);
seg(395, -650, 1050, -650); seg(1050, -650, 1050, 380); seg(395, 380, 1050, 380);
seg(258, -212, 395, -212); seg(312, -117, 395, -117);
// Mine
seg(-395, -230, -395, -212); seg(-395, -117, -395, 350);
seg(-1050, -230, -395, -230); seg(-1050, -230, -1050, 350); seg(-1050, 350, -395, 350);
seg(-395, -212, -258, -212); seg(-395, -117, -312, -117);
// Siedlung + Eissee
seg(-395, 190, -270, 190); seg(-160, 329, -160, 900);
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
  if (x > 360 && x < 1100 && y > -700 && y < 420) continue;
  if (x < -360 && x > -1100 && y > -280 && y < 400) continue;
  if (y < -300 && y > -1050 && x > -650 && x < 420) continue;
  if (x < -100 && x > -1220 && y > 280 && y < 970) continue; // Siedlung
  decoTrees.push({ x, y, s: rand(.9, 1.4) });
}
for (let i = 0; i < 70; i++) mounds.push({ x: rand(-1300, 1300), y: rand(-1300, 900), r: rand(20, 70) });
