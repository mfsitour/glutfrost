'use strict';
// Glutfrost – Ausrüstung: 4 Plätze (Waffe, Mantel, Stiefel, Talisman), 4 Seltenheiten.
// Wirkt zusätzlich zu den Upgrades der Bau-Felder. Quellen: Truhen, Bosse, Schmiede.
// =====================================================================
const SLOTS = [
  { id: 'axe', n: 'Waffe', ic: '🪓', stat: 'dmg', lab: 'Schaden', names: ['Holzfälleraxt', 'Eisspalter', 'Wolfsbeil', 'Glutbeil'] },
  { id: 'coat', n: 'Mantel', ic: '🧥', stat: 'cold', lab: 'Kälteschutz', names: ['Pelzmantel', 'Wolfsfellmantel', 'Sturmmantel', 'Glutmantel'] },
  { id: 'boots', n: 'Stiefel', ic: '🥾', stat: 'speed', lab: 'Tempo', names: ['Schneestiefel', 'Wanderstiefel', 'Kufenstiefel', 'Sturmläufer'] },
  { id: 'charm', n: 'Talisman', ic: '🧿', stat: 'cash', lab: 'Verkaufspreis', names: ['Bärenzahn-Amulett', 'Glutstein', 'Rabenfeder-Kette', 'Nordlicht-Talisman'] },
];
const RAR = [
  { n: 'Gewöhnlich', col: '#9aa6b1', v: { dmg: .10, cold: .10, speed: .05, cash: .05 } },
  { n: 'Selten', col: '#3d8fd6', v: { dmg: .22, cold: .20, speed: .10, cash: .10 } },
  { n: 'Episch', col: '#9b5fd6', v: { dmg: .38, cold: .32, speed: .16, cash: .18 } },
  { n: 'Legendär', col: '#f0a020', v: { dmg: .60, cold: .45, speed: .25, cash: .30 } },
];
// Wahrscheinlichkeit der Seltenheit je Quelle (tier 1 = Erzgrube, 2 = Weite, 3 = Glutherz, 4 = Boss, 5 = Endboss)
const TIER_W = { 1: [70, 25, 5, 0], 2: [45, 38, 15, 2], 3: [25, 40, 28, 7], 4: [0, 30, 55, 15], 5: [0, 0, 40, 60], forge: [40, 40, 17, 3] };
function rollRarity(tier) { const w = TIER_W[tier] || TIER_W[1]; let r = rand(0, w.reduce((a, b) => a + b, 0)); for (let i = 0; i < 4; i++) { if (r < w[i]) return i; r -= w[i]; } return 0; }
function makeGear(tier, slotId) {
  const sl = slotId ? SLOTS.find(s => s.id === slotId) : SLOTS[randi(0, 3)], r = rollRarity(tier);
  const jitter = rand(.9, 1.1);
  return { id: Math.random().toString(36).slice(2, 8), slot: sl.id, r, name: sl.names[Math.min(3, r + (Math.random() < .3 ? 1 : 0)) % 4], v: Math.round(RAR[r].v[sl.stat] * jitter * 100) / 100 };
}
const gearName = g => g.name + (g.up ? ' +' + g.up : '');
const gearTitle = g => RAR[g.r].n + ' · ' + gearName(g);
// Bjarne verbessert angelegte Teile mit Eisen: je Stufe +10 % des Grundwerts, höchstens +10
const UP_MAX = 10;
const upCost = g => 15 * ((g.up || 0) + 1) * (g.r + 1);
function upgradeGear(slot) {
  const g = S.gear[slot]; if (!g || (g.up || 0) >= UP_MAX || S.iron < upCost(g)) return;
  S.iron -= upCost(g); if (g.base == null) g.base = g.v;
  g.up = (g.up || 0) + 1; g.v = Math.round(g.base * (1 + .1 * g.up) * 100) / 100;
  snd('buy'); emit('gearUp'); toast('⛓ ' + gearName(g), gearStat(g));
}
const gearStat = g => { const sl = SLOTS.find(s => s.id === g.slot); return (sl.stat === 'cold' ? '−' : '+') + Math.round(g.v * 100) + ' % ' + sl.lab; };
function gearV(stat) { const sl = SLOTS.find(s => s.stat === stat); const g = S.gear[sl.id]; return g ? g.v : 0; }
const gearMul = stat => 1 + gearV(stat);
// Neues Teil: besser als das angelegte? Dann gleich anlegen, sonst ins Gepäck (höchstens 12)
function gainGear(g) {
  const cur = S.gear[g.slot];
  if (!cur || g.v > cur.v) { if (cur) S.inv.push(cur); S.gear[g.slot] = g; }
  else S.inv.push(g);
  while (S.inv.length > 12) { const w = S.inv.reduce((a, b) => (b.v < a.v ? b : a)); S.inv.splice(S.inv.indexOf(w), 1); S.tools += 2 + w.r * 3; }
  S.diaryNew = 1; emit('gear');
  toast('🎁 ' + gearTitle(g), gearStat(g) + (S.gear[g.slot] === g ? ' · angelegt' : ''));
  snd('gem'); save();
}
// Truhen und Bosse lassen ein glitzerndes Paket fallen
function gearDrop(tier, x, y) { drops.push({ type: 'gearbox', tier, v: 1, x, y, z: 18, vx: rand(-60, 60), vy: rand(-60, 60), vz: 260, age: 0 }); }
function pickGearbox(d) { gainGear(makeGear(d.tier)); ftext(player.x, player.y, 70, '🎁', '#ffe27a', 22); }

// =====================================================================
//  TAGEBUCH-REITER „Ausrüstung“
// =====================================================================
function gearHTML() {
  let h = '<h4>Angelegt</h4><div class="grid">';
  for (const sl of SLOTS) {
    const g = S.gear[sl.id];
    h += g ? `<div class="ent" style="border-left:4px solid ${RAR[g.r].col}"><span class="ic">${sl.ic}</span><b>${esc(gearName(g))}</b><span class="mut" style="color:${RAR[g.r].col}">${RAR[g.r].n}</span><span>${esc(gearStat(g))}</span>${(g.up || 0) >= UP_MAX ? '<span class="rw">max.</span>' : `<button class="gbtn" data-up="${sl.id}" ${S.iron < upCost(g) ? 'disabled' : ''}>Verbessern ${upCost(g)} ⛓</button>`}</div>`
      : `<div class="ent unk"><span class="ic">${sl.ic}</span><b>${sl.n}</b><span class="mut">Noch nichts gefunden</span></div>`;
  }
  h += `</div><h4>Gepäck <span class="mut">${S.inv.length}/12</span></h4>`;
  if (!S.inv.length) h += '<p class="mut">Ausrüstung findest du in Truhen, bei Bossen und ab Kapitel 4 in der Schmiede.</p>';
  S.inv.forEach((g, i) => {
    h += `<div class="ach done" style="opacity:1"><span class="ic">${SLOTS.find(s => s.id === g.slot).ic}</span><div><b style="color:${RAR[g.r].col}">${esc(gearName(g))}</b><div class="mut">${RAR[g.r].n} · ${esc(gearStat(g))}</div></div>
      <span><button class="gbtn" data-eq="${i}">Anlegen</button><button class="gbtn" data-sc="${i}">Zerlegen</button></span></div>`;
  });
  h += `<p class="mut">Verbessern kostet Eisen ⛓ (du hast ${S.iron}) und geht bis +${UP_MAX}. Zerlegen gibt Werkzeug 🔨 zurück.</p>`;
  return h;
}
function gearClick(e) {
  const eq = e.target.dataset.eq, sc = e.target.dataset.sc, up = e.target.dataset.up;
  if (up) upgradeGear(up);
  else if (eq != null) { const g = S.inv.splice(+eq, 1)[0], cur = S.gear[g.slot]; if (cur) S.inv.push(cur); S.gear[g.slot] = g; }
  else if (sc != null) { const g = S.inv.splice(+sc, 1)[0]; S.tools += 2 + g.r * 3; toast('🔨 Zerlegt', '+' + (2 + g.r * 3) + ' Werkzeug'); }
  else return;
  save(); renderDiary();
}
$('diaryBody').addEventListener('click', gearClick);
