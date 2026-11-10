'use strict';
// Glutfrost – Kampagne: Kapitel, Figuren, Nebenaufträge
// =====================================================================
//  KAPITEL
// =====================================================================
const ROUTE = ['Lager', 'Siedlung', 'Wolfspass', 'Erzgrube', 'Weiße Weite', 'Glutherz'];
const CHAPTERS = [
  {
    n: 1, title: 'Die letzte Glut',
    text: 'Der Winter nimmt kein Ende. Im Lager brennt der letzte Ofen weit und breit – solange er glüht, gibt es Hoffnung.',
    say: 'Halte das Feuer am Leben, Kind. Bring den Ofen auf Stufe 3, dann reden wir weiter.',
    goals: [
      { t: 'Baue den Armbrustturm', ok: () => S.own.tower },
      { t: 'Öffne den Wald', ok: () => S.own.forest },
      { t: 'Ofen auf Stufe 3 bringen', ok: () => S.lv.furnace >= 3 },
    ],
  },
  {
    n: 2, title: 'Die Siedlung am Eissee',
    text: 'Der Ofen hält das Lager warm. Am Abend erzählt Mara von einer alten Legende: Tief im Norden schläft das Glutherz – eine Wärme, die den ewigen Winter brechen könnte.',
    say: 'Für den Weg nach Norden brauchen wir mehr Hände. Bau die Siedlung im Südwesten aus und öffne den Eissee.',
    goals: [
      { t: 'Erschließe die Siedlung', ok: () => S.own.settle },
      { t: 'Baue die Räucherei', ok: () => S.own.smoke },
      { t: 'Baue den Marktstand', ok: () => S.own.stall },
      { t: 'Öffne den Eissee', ok: () => S.own.lake },
      { t: 'Ofen auf Stufe 5 bringen', ok: () => S.lv.furnace >= 5 },
    ],
  },
  {
    n: 3, title: 'Der Wolfspass',
    text: 'Eine Fremde erreicht das Lager: Ylva, eine Kundschafterin. Der Pass im Norden ist frei – doch seit sie da ist, heulen nachts die Wölfe. Und sie kommen näher.',
    say: 'Ylva kennt den Weg nach Norden. Sichere das Lager für die Nächte und vertreib den Rudelführer vom Pass.',
    goals: [
      { t: 'Öffne den Wolfspass', ok: () => S.own.pass },
      { t: 'Baue die Palisade', ok: () => S.own.wall },
      { t: 'Baue einen Wachturm', ok: () => S.own.watch1 },
      { get t() { return 'Wehre 5 Nachtangriffe ab (' + Math.min(5, S.nightsOk) + '/5)'; }, ok: () => S.nightsOk >= 5 },
      { t: 'Ofen auf Stufe 7 bringen', ok: () => S.lv.furnace >= 7 },
      { t: 'Besiege den Rudelführer', ok: () => S.bossDead },
    ],
  },
  {
    n: 4, title: 'Die Erzgrube', soon: true,
    text: 'Auf der zerrissenen Karte des Rudelführers ist eine alte Erzgrube eingezeichnet. Bjarne ist kaum zu halten: Mit echtem Erz könnte er endlich eine richtige Schmiede bauen.',
    say: 'Bjarne packt schon sein Werkzeug. Bis die Grube erkundet ist: Bring den Ofen auf Stufe 8.',
    goals: [{ t: 'Bonus: Ofen auf Stufe 8', ok: () => S.lv.furnace >= 8 }],
  },
];
const curChapter = () => CHAPTERS[Math.min(S.ch, CHAPTERS.length) - 1];
const chapterDone = c => c.goals.every(g => g.ok());
// Spielstände ohne Kapitel (vor diesem Update): Kapitel aus dem Fortschritt ableiten
if (!S.ch) { let c = 1; while (c < CHAPTERS.length && chapterDone(CHAPTERS[c - 1])) c++; S.ch = c; }

let chCardT = 0; // Verzögerung zwischen Kapitelabschluss und Kapiteltafel
function updateChapter(dt) {
  const c = curChapter();
  if (!c.soon && chapterDone(c) && S.ch < CHAPTERS.length) {
    S.ch++; chCardT = 2.6;
    banner = { t: 3, a: '✔ Kapitel ' + c.n + ' geschafft!', b: c.title };
    snd('buy'); buzz([30, 50, 30, 50, 60]); shake = Math.max(shake, 6);
    burst(player.x, player.y, 40, '#ffd84a', 30, 240, 5);
    save();
  }
  if (chCardT > 0) chCardT -= dt;
}
// Kapiteltafel zeigen, sobald nichts anderes offen ist (läuft auch während Pausen)
function chapterUI() {
  if (S.chSeen >= S.ch || chCardT > 0) return;
  if (['menu', 'help', 'confirm', 'offline', 'diary', 'chapter'].some(k => !$(k).classList.contains('hidden'))) return;
  showChapterCard();
}
function showChapterCard() {
  const c = curChapter();
  $('chKick').textContent = 'Kapitel ' + c.n + (c.soon ? ' · bald verfügbar' : '');
  $('chTitle').textContent = c.title;
  $('chText').textContent = c.text;
  $('chSay').textContent = '„' + c.say + '“';
  show('chapter', true);
  drawRoute($('chRoute'), S.ch);
}
$('bCh').onclick = () => { S.chSeen = S.ch; show('chapter', false); save(); };

// Wegkarte: der Weg vom Lager nach Norden zum Glutherz
function drawRoute(c, ch) {
  const w = c.clientWidth || 300, h = Math.round(w * .55), k = Math.min(2, devicePixelRatio || 1);
  c.width = w * k; c.height = h * k; c.style.height = h + 'px';
  const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#cfe0ee'); bg.addColorStop(1, '#f2f7fb');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // Berge
  g.fillStyle = '#b8cde0';
  for (let i = 0; i < 7; i++) { const x = i * w / 6 - 10, mh = 18 + (i * 37 % 23); g.beginPath(); g.moveTo(x - 40, h * .42); g.lineTo(x, h * .42 - mh); g.lineTo(x + 40, h * .42); g.fill(); }
  // Serpentine nach Norden; Beschriftung unter (1) oder über (-1) dem Punkt
  const P6 = [[.12, .82, 1], [.42, .78, 1], [.72, .7, 1], [.86, .44, 1], [.56, .36, -1], [.26, .2, -1]];
  const pts = P6.map(([x, y]) => [w * x, h * y]);
  // Pfad
  g.lineCap = 'round'; g.setLineDash([2, 7]); g.lineWidth = 4; g.strokeStyle = '#9fb3c6';
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.setLineDash([]); g.strokeStyle = '#ff9b3d'; g.lineWidth = 4;
  g.beginPath(); pts.slice(0, ch).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  g.textAlign = 'center'; g.font = '700 10px system-ui,sans-serif';
  pts.forEach(([x, y], i) => {
    const reached = i < ch, cur = i === ch - 1, last = i === ROUTE.length - 1;
    if (last) { const gl = g.createRadialGradient(x, y, 2, x, y, 22); gl.addColorStop(0, 'rgba(255,170,60,.9)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 22, 0, TAU); g.fill(); }
    g.fillStyle = reached ? '#ff8a2a' : last ? '#ffcf7a' : '#e3eaf1'; g.strokeStyle = reached ? '#b84a10' : '#8fa3b6'; g.lineWidth = cur ? 3 : 1.5;
    g.beginPath(); g.arc(x, y, cur ? 9 : 7, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = reached ? '#3a2410' : '#6b7d8f';
    g.fillText(ROUTE[i], x, y + (P6[i][2] < 0 ? -14 : 20));
  });
}

// =====================================================================
//  FIGUREN
// =====================================================================
const FIG = {
  mara: { name: 'Mara', role: 'die Älteste', x: -85, y: 178, coat: '#7d4f9e', face: 1, opts: { staff: '#ffb12b', hat: '#e8e2f0' }, vis: () => true },
  bjarne: { name: 'Bjarne', role: 'der Schmied', x: 85, y: 178, coat: '#6b4a32', face: -1, opts: { beard: true, beardCol: '#c9c2b8', apron: '#3d2c22' }, vis: () => true },
  ole: { name: 'Ole', role: 'der alte Fischer', x: LAKE_X - 70, y: 712, coat: '#3a6d8c', face: 1, opts: { beard: true, beardCol: '#e8e8e8', hat: '#2b4a66' }, vis: () => S.own.lake },
};
// Was die Figuren nebenbei sagen (passend zum Fortschritt)
const CHAT = {
  mara: [
    () => 'Unser Ziel: ' + (curChapter().goals.find(g => !g.ok()) || { t: 'Ruh dich aus.' }).t + '.',
    () => S.ch >= 2 ? 'Das Glutherz … meine Großmutter hat es noch gesehen.' : 'Solange der Ofen brennt, sind wir sicher.',
    () => S.ch >= 3 ? 'Ylva sagt, der Pass ist bald frei. Bereite dich vor.' : 'Jeder Bär, jedes Holzscheit hält uns am Leben.',
  ],
  bjarne: [
    () => S.own.mine ? 'Schärfere Äxte gefällig? Bring Eisen aus der Mine.' : 'Ohne Eisen kann ich nicht schmieden. Die Mine liegt im Westen.',
    () => 'Ein guter Hammer ist mehr wert als zehn Ausreden.',
    () => S.own.settle ? 'Für die Siedlung brauchen wir Holz und Stein. Viel davon.' : 'Wenn der Ofen stärker wird, bauen wir weiter nach Südwesten.',
  ],
  ole: [
    () => 'Im Eissee schwimmen Fische, die du noch nie gesehen hast.',
    () => 'Ein Glutkarpfen! Den hab ich einmal gefangen. Einmal.',
    () => 'Die Kristalle hier sind warm. Das ist nicht normal, sag ich dir.',
  ],
};
// Kurze Reaktionen auf Fortschritte (über der Figur, auch aus der Ferne)
const REACT = {
  tower: ['mara', 'Gut! Der Turm hält uns die Bären vom Leib.'],
  forest: ['bjarne', 'Holz! Endlich. Pass im Wald auf den Yeti auf.'],
  mine: ['bjarne', 'Die Mine ist offen – jetzt kann ich schmieden.'],
  settle: ['mara', 'Die Siedlung wächst. Das Lager wird zum Dorf.'],
  lake: ['ole', 'Na endlich! Komm, ich zeig dir die besten Eislöcher.'],
  furnace: ['mara', 'Spürst du das? Der Ofen wird stärker.'],
};
const figSay = {}; // id -> { s, t }
function react(padId) { const r = REACT[padId]; if (r && FIG[r[0]].vis()) figSay[r[0]] = { s: r[1], t: 6 }; }

// =====================================================================
//  NEBENAUFTRÄGE
// =====================================================================
// ev: Zähl-Auftrag (eigene Taten), item: Liefer-Auftrag (aus dem Rucksack zur Figur bringen)
const QUESTS = {
  mara: [
    { id: 'bears', t: n => `Jage ${n} Eisbären`, ev: 'bear', n: () => 8 + 2 * S.lv.furnace, ok: () => true },
    { id: 'serve', t: n => `Bediene ${n} Kunden`, ev: 'served', n: () => 10 + 3 * S.lv.furnace, ok: () => true },
    { id: 'meat', t: n => `Bring mir ${n} gebratenes Fleisch für die Kranken`, item: 'cooked', n: () => 6 + S.lv.furnace, ok: () => true },
    { id: 'coal', t: n => `Bring mir ${n} Kohle für die Hütten`, item: 'coal', n: () => 6 + S.lv.furnace, ok: () => S.own.kiln },
  ],
  bjarne: [
    { id: 'wood', t: n => `Bring mir ${n} Holz für neue Werkzeuge`, item: 'wood', n: () => 8 + S.lv.furnace, ok: () => S.own.forest },
    { id: 'trees', t: n => `Fälle ${n} Bäume`, ev: 'tree', n: () => 10 + S.lv.furnace, ok: () => S.own.forest },
    { id: 'iron', t: n => `Bau ${n} Eisenerz ab`, ev: 'iron', n: () => 6 + 2 * S.lv.furnace, ok: () => S.own.mine, r: { iron: 4 } },
    { id: 'stone', t: n => `Brich ${n} Steine`, ev: 'stone', n: () => 12 + 2 * S.lv.furnace, ok: () => S.own.settle },
  ],
  ole: [
    { id: 'fish', t: n => `Fang ${n} Fische`, ev: 'fish', n: () => 10 + S.lv.furnace, ok: () => true },
    { id: 'smoked', t: n => `Bring mir ${n} Räucherfische`, item: 'smoked', n: () => 6 + S.lv.furnace, ok: () => S.own.stall },
    { id: 'cry', t: n => `Schlag ${n} Feuerkristalle`, ev: 'crystal', n: () => 4 + S.lv.furnace, ok: () => true, r: { crystal: 2 } },
    { id: 'rare', t: () => 'Fang einen seltenen Fisch (nicht nur Eisbarsch)', ev: 'rare', n: () => 1, ok: () => true },
  ],
};
const MAX_QUESTS = 2;
const questTpl = q => QUESTS[q.fig].find(t => t.id === q.id);
const questReward = () => Math.round(20 + 15 * Math.pow(S.lv.furnace, 1.5));
// Erste Angebote: Mara nach 1 Minute, Bjarne nach 2, Ole kurz nach dem Öffnen des Sees
const FIRST_OFFER = { mara: 60, bjarne: 120, ole: 20 };

let qT = 0;
function updateQuests(dt) {
  for (const k in figSay) { figSay[k].t -= dt; if (figSay[k].t <= 0) delete figSay[k]; }
  qT -= dt; if (qT > 0) return; qT = .25;
  for (const id in FIG) {
    const f = FIG[id];
    if (!f.vis()) continue;
    if (S.qNext[id] == null) S.qNext[id] = S.time + FIRST_OFFER[id];
    const busy = S.quests.some(q => q.fig === id);
    // Neues Angebot
    if (!S.offers[id] && !busy && S.time >= S.qNext[id]) {
      const pool = QUESTS[id].filter(t => t.ok() && t.id !== f.lastQ);
      if (pool.length) {
        const tp = pool[randi(0, pool.length - 1)];
        S.offers[id] = { id: tp.id, n: tp.n(), r: Object.assign({ cash: questReward() }, typeof tp.r === 'function' ? tp.r() : tp.r || {}) };
      }
    }
    // Annehmen: zur Figur gehen und kurz stehen bleiben
    const d = dist(player.x, player.y, f.x, f.y);
    f.near = d < 50 && !(player.dead > 0) ? (f.near || 0) + .25 : 0;
    if (S.offers[id] && f.near >= .5) {
      if (S.quests.length >= MAX_QUESTS) { if (!figSay[id]) figSay[id] = { s: 'Du hast schon zwei Aufträge. Erledige erst einen.', t: 3 }; }
      else {
        const o = S.offers[id]; S.offers[id] = null; f.lastQ = o.id;
        S.quests.push({ fig: id, id: o.id, n: o.n, got: 0, r: o.r });
        figSay[id] = { s: 'Danke! ' + questTpl(S.quests[S.quests.length - 1]).t(o.n) + '.', t: 4 };
        snd('pick'); S.diaryNew = 1; save();
      }
    }
  }
  // Vorrats-Aufträge (Stein, Eisen, Werkzeug, Kleidung): bei der Figur stehen, dann wird aus dem Vorrat geliefert
  for (const q of S.quests) {
    const tp = questTpl(q), f = FIG[q.fig];
    if (!tp.res || q.got >= q.n || dist(player.x, player.y, f.x, f.y) > 50) continue;
    const n = Math.min(4, q.n - q.got, S[tp.res] || 0);
    if (n > 0) { S[tp.res] -= n; q.got += n; snd('pick'); ftext(f.x, f.y, 70, '−' + n + ' ' + SYM[tp.res], '#ffe7b0', 14); }
  }
  for (const q of S.quests.slice()) if (q.got >= q.n) finishQuest(q);
}
function questEvent(k, n) { for (const q of S.quests) if (questTpl(q).ev === k) q.got = Math.min(q.n, q.got + n); }
function finishQuest(q) {
  const f = FIG[q.fig];
  S.quests.splice(S.quests.indexOf(q), 1);
  S.qDone++; S.qNext[q.fig] = S.time + rand(110, 190);
  giveReward(q.r);
  toast('✔ Auftrag erfüllt: ' + f.name, rewardTxt(q.r));
  figSay[q.fig] = { s: 'Großartig, vielen Dank!', t: 4 };
  snd('buy'); buzz([25, 40, 25]);
  for (let i = 0; i < 6; i++) fly('cash', f.x, f.y, 50, player.x, player.y, 40, .35 + i * .05);
  save();
}
// Liefer-Aufträge: Gegenstände aus dem Rucksack zur Figur bringen (wird aus doTransfers aufgerufen)
function questTransfer(give) {
  for (const q of S.quests) {
    const tp = questTpl(q), f = FIG[q.fig];
    if (!tp.item || q.got >= q.n || !near(f, 50)) continue;
    if (give(tp.item, f, () => { q.got = Math.min(q.n, q.got + 1); })) return true;
  }
  return false;
}
// Hinweis-Pfeil: zu liefernde Dinge im Rucksack -> zur Figur
function questHint(st) {
  for (const q of S.quests) {
    const tp = questTpl(q), f = FIG[q.fig];
    if (tp.item && st.includes(tp.item) && q.got < q.n && f.vis()) return { x: f.x, y: f.y + 30, t: `Bring es zu ${f.name} (${q.got}/${q.n})` };
    if (tp.res && q.got < q.n && (S[tp.res] || 0) >= q.n - q.got && f.vis()) return { x: f.x, y: f.y + 30, t: `Bring ${f.name} die Ware (${q.got}/${q.n})` };
  }
  return null;
}
// Hinweis-Pfeil (niedrige Priorität): Angebot einer Figur in der Nähe
function offerHint() {
  if (S.quests.length >= MAX_QUESTS) return null;
  for (const id in S.offers) {
    const f = FIG[id];
    if (S.offers[id] && f.vis() && dist(player.x, player.y, f.x, f.y) < 450) return { x: f.x, y: f.y + 20, t: `${f.name} hat einen Auftrag für dich` };
  }
  return null;
}

// =====================================================================
//  ZEICHNEN
// =====================================================================
function addFigures(add, t) {
  for (const id in FIG) {
    const f = FIG[id];
    if (!f.vis() || !onScreen(f.x, f.y)) continue;
    const fc = player.x > f.x ? 1 : -1, look = dist(player.x, player.y, f.x, f.y) < 160 ? fc : f.face;
    add(f.y, () => {
      at(f.x, f.y); ell(0, 0, 18, 8, 'rgba(255,200,90,.22)');
      ctx.translate(0, Math.sin(t * 2 + f.x) * .6); if (f.scale) ctx.scale(f.scale, f.scale);
      drawPerson(f.coat, 0, false, look, Object.assign({}, f.opts, { staff: f.opts.staff && look ? f.opts.staff : null }));
    });
  }
}
// Namensschild, Auftrags-Zeichen und Sprechblase (Bildschirm-Koordinaten)
function drawFigureUI(t) {
  const s = clamp(Z * 1.15, .75, 1.2); let best = null;
  for (const id in FIG) {
    const f = FIG[id];
    if (!f.vis() || !onScreen(f.x, f.y)) continue;
    const pp = P(f.x, f.y), d = dist(player.x, player.y, f.x, f.y);
    txt(f.name, pp[0], pp[1] + 14 * s, 11 * s, '#fff3d6', 'center', 'rgba(60,35,10,.6)', 800);
    const q = S.quests.find(x => x.fig === id), o = S.offers[id];
    // Zeichen über dem Kopf
    const top = P(f.x, f.y, 74 + Math.abs(Math.sin(t * 3)) * 6);
    if (o) { ell(top[0], top[1], 11 * s, 11 * s, '#ffd84a'); txt('!', top[0], top[1] + 1, 16 * s, '#6a3d00', 'center', null, 900); }
    else if (q) { ell(top[0], top[1], 11 * s, 11 * s, 'rgba(255,255,255,.9)'); txt(q.got + '/' + q.n, top[0], top[1] + 1, 9 * s, '#345', 'center', null, 800); }
    // Sprechblase (nur die der nächsten Figur, damit sich nichts überlappt)
    let line = figSay[id] && figSay[id].s;
    if (!line && d < 130) {
      if (o) line = 'Ich hätte da was: ' + QUESTS[id].find(x => x.id === o.id).t(o.n) + '. Bleib kurz bei mir!';
      else if (q) line = questTpl(q).t(q.n) + ' – ' + q.got + '/' + q.n;
      else { const n = CHAT[id].length; line = CHAT[id][(Math.floor(t / 6 + Math.abs(f.x)) % n + n) % n](); }
    }
    if (line && (!best || d < best.d)) best = { d, line, x: pp[0], y: P(f.x, f.y, o || q ? 92 : 72)[1] };
  }
  if (best) bubble(best.line, best.x, best.y, s);
}
function bubble(s, x, y, sc) {
  const lines = wrap(s, 30), fs = 12 * sc, lh = 15 * sc;
  ctx.font = `700 ${fs}px system-ui,sans-serif`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20 * sc, h = lines.length * lh + 12 * sc;
  const bx = clamp(x - w / 2, 6, W - w - 6), by = y - h - 8 * sc;
  rr(bx, by, w, h, 10 * sc, 'rgba(255,255,255,.95)');
  poly([x - 6 * sc, by + h - 1, x + 6 * sc, by + h - 1, x, by + h + 7 * sc], 'rgba(255,255,255,.95)');
  lines.forEach((l, i) => txt(l, bx + w / 2, by + 6 * sc + lh * (i + .5), fs, '#2a3442', 'center', null, 700));
}
function wrap(s, n) {
  const out = []; let cur = '';
  for (const w of s.split(' ')) { if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) out.push(cur); return out.slice(0, 4);
}
// HUD: aktuelles Kapitelziel unter dem Titel
function drawGoalHUD(top) {
  const c = curChapter(), g = c.goals.find(x => !x.ok());
  const done = c.goals.filter(x => x.ok()).length;
  const s = g ? '🎯 ' + g.t : '✔ Alle Ziele erreicht';
  ctx.font = '700 12px system-ui,sans-serif';
  const w = Math.min(W - 196, ctx.measureText(s).width + 22);
  rr(64, top + 44, w, 36, 12, 'rgba(25,35,50,.5)');
  txt('KAPITEL ' + c.n + ' · ' + done + '/' + c.goals.length, 74, top + 54, 9, '#ffcf7a', 'left', null, 800);
  ctx.save(); ctx.beginPath(); ctx.rect(64, top + 44, w - 6, 36); ctx.clip();
  txt(s, 73, top + 69, 12, '#ffffff', 'left', null, 700); ctx.restore();
}
