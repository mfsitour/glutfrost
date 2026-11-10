'use strict';
// Glutfrost – nach dem Finale: Frostnächte (Endlosmodus) und „Neues Feuer“ (Prestige mit Glutfunken)
// =====================================================================
//  FROSTNÄCHTE
// =====================================================================
CHAPTERS[6] = {
  n: 7, title: 'Frostnächte', endless: true,
  text: 'Das Glutherz brennt, der Schnee schmilzt rund ums Lager. Doch der Frost gibt nicht kampflos auf: Nacht für Nacht schickt er seine Wölfe – jedes Mal stärker.',
  say: 'Wir haben es geschafft, Kind. Halte das Feuer am Leben, so lange du kannst. Und wenn du müde wirst: Jedes Ende ist ein neues Feuer.',
  goals: [
    { get t() { return 'Rekord: Frostnacht ' + (S.bestNight || 0) + ' abgewehrt'; }, ok: () => false },
    { get t() { return 'Ofen weiter ausbauen (Stufe ' + S.lv.furnace + ')'; }, ok: () => false },
  ],
};
// Nach dem Finale werden die Wellen größer und die Wölfe zäher
KIT.update.push(dt => {
  if (!S.finale || !nightRun || nightRun.frost) return;
  const n = S.nightNo - (S.finaleNight || 0);
  nightRun.frost = true; nightRun.left = Math.min(30, 10 + 2 * n);
  KIT.frostNo = n;
  banner = { t: 4, a: '❄️ Frostnacht ' + n, b: 'Wehre sie ab – jede abgewehrte Frostnacht bringt einen Glutfunken ✨' };
});
KIT.update.push(dt => {
  if (!S.finale) return;
  if (nightRun && nightRun.frost) KIT.frostRun = nightRun;
  else if (KIT.frostRun && !nightRun) {
    if (!KIT.frostRun.stolen) { S.sparks++; S.bestNight = Math.max(S.bestNight || 0, KIT.frostNo || 0); toast('✨ Frostnacht ' + KIT.frostNo + ' abgewehrt', '+1 Glutfunke'); }
    KIT.frostRun = null; save();
  }
});
// Wölfe der Frostnächte: mehr Leben je Nacht
const _wolfHp = wolfHp;
wolfHp = () => S.finale ? 26 + 6 * Math.max(0, S.nightNo - (S.finaleNight || 0)) : _wolfHp();

// =====================================================================
//  GLUT-SHOP (dauerhafte Boni, bezahlt mit Glutfunken)
// =====================================================================
const GLUT_UP = [
  { id: 'cash', n: 'Glutreserve', d: '+10 % auf alle Verkäufe', cost: [2, 4, 7, 11, 16] },
  { id: 'speed', n: 'Leichtfüßig', d: '+8 % Laufgeschwindigkeit', cost: [2, 5, 9] },
  { id: 'cook', n: 'Heißer Ofen', d: '+15 % schneller braten und verarbeiten', cost: [2, 5, 9] },
  { id: 'cap', n: 'Großer Rucksack', d: '+5 Tragkraft', cost: [1, 3, 6] },
  { id: 'help', n: 'Treue Helfer', d: 'Helfer kosten 20 % weniger', cost: [3, 8] },
  { id: 'start', n: 'Startkapital', d: 'Nach „Neues Feuer“ mit 300 / 1.500 / 5.000 $ beginnen', cost: [1, 3, 6] },
];
function glutLv(k) { return (S.glut && S.glut[k]) || 0; }
function buyGlut(id) {
  const u = GLUT_UP.find(x => x.id === id), lv = glutLv(id), c = u.cost[lv];
  if (c == null || S.sparks < c) return;
  S.sparks -= c; S.glut[id] = lv + 1; snd('buy'); toast('✨ ' + u.n, 'Stufe ' + (lv + 1)); save(); renderDiary();
}
// Glutfunken für ein Neues Feuer
function ngGain() {
  if (!S.finale) return 0;
  return 10 + 2 * Math.max(0, S.lv.furnace - 15) + Math.floor((S.bestNight || 0) / 2);
}
function newFire() {
  const keep = { sparks: S.sparks + ngGain(), glut: S.glut, ach: S.ach, book: S.book, st: S.st, qDone: S.qDone, music: S.music, muted: S.muted, helpSeen: 1, ng: (S.ng || 0) + 1, bestNight: S.bestNight, hero: S.hero, look: S.look };
  const d = DEF(); Object.assign(d, keep);
  d.cash = [0, 300, 1500, 5000][glutLv('start')];
  resetting = true; localStorage.setItem(KEY, JSON.stringify(d)); location.reload();
}
function glutHTML() {
  let h = `<div class="sum">✨ ${S.sparks} Glutfunken</div><p class="mut">Glutfunken gibt es für schwere Erfolge, für jede abgewehrte Frostnacht und für ein Neues Feuer. Die Boni bleiben für immer.</p>`;
  for (const u of GLUT_UP) {
    const lv = glutLv(u.id), c = u.cost[lv];
    h += `<div class="ach done" style="opacity:1"><span class="ic">✨</span><div><b>${esc(u.n)}</b> <span class="mut">Stufe ${lv}/${u.cost.length}</span><div class="mut">${esc(u.d)}</div></div>
      <span>${c == null ? '<span class="rw">max.</span>' : `<button class="gbtn" data-glut="${u.id}" ${S.sparks < c ? 'disabled' : ''}>${c} ✨</button>`}</span></div>`;
  }
  h += '<h4>Neues Feuer</h4>';
  if (!S.finale) h += '<p class="mut">Entfache zuerst das Glutherz. Danach kannst du jederzeit ein Neues Feuer entzünden: Du beginnst von vorn – mit allen Glut-Boni, Erfolgen und dem Sammelbuch.</p>';
  else h += `<p class="mut">Du beginnst wieder bei Kapitel 1. Du behältst Glutfunken, Glut-Boni, Erfolge, Sammelbuch und Statistik. Ausrüstung und Gebäude beginnen neu.</p>
    <button class="pri" id="bNewFire">Neues Feuer entzünden (+${ngGain()} ✨)</button>`;
  if (S.ng) h += `<p class="mut">Bisher entzündet: ${S.ng}× Neues Feuer.</p>`;
  return h;
}
$('diaryBody').addEventListener('click', e => {
  const g = e.target.dataset && e.target.dataset.glut;
  if (g) { buyGlut(g); return; }
  if (e.target.id === 'bNewFire') { show('diary', false); $('ngTxt').textContent = 'Du erhältst ' + ngGain() + ' Glutfunken und beginnst wieder bei Kapitel 1.'; show('ngConfirm', true); }
});
$('bNgYes').onclick = () => newFire();
$('bNgNo').onclick = () => show('ngConfirm', false);
// Helfer werden durch „Treue Helfer“ günstiger
const HELPER_PADS = new Set(['hunter', 'server', 'lumber', 'fisher', 'seller', 'armorer', 'miner', 'smith', 'prentice', 'trapper', 'seamstress']);
const _reqOf = reqOf;
reqOf = p => { const r = _reqOf(p); if (r && r.cash && HELPER_PADS.has(p.id) && glutLv('help')) return Object.assign({}, r, { cash: Math.round(r.cash * (1 - .2 * glutLv('help'))) }); return r; };

// Nach dem Finale: weniger Schnee, wärmere Musik
ACH.push(
  { id: 'frost10', n: 'Ewige Wacht', d: 'Wehre Frostnacht 10 ab.', ok: () => (S.bestNight || 0) >= 10, r: { sparks: 3 } },
  { id: 'ng1', n: 'Neues Feuer', d: 'Entzünde ein Neues Feuer.', ok: () => (S.ng || 0) >= 1, r: { sparks: 2 } },
  { id: 'furn20', n: 'Sonnenkern', d: 'Bring den Ofen auf Stufe 20.', ok: () => S.lv.furnace >= 20, r: { sparks: 5 } },
);
STATS.push(['Rekord Frostnacht', () => S.bestNight || 0], ['Neues Feuer entzündet', () => S.ng || 0], ['Glutfunken', () => S.sparks]);
