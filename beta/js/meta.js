'use strict';
// Glutfrost – Langzeitmotivation: Statistik, Erfolge, Sammelbuch, Tagebuch
// =====================================================================
//  EREIGNISSE & STATISTIK
// =====================================================================
// emit() ist die eine Stelle, an der das Spiel meldet, was passiert ist.
// own = vom Spieler selbst (nicht von Helfern oder dem Turm).
function emit(k, n = 1, own = true) {
  S.st[k] = (S.st[k] || 0) + n;
  if (own) questEvent(k, n);
}
const stv = k => S.st[k] || 0;
const STATS = [
  ['Spielzeit', () => fmtTime(S.time)],
  ['Gelaufen', () => (stv('walk') / 1000).toFixed(1).replace('.', ',') + ' km'],
  ['Eisbären erlegt', () => stv('bear')],
  ['Große Eisbären', () => stv('bigbear')],
  ['Yetis besiegt', () => S.yetiKills],
  ['Bäume gefällt', () => stv('tree')],
  ['Eisenerz abgebaut', () => stv('iron')],
  ['Steine gebrochen', () => stv('stone')],
  ['Feuerkristalle', () => stv('crystal')],
  ['Fische gefangen', () => stv('fish')],
  ['Kunden bedient', () => stv('served')],
  ['Fleisch verkauft', () => stv('meatSold')],
  ['Kohle verkauft', () => stv('coalSold')],
  ['Räucherfisch verkauft', () => stv('fishSold')],
  ['Umsatz', () => fmtNum(stv('earned')) + ' $'],
  ['Bau-Felder gekauft', () => stv('built')],
  ['Aufträge erfüllt', () => S.qDone],
  ['Schneestürme überstanden', () => stv('bliz')],
  ['Erfroren', () => stv('deaths')],
];
function fmtTime(t) { const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60); return h ? h + ' h ' + m + ' min' : m + ' min'; }
function fmtNum(n) { return Math.round(n).toLocaleString('de-DE'); }

// =====================================================================
//  ERFOLGE
// =====================================================================
// r: Belohnung (cash, iron, crystal, sparks = Glutfunken)
const ACH = [
  { id: 'bear1', n: 'Erste Beute', d: 'Erlege einen Eisbären.', ok: () => stv('bear') >= 1, r: { cash: 5 } },
  { id: 'bear50', n: 'Jäger', d: 'Erlege 50 Eisbären.', ok: () => stv('bear') >= 50, r: { cash: 100 } },
  { id: 'bear250', n: 'Bärenschreck', d: 'Erlege 250 Eisbären.', ok: () => stv('bear') >= 250, r: { cash: 300, sparks: 1 } },
  { id: 'big1', n: 'Großwild', d: 'Besiege einen Großen Eisbären.', ok: () => stv('bigbear') >= 1, r: { cash: 15 } },
  { id: 'yeti1', n: 'Yeti-Jäger', d: 'Besiege den Yeti.', ok: () => S.yetiKills >= 1, r: { cash: 100 } },
  { id: 'yeti5', n: 'Yeti-Bezwinger', d: 'Besiege den Yeti fünfmal.', ok: () => S.yetiKills >= 5, r: { cash: 500, sparks: 2 } },
  { id: 'tree100', n: 'Holzfäller', d: 'Fälle 100 Bäume.', ok: () => stv('tree') >= 100, r: { cash: 150 } },
  { id: 'iron50', n: 'Erzsucher', d: 'Baue 50 Eisenerz ab.', ok: () => stv('iron') >= 50, r: { iron: 8 } },
  { id: 'stone100', n: 'Steinmetz', d: 'Brich 100 Steine.', ok: () => stv('stone') >= 100, r: { cash: 200 } },
  { id: 'fish1', n: 'Erster Fang', d: 'Fang einen Fisch.', ok: () => stv('fish') >= 1, r: { cash: 20 } },
  { id: 'fish200', n: 'Meisterangler', d: 'Fang 200 Fische.', ok: () => stv('fish') >= 200, r: { cash: 400 } },
  { id: 'cry1', n: 'Feuerfunken', d: 'Schlag einen Feuerkristall.', ok: () => stv('crystal') >= 1, r: { crystal: 1 } },
  { id: 'cry100', n: 'Kristallsammler', d: 'Sammle 100 Feuerkristalle.', ok: () => stv('crystal') >= 100, r: { crystal: 3, sparks: 1 } },
  { id: 'serve100', n: 'Händler', d: 'Bediene 100 Kunden.', ok: () => stv('served') >= 100, r: { cash: 150 } },
  { id: 'serve1000', n: 'Kaufmann', d: 'Bediene 1.000 Kunden.', ok: () => stv('served') >= 1000, r: { cash: 800, sparks: 1 } },
  { id: 'earn10k', n: 'Die ersten Zehntausend', d: 'Mach 10.000 $ Umsatz.', ok: () => stv('earned') >= 10000, r: { cash: 250 } },
  { id: 'built25', n: 'Baumeister', d: 'Kaufe 25 Bau-Felder.', ok: () => stv('built') >= 25, r: { cash: 250 } },
  { id: 'helpers', n: 'Volle Mannschaft', d: 'Heuere alle Helfer an.', ok: () => S.lv.hunter >= 2 && S.own.server && S.own.lumber && S.own.fisher && S.own.seller, r: { cash: 500 } },
  { id: 'furn3', n: 'Wärmequelle', d: 'Bring den Ofen auf Stufe 3.', ok: () => S.lv.furnace >= 3, r: { cash: 60 } },
  { id: 'furn5', n: 'Lagerretter', d: 'Bring den Ofen auf Stufe 5.', ok: () => S.lv.furnace >= 5, r: { sparks: 1 } },
  { id: 'furn8', n: 'Glutfrost-Legende', d: 'Bring den Ofen auf Stufe 8.', ok: () => S.lv.furnace >= 8, r: { sparks: 3 } },
  { id: 'quest10', n: 'Hilfsbereit', d: 'Erfülle 10 Aufträge.', ok: () => S.qDone >= 10, r: { cash: 250 } },
  { id: 'quest30', n: 'Rechte Hand', d: 'Erfülle 30 Aufträge.', ok: () => S.qDone >= 30, r: { sparks: 2 } },
  { id: 'page1', n: 'Sammler', d: 'Fülle eine Seite im Sammelbuch.', ok: () => BOOK.some(pg => pageDone(pg.id)), r: { cash: 150 } },
  { id: 'bliz5', n: 'Sturmerprobt', d: 'Übersteh 5 Schneestürme.', ok: () => stv('bliz') >= 5, r: { cash: 150 } },
  { id: 'walk10', n: 'Wanderer', d: 'Lauf 10 Kilometer.', ok: () => stv('walk') >= 10000, r: { cash: 150 } },
  { id: 'cold', n: 'Kalte Füße', d: 'Erfriere ein einziges Mal.', ok: () => stv('deaths') >= 1, r: { cash: 10 } },
];
const RSYM = { cash: ' $', iron: ' ⛓', crystal: ' 🔶', sparks: ' ✨' };
const rewardTxt = r => Object.keys(r).map(k => '+' + r[k] + RSYM[k]).join('  ');
function giveReward(r) { for (const k in r) { if (k === 'sparks') S.sparks += r[k]; else S[k] += r[k]; } }
let achT = 0;
function checkAch(dt) {
  achT -= dt; if (achT > 0) return; achT = 1;
  for (const a of ACH) {
    if (S.ach[a.id] || !a.ok()) continue;
    S.ach[a.id] = Math.round(S.time); giveReward(a.r); S.diaryNew = 1;
    toast('🏆 ' + a.n, rewardTxt(a.r)); snd('buy');
  }
}

// =====================================================================
//  SAMMELBUCH
// =====================================================================
const FISH_SP = [
  { id: 'barsch', n: 'Eisbarsch', ic: '🐟', p: .62, d: 'Der häufigste Fisch im Eissee. Zäh, aber nahrhaft.' },
  { id: 'forelle', n: 'Silberforelle', ic: '🐟', p: .22, d: 'Glänzt im Eisloch wie eine Münze.' },
  { id: 'aal', n: 'Frostaal', ic: '🐍', p: .10, d: 'Windet sich durch das kälteste Wasser. Glatt wie Eis.' },
  { id: 'karpfen', n: 'Glutkarpfen', ic: '🐠', p: .045, d: 'Seine Schuppen sind warm. Ole schwört, er leuchtet nachts.' },
  { id: 'hecht', n: 'Kristallhecht', ic: '💎', p: .015, d: 'Fast durchsichtig. Kaum jemand hat je einen gefangen.' },
];
const FINDS = [
  { id: 'zahn', n: 'Bärenzahn', ic: '🦷', src: 'bear', p: .04, d: 'Riesig. Bjarne will daraus einen Glücksbringer schnitzen.' },
  { id: 'feder', n: 'Rabenfeder', ic: '🪶', src: 'treeF', p: .04, d: 'Die Raben fliegen alle nach Norden. Wissen sie etwas?' },
  { id: 'muenze', n: 'Alte Münze', ic: '🪙', src: 'rock', p: .05, d: 'Geprägt mit einer Flamme – aus einer Zeit, als es noch Sommer gab.' },
  { id: 'eisblume', n: 'Eisblume', ic: '❄️', src: 'stone', p: .05, d: 'Sie schmilzt nicht. Nicht einmal direkt am Ofen.' },
  { id: 'pferd', n: 'Holzpferdchen', ic: '🐴', src: 'treeS', p: .05, d: 'Ein Kinderspielzeug. Hier haben einmal Familien gelebt.' },
  { id: 'kompass', n: 'Gefrorener Kompass', ic: '🧭', src: 'fish', p: .04, d: 'Die Nadel zittert – und zeigt stur nach Norden.' },
  { id: 'splitter', n: 'Glutsplitter', ic: '🔥', src: 'crystal', p: .12, d: 'Warm wie eine Hand. Mara sagt: ein Stück vom Glutherz.' },
  { id: 'blatt', n: 'Tagebuchblatt', ic: '📜', src: 'yeti', p: .6, d: '»… hinter dem Pass, wo die Wölfe heulen, beginnt der Weg zum Glutherz …«' },
];
const EXTRA_FINDS = []; // Fundstücke späterer Kapitel (stehen auf deren eigener Sammelbuch-Seite)
const allFinds = () => FINDS.concat(EXTRA_FINDS);
const BOOK = [
  { id: 'animals', n: 'Tiere der Ebene', bonus: '+5 % Fleischpreis', e: [
    { id: 'bear', n: 'Eisbär', ic: '🐻‍❄️', d: 'Streift durch das Eisfeld im Norden. Liefert Fleisch.' },
    { id: 'bigbear', n: 'Großer Eisbär', ic: '🐻', d: 'Doppelt so stark – und er wehrt sich.' },
    { id: 'yeti', n: 'Yeti', ic: '👹', d: 'Herrscher des Waldes. Kehrt nach jeder Niederlage stärker zurück.' },
  ] },
  { id: 'fish', n: 'Fische des Eissees', bonus: '+5 % Fischpreis', e: FISH_SP },
  { id: 'finds', n: 'Fundstücke', bonus: '+5 % Laufgeschwindigkeit', e: FINDS },
];
const has = id => !!S.book[id];
function pageDone(pid) { const pg = BOOK.find(p => p.id === pid); return pg.e.every(e => has(e.id)); }
// Bonus einer kompletten Seite als Multiplikator (Seitenstatus ändert sich selten -> kurz zwischenspeichern)
const bookCache = {};
function bookMul(pid) {
  const c = bookCache[pid];
  if (c && c.t === S.time) return c.v;
  const v = pageDone(pid) ? 1.05 : 1; bookCache[pid] = { t: S.time, v }; return v;
}
function discover(id) {
  if (has(id)) return false;
  S.book[id] = 1; S.diaryNew = 1;
  for (const pg of BOOK) { const e = pg.e.find(x => x.id === id); if (!e) continue;
    toast('📖 Neu im Sammelbuch', e.ic + ' ' + e.n);
    if (pageDone(pg.id)) setTimeout(() => toast('📖 Seite komplett: ' + pg.n, pg.bonus), 1600);
  }
  return true;
}
// Fundstücke: seltene, einmalige Drops bei bestimmten Tätigkeiten
function rollFind(src, x, y) {
  for (const f of allFinds()) {
    if (f.src !== src || has(f.id) || drops.some(d => d.fid === f.id)) continue;
    if (Math.random() < f.p) { drops.push({ type: 'find', fid: f.id, v: 1, x, y, z: 18, vx: rand(-80, 80), vy: rand(-80, 80), vz: 260, age: 0 }); return; }
  }
}
function pickFind(d) { const f = allFinds().find(x => x.id === d.fid); if (discover(d.fid)) { snd('gem'); ftext(player.x, player.y, 70, f.ic + ' ' + f.n, '#ffe27a', 17); } }
function catchFish() { // Art eines gefangenen Fisches auswürfeln
  let r = Math.random(), sp = FISH_SP[0];
  for (const f of FISH_SP) { if (r < f.p) { sp = f; break; } r -= f.p; }
  if (discover(sp.id) || sp.id !== 'barsch') ftext(player.x, player.y, 85, sp.ic + ' ' + sp.n + '!', '#bfe6ff', 16);
  if (sp.id !== 'barsch') emit('rare');
}

// =====================================================================
//  TOASTS (kleine Meldungen oben)
// =====================================================================
const toasts = [];
function toast(a, b) { toasts.push({ a, b, t: 0 }); }
function drawToasts(top) {
  if (!toasts.length) return;
  const q = toasts[0]; q.t += 1 / 60;
  if (q.t > 3.2) { toasts.shift(); return; }
  const a = clamp(Math.min(q.t * 4, (3.2 - q.t) * 3), 0, 1), y = top + 146 - (1 - a) * 20;
  ctx.globalAlpha = a;
  ctx.font = '800 15px system-ui,sans-serif'; const w1 = ctx.measureText(q.a).width;
  ctx.font = '700 13px system-ui,sans-serif'; const w2 = ctx.measureText(q.b).width;
  const w = Math.max(w1, w2) + 36;
  rr(W / 2 - w / 2, y, w, 50, 16, 'rgba(255,248,225,.96)');
  rr(W / 2 - w / 2, y, 6, 50, 3, '#ffb12b');
  txt(q.a, W / 2, y + 17, 15, '#4a3410', 'center', null);
  txt(q.b, W / 2, y + 35, 13, '#7a5a1c', 'center', null, 700);
  ctx.globalAlpha = 1;
}

// =====================================================================
//  TAGEBUCH
// =====================================================================
let diaryTab = 'goals';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function openDiary(tab) {
  if (tab) diaryTab = tab;
  S.diaryNew = 0; updateDiaryDot();
  renderDiary(); show('diary', true);
}
function updateDiaryDot() { $('diaryDot').classList.toggle('hidden', !S.diaryNew); }
function renderDiary() {
  for (const b of document.querySelectorAll('#diaryTabs button')) b.classList.toggle('on', b.dataset.tab === diaryTab);
  const el = $('diaryBody');
  if (diaryTab === 'goals') el.innerHTML = goalsHTML();
  else if (diaryTab === 'ach') el.innerHTML = achHTML();
  else if (diaryTab === 'book') el.innerHTML = bookHTML();
  else el.innerHTML = statsHTML();
  const c = el.querySelector('canvas.route'); if (c) drawRoute(c, S.ch);
  el.scrollTop = 0;
}
function goalsHTML() {
  const c = curChapter();
  let h = `<div class="kick">Kapitel ${c.n}${c.soon ? ' · bald verfügbar' : ''}</div><h3>${esc(c.title)}</h3><canvas class="route"></canvas><ul class="checks">`;
  for (const g of c.goals) h += `<li class="${g.ok() ? 'done' : ''}">${g.ok() ? '✔' : '○'} ${esc(g.t)}</li>`;
  h += '</ul><h4>Aufträge</h4>';
  if (!S.quests.length) h += '<p class="mut">Keine offenen Aufträge. Geh zu einer Figur mit einem <b>!</b> über dem Kopf.</p>';
  for (const q of S.quests) {
    const tp = questTpl(q), f = FIG[q.fig];
    h += `<div class="qrow"><div><b>${esc(f.name)}:</b> ${esc(tp.t(q.n))}</div><div class="qbar"><i style="width:${Math.min(100, q.got / q.n * 100)}%"></i></div><div class="mut">${q.got}/${q.n} · Belohnung ${esc(rewardTxt(q.r))}</div></div>`;
  }
  const offers = Object.keys(S.offers).filter(k => S.offers[k] && FIG[k].vis());
  if (offers.length) h += `<p class="mut">Neue Aufträge warten bei: ${offers.map(k => esc(FIG[k].name)).join(', ')}.</p>`;
  return h;
}
function achHTML() {
  const n = ACH.filter(a => S.ach[a.id]).length;
  let h = `<div class="sum">🏆 ${n} / ${ACH.length} Erfolge · ✨ ${S.sparks} Glutfunken</div><p class="mut">Glutfunken brauchst du später für „Neues Feuer“.</p>`;
  for (const a of ACH) {
    const ok = S.ach[a.id];
    h += `<div class="ach ${ok ? 'done' : ''}"><span class="ic">${ok ? '🏆' : '🔒'}</span><div><b>${esc(a.n)}</b><div class="mut">${esc(a.d)}</div></div><span class="rw">${esc(rewardTxt(a.r))}</span></div>`;
  }
  return h;
}
function bookHTML() {
  let h = '';
  for (const pg of BOOK) {
    const n = pg.e.filter(e => has(e.id)).length, done = n === pg.e.length;
    h += `<h4>${esc(pg.n)} <span class="mut">${n}/${pg.e.length}</span></h4><p class="bonus ${done ? 'on' : ''}">Seite komplett: ${esc(pg.bonus)} ${done ? '✔ aktiv' : ''}</p><div class="grid">`;
    for (const e of pg.e) h += has(e.id)
      ? `<div class="ent"><span class="ic">${e.ic}</span><b>${esc(e.n)}</b><span class="mut">${esc(e.d)}</span></div>`
      : `<div class="ent unk"><span class="ic">❔</span><b>???</b><span class="mut">Noch nicht entdeckt</span></div>`;
    h += '</div>';
  }
  return h;
}
function statsHTML() {
  return '<table class="stats">' + STATS.map(([k, f]) => `<tr><td>${esc(k)}</td><td>${esc(f())}</td></tr>`).join('') + '</table>';
}

// Tagebuch-Knopf und Reiter
$('diaryBtn').onclick = () => openDiary();
$('bDiaryClose').onclick = () => show('diary', false);
for (const b of document.querySelectorAll('#diaryTabs button')) b.onclick = () => { diaryTab = b.dataset.tab; renderDiary(); };
setInterval(updateDiaryDot, 500);
