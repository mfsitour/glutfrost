'use strict';
// Glutfrost – Spielfigur: Helden-Auswahl und Aussehen-Editor (Tagebuch-Reiter „Figur“), dazu weitere Bewohner
// =====================================================================
//  AUSSEHEN
// =====================================================================
// Teile mit ach: erst nach diesem Erfolg wählbar (Erfolge bleiben auch nach „Neues Feuer“ erhalten)
const LOOK = {
  skin: ['#f1c7a0', '#f7dcc0', '#d9a877', '#b07a4e', '#7a4f32'],
  hair: ['#8a5a36', '#3a2a20', '#d9b25a', '#b5442a', '#c9c2b8', '#1c1c1c'],
  coat: [
    { c: '#25a2c9', n: 'Eisblau' }, { c: '#c0453a', n: 'Rot' }, { c: '#3f9a5a', n: 'Tannengrün' }, { c: '#8a5fc0', n: 'Violett' },
    { c: '#d98a2b', n: 'Ocker' }, { c: '#4a5568', n: 'Schiefer' }, { c: '#d16a9a', n: 'Rosa' }, { c: '#e6e2d8', n: 'Schneeweiß' },
    { c: '#8a94a0', n: 'Wolfspelz', trim: '#e9edf1', ach: 'boss1' },
    { c: '#6b7f96', n: 'Golemgrau', trim: '#bfe6ff', ach: 'golem1' },
    { c: '#bfe6ff', n: 'Frostmantel', trim: '#ffffff', ach: 'guard1' },
    { c: '#e2572b', n: 'Glutmantel', glow: 1, ach: 'finale' },
  ],
  head: [
    { id: 'hood', n: 'Kapuze' }, { id: 'cap', n: 'Wollmütze' }, { id: 'fur', n: 'Pelzmütze' }, { id: 'band', n: 'Stirnband' }, { id: 'bare', n: 'Ohne' },
    { id: 'yeti', n: 'Yetimütze', ach: 'yeti1' }, { id: 'wolfhood', n: 'Wolfskapuze', ach: 'boss1' }, { id: 'horn', n: 'Hörnerhelm', ach: 'golem1' },
    { id: 'wyrm', n: 'Wyrmkamm', ach: 'wyrm1' }, { id: 'crown', n: 'Glutkrone', ach: 'finale' },
  ],
  beard: [{ n: 'Kein Bart' }, { n: 'Kurzer Bart' }, { n: 'Vollbart' }],
  scarf: [
    { c: null, n: 'Kein Schal' }, { c: '#c0453a', n: 'Rot' }, { c: '#e6b93a', n: 'Gelb' }, { c: '#3f9a5a', n: 'Grün' }, { c: '#f5f2ec', n: 'Weiß' }, { c: '#2a5d86', n: 'Blau' },
    { c: '#7de3c3', n: 'Nordlicht-Schal', ach: 'night10' },
  ],
};
const lookOpen = o => !o.ach || !!S.ach[o.ach];
const achName = id => (ACH.find(a => a.id === id) || { n: id }).n;
function lookOpts(lk = S.look) {
  const c = LOOK.coat[lk.coat] || LOOK.coat[0], sc = LOOK.scarf[lk.scarf] || LOOK.scarf[0], hc = LOOK.hair[lk.hair] || LOOK.hair[0];
  return { coat: c.c, o: { skin: LOOK.skin[lk.skin] || LOOK.skin[0], hairCol: hc, head: lk.head, beard: lk.beard > 0, beardCol: hc, beardFull: lk.beard > 1, scarf: sc.c, hatCol: sc.c || '#c0453a', trim: c.trim, glow: c.glow } };
}
// Vorschau: die Spielfigur groß auf eine eigene Zeichenfläche
function drawLookPreview(c) {
  const k = Math.min(2, devicePixelRatio || 1), w = 120, h = 150;
  c.width = w * k; c.height = h * k; c.style.width = w + 'px'; c.style.height = h + 'px';
  const g = c.getContext('2d'), old = ctx, lk = lookOpts();
  ctx = g;
  try { g.setTransform(k * 2.5, 0, 0, k * 2.5, w / 2 * k, (h - 8) * k); drawPerson(lk.coat, 0, false, 1, lk.o); } finally { ctx = old; }
}
function lookHTML() {
  const hero = HEROES.find(x => x.id === S.hero) || HEROES[0], lk = S.look, locked = [];
  let h = `<div class="lookTop"><canvas id="lookCv"></canvas><div><div class="kick">Deine Spielfigur</div><h3>${esc(hero.n)}, ${esc(hero.role)}</h3><p class="mut">Bonus: <b>${esc(hero.d)}</b></p><p class="mut">Held und Aussehen kannst du jederzeit ändern.</p></div></div>`;
  h += '<h4>Held</h4><div class="grid">';
  for (const x of HEROES) h += `<button class="hero${x.id === S.hero ? ' on' : ''}" data-hero="${x.id}"><b>${esc(x.n)}</b><span>${esc(x.role)}</span><span class="rw">${esc(x.d)}</span></button>`;
  h += '</div>';
  const sw = (key, list, title) => {
    h += `<h4>${title}</h4><div class="sws">`;
    list.forEach((o, i) => {
      const col = typeof o === 'string' ? o : o.c, open = typeof o === 'string' || lookOpen(o), on = lk[key] === i;
      if (!open) locked.push(o);
      h += `<button class="sw${on ? ' on' : ''}${col ? '' : ' none'}" data-lk="${key}" data-v="${i}" ${open ? '' : 'disabled'} style="${col ? 'background:' + col : ''}" aria-label="${esc(o.n || title + ' ' + (i + 1))}">${open ? (col ? '' : '✕') : '🔒'}</button>`;
    });
    h += '</div>';
  };
  const chips = (key, list, title, val) => {
    h += `<h4>${title}</h4><div class="chips">`;
    list.forEach((o, i) => {
      const open = lookOpen(o), v = val ? o.id : i;
      if (!open) locked.push(o);
      h += `<button class="chip${lk[key] === v ? ' on' : ''}" data-lk="${key}" data-v="${v}" ${open ? '' : 'disabled'}>${open ? '' : '🔒 '}${esc(o.n)}</button>`;
    });
    h += '</div>';
  };
  sw('coat', LOOK.coat, 'Mantel'); chips('head', LOOK.head, 'Kopf', true);
  sw('skin', LOOK.skin, 'Hautton'); sw('hair', LOOK.hair, 'Haar- und Bartfarbe'); chips('beard', LOOK.beard, 'Bart');
  sw('scarf', LOOK.scarf, 'Schal (färbt auch Mütze und Stirnband)');
  if (locked.length) h += '<h4>Noch verschlossen</h4>' + locked.map(o => `<p class="mut">🔒 <b>${esc(o.n)}</b> – Erfolg „${esc(achName(o.ach))}“</p>`).join('');
  return h;
}
$('diaryBody').addEventListener('click', e => {
  const b = e.target.closest ? e.target.closest('[data-hero],[data-lk]') : null; if (!b || b.disabled) return;
  if (b.dataset.hero) { const x = HEROES.find(y => y.id === b.dataset.hero); S.hero = x.id; S.look = Object.assign({}, x.look); toast('🧑 ' + x.n + ', ' + x.role, x.d); }
  else { const k = b.dataset.lk; S.look[k] = k === 'head' ? b.dataset.v : +b.dataset.v; }
  snd('pick'); save();
  const el = $('diaryBody'), y = el.scrollTop; renderDiary(); el.scrollTop = y;
});
$('bLook').onclick = () => { show('menu', false); openDiary('look'); };
// Verschlossene Teile im Spielstand (z. B. nach einem Zurücksetzen) auf Standard zurückstellen
if (!lookOpen(LOOK.coat[S.look.coat] || {})) S.look.coat = 0;
if (!lookOpen(LOOK.head.find(o => o.id === S.look.head) || { ach: '?' })) S.look.head = 'hood';
if (!lookOpen(LOOK.scarf[S.look.scarf] || {})) S.look.scarf = 0;

// =====================================================================
//  WEITERE BEWOHNER
// =====================================================================
FIG.jonte = { name: 'Jonte', role: 'der Junge', x: -170, y: 50, coat: '#d98a2b', face: 1, scale: .78, opts: { head: 'cap', hatCol: '#c0453a', hairCol: '#d9b25a' }, vis: () => S.own.tower };
FIG.liv = { name: 'Liv', role: 'die Heilerin', x: 172, y: 50, coat: '#4f9a7a', face: -1, opts: { head: 'bare', hairCol: '#b5442a', scarf: '#f5f2ec' }, vis: () => S.lv.furnace >= 2 };
FIG.tomke = { name: 'Tomke', role: 'der Händler', x: -300, y: 745, coat: '#a8842c', face: 1, opts: { head: 'fur', hairCol: '#3a2a20', beard: true, beardCol: '#3a2a20' }, vis: () => S.own.stall };
CHAT.jonte = [
  () => 'Wenn ich groß bin, jage ich auch Eisbären!',
  () => S.own.forest ? 'Ist der Yeti wirklich so groß wie ein Haus?' : 'Was ist wohl hinter dem Zaun im Osten?',
  () => S.ch >= 3 ? 'Nachts höre ich die Wölfe heulen. Du passt doch auf, oder?' : 'Mara sagt, weit im Norden leuchtet der Himmel.',
];
CHAT.liv = [
  () => 'Wer friert, wird krank. Halt dich warm, hörst du?',
  () => 'An einem Feuer heilen Wunden schneller. Merk dir das für unterwegs.',
  () => S.own.lake ? 'Räucherfisch ist die beste Medizin, sagt Ole. Ich sage: Tee.' : 'Ich bräuchte dringend frischen Fisch für die Kranken.',
];
CHAT.tomke = [
  () => 'Stein und Eisen nehme ich immer. Gute Ware, guter Preis.',
  () => S.own.anvil ? 'Für Werkzeug zahlen sie im Süden ein Vermögen.' : 'Ein Lager ohne Händler ist nur ein Zeltplatz.',
  () => 'Bjarne verbessert deine Ausrüstung mit Eisen. Schau ins Tagebuch.',
];
QUESTS.jonte = [
  { id: 'jbear', t: n => `Erlege ${n} Eisbären – ich schaue vom Zaun aus zu`, ev: 'bear', n: () => 6 + S.lv.furnace, ok: () => true },
  { id: 'jtree', t: n => `Fäll ${n} Bäume – ich baue mir eine Schneeburg`, ev: 'tree', n: () => 6 + S.lv.furnace, ok: () => S.own.forest },
  { id: 'jfish', t: n => `Fang ${n} Fische – ich will sehen, wie groß die sind`, ev: 'fish', n: () => 5 + S.lv.furnace, ok: () => S.own.lake },
  { id: 'jwolf', t: n => `Verjage ${n} Wölfe, damit ich schlafen kann`, ev: 'wolf', n: () => 5 + S.lv.furnace, ok: () => S.own.pass },
];
QUESTS.liv = [
  { id: 'lbig', t: n => `Erlege ${n} große Eisbären – ich brauche das Fett für Salben`, ev: 'bigbear', n: () => 2 + Math.floor(S.lv.furnace / 3), ok: () => true },
  { id: 'lmeat', t: n => `Bring mir ${n} gebratenes Fleisch für die Krankensuppe`, item: 'cooked', n: () => 5 + S.lv.furnace, ok: () => true },
  { id: 'lfish', t: n => `Bring mir ${n} Räucherfische für die Kranken`, item: 'smoked', n: () => 5 + S.lv.furnace, ok: () => S.own.stall },
  { id: 'lbliz', t: () => 'Übersteh einen Schneesturm', ev: 'bliz', n: () => 1, ok: () => S.own.forest },
];
// Tomke kauft Vorräte: Stein und Eisen bleiben so bis zum Schluss gefragt. Er zahlt dreifach, ab Kapitel 4 legt er ein Ausrüstungsteil dazu.
const tomkePay = () => Object.assign({ cash: 3 * questReward() }, S.ch >= 4 ? { box: Math.min(3, S.ch - 3) } : {});
QUESTS.tomke = [
  { id: 'tstone', t: n => `Verkauf mir ${n} Stein 🪨`, res: 'stone', n: () => 20 + 5 * S.lv.furnace, ok: () => true, r: tomkePay },
  { id: 'tiron', t: n => `Verkauf mir ${n} Eisen ⛓`, res: 'iron', n: () => 15 + 4 * S.lv.furnace, ok: () => S.own.mine, r: tomkePay },
  { id: 'ttools', t: n => `Verkauf mir ${n} Werkzeug 🔨`, res: 'tools', n: () => 10 + 3 * S.lv.furnace, ok: () => S.own.anvil, r: tomkePay },
  { id: 'tcloth', t: n => `Verkauf mir ${n} Kleidung 🧶`, res: 'cloth', n: () => 8 + 3 * S.lv.furnace, ok: () => S.own.tailor, r: tomkePay },
];
Object.assign(FIRST_OFFER, { jonte: 90, liv: 45, tomke: 60 });
RSYM.box = ' 🎁';
