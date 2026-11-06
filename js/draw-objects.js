'use strict';
// Glutfrost – Zeichnen: Objekte und Gebäude
// =====================================================================
//  ZEICHNEN – Objekte
// =====================================================================
const ITC = {
  raw: ['#f08a8f', '#d24f5d', '#fde0e0'], cooked: ['#bb6a3c', '#86421f', '#e8a874'], wood: ['#c27f45', '#8c5428', '#efc08a'],
  coal: ['#4a4d55', '#2a2c31', '#777b85'], cash: ['#4cc95b', '#2c9038', '#a8f0ae'], iron: ['#b3bcc4', '#7b848d', '#eef2f5'],
  stone: ['#a7adb4', '#7d848c', '#d5d9de'], fish: ['#8fb3cf', '#5f86a6', '#d9ecf7'], smoked: ['#d99a4e', '#a8662a', '#f3c98c'],
  crystal: ['#ff9b3d', '#d9541a', '#ffe0a0'], find: ['#ffd84a', '#e0a21c', '#fff6c8'],
};
function drawItem(t) { blit(sprite('i' + t, 28, 16, 13, 13, () => drawItemRaw(t))); }
function drawItemRaw(t) {
  const c = ITC[t];
  if (t === 'fish' || t === 'smoked') {
    ell(-1, -4, 9, 3.8, c[1]); ell(-1, -5, 8.5, 3.2, c[0]);
    poly([7, -4.5, 12, -8.5, 12, -0.5], c[1]); ell(-6, -5.6, 1.1, 1.1, '#223');
    ctx.fillStyle = c[2]; ctx.fillRect(-3, -7, 6, 1.2); return;
  }
  if (t === 'crystal') {
    poly([-6, -2, -3, -10, 0, -12, 3, -10, 6, -2, 0, 0], c[1]); poly([0, 0, 0, -12, 3, -10, 6, -2], c[0]); poly([-2, -4, 0, -11, 1, -5], c[2]);
    return;
  }
  if (t === 'find') { // Fundstück: glitzernder Stern
    poly([0, -14, 2.6, -7.6, 9, -7, 4, -3.2, 5.6, 3, 0, -.4, -5.6, 3, -4, -3.2, -9, -7, -2.6, -7.6], c[1]);
    poly([0, -12, 2, -7.2, 6.5, -6.8, 3, -3.6, 4, 1, 0, -1.6, -4, 1, -3, -3.6, -6.5, -6.8, -2, -7.2], c[0]);
    ell(-1.5, -7.5, 1.6, 1.2, c[2]); return;
  }
  if (t === 'stone') { ell(0, -3.5, 9, 4.5, c[1]); ell(-1, -4.5, 8, 3.8, c[0]); ell(-3, -6, 3.5, 1.5, c[2]); return; }
  if (t === 'wood') { rr(-10, -6, 20, 6, 3, c[1]); rr(-10, -7, 20, 4.5, 2.2, c[0]); ell(10, -4.5, 2.6, 2.6, c[2]); return; }
  rr(-9, -5, 18, 5, 2, c[1]); rr(-9, -7, 18, 4.5, 2, c[0]);
  ctx.fillStyle = c[2];
  if (t === 'cash') { ctx.fillRect(-3, -6.6, 6, 3.6); }
  else if (t === 'raw' || t === 'cooked') { ctx.fillRect(-7, -6.6, 5, 1.4); ctx.fillRect(2, -5, 4, 1.2); }
  else ctx.fillRect(-6, -6.6, 4, 1.3);
}
function drawStack(x, y, list, z0 = 34) {
  for (let i = 0; i < list.length; i++) { at(x, y, z0 + i * 5); drawItem(list[i]); }
}
function drawPile(cx, cy, type, count, cols = 3, rows = 2, sx = 20, sy = 14, per = 10) {
  if (count <= 0) return;
  const slots = cols * rows, n = Math.min(count, slots * per);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = r * cols + c, h = Math.floor(n / slots) + (k < n % slots ? 1 : 0);
    const x = cx + (c - (cols - 1) / 2) * sx, y = cy + (r - (rows - 1) / 2) * sy;
    for (let i = 0; i < h; i++) { at(x, y, 2 + i * 5); drawItem(type); }
  }
}
function shadow(rx = 14, ry = 6) { ell(0, 0, rx, ry, 'rgba(40,60,90,.18)'); }

function drawPerson(coat, anim, moving, face, opts = {}) {
  shadow(12, 5);
  const sw = moving ? Math.sin(anim) * 4 : 0;
  rr(-7 + sw * .5, -12, 5, 12, 2, '#2c3646'); rr(2 - sw * .5, -12, 5, 12, 2, '#2c3646');
  rr(-10, -33, 20, 23, 7, coat);
  rr(-10, -16, 20, 4, 2, 'rgba(255,255,255,.85)');
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(2, -31, 7, 18);
  // Arme
  rr(-13, -30 - sw * .3, 5, 13, 2.5, coat); rr(8, -30 + sw * .3, 5, 13, 2.5, coat);
  // Kopf mit Kapuze
  ell(0, -40, 10.5, 10, coat);
  ell(0, -39, 8.5, 8, '#f5f2ec');
  ell(face * 1.2, -38.5, 6, 6, '#f1c7a0');
  ell(face * 1.2 - 2.2, -39.5, 1, 1.2, '#2a2a2a'); ell(face * 1.2 + 2.2, -39.5, 1, 1.2, '#2a2a2a');
  if (opts.beard) { ell(face * 1.2, -34.5, 4.5, 2.6, opts.beardCol || '#8a5a36'); if (opts.beardCol) ell(face * 1.2, -32, 3.6, 3.4, opts.beardCol); }
  if (opts.hat) { rr(-8, -52, 16, 5, 2, opts.hat); }
  if (opts.apron) { rr(-7, -27, 14, 15, 3, opts.apron); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-7, -21, 14, 1.5); }
  if (opts.staff) { rr(12 * face - 1.5, -54, 3, 54, 1.5, '#7a5230'); ell(12 * face, -55, 3.5, 3.5, opts.staff); }
}
function drawAxe(spin) {
  ctx.rotate(spin);
  rr(-1.5, -12, 3, 22, 1.5, '#8b5a33');
  poly([1, -12, 11, -15, 13, -5, 1, -6], '#cfd8df');
  poly([1, -12, 11, -15, 11.5, -13, 1, -10.5], '#ffffff');
}
function drawBear(b) {
  const s = b.big ? 1.3 : 1;
  ctx.scale(b.face * s, s);
  shadow(28, 9);
  const bob = Math.sin(b.anim) * 1.5, lg = Math.sin(b.anim) * 4;
  const leg = '#e6e4dc';
  rr(-18, -14, 7, 14 + lg * .3, 3, leg); rr(-6, -14, 7, 14 - lg * .3, 3, leg);
  rr(8, -14, 7, 14 - lg * .3, 3, leg); rr(18, -14, 7, 14 + lg * .3, 3, leg);
  ell(0, -22 + bob, 27, 15, '#f7f6f1');
  ell(-2, -16 + bob, 24, 8, '#e9e7df');
  ell(-26, -24 + bob, 4, 4, '#f7f6f1');
  ell(24, -27 + bob, 11, 10, '#f7f6f1');
  ell(33, -25 + bob, 6.5, 5, '#ecebe4');
  ell(38, -26 + bob, 2.4, 2, '#222');
  ell(26, -30 + bob, 1.5, 1.6, '#222');
  ell(18, -35 + bob, 3.6, 3.4, '#ebe9e1'); ell(18, -35 + bob, 1.8, 1.7, '#cfc9bd');
  if (b.flash > 0) { ctx.globalAlpha = .5; ell(4, -22, 34, 18, '#ff4d4d'); ctx.globalAlpha = 1; }
}
function drawTree(tr, s = 1, decor = false) {
  if (tr.stump) { ell(0, 0, 11, 5, '#7a4b2e'); ell(0, -3, 10, 4.5, '#c49067'); ell(0, -3, 5, 2, '#a8754f'); return; }
  ctx.scale(s, s);
  shadow(20, 7);
  if (tr.shake > 0) ctx.rotate(Math.sin(tr.shake * 60) * .06);
  rr(-3.5, -14, 7, 14, 2, '#7a4b2e');
  const tiers = [[24, -10], [19, -28], [13, -45]];
  for (const [w, y0] of tiers) {
    poly([-w, y0, w, y0, 0, y0 - 30], '#4e86b6');
    poly([-w, y0, 0, y0, 0, y0 - 30], '#6ea3d0');
    poly([-w * .45, y0 - 16, 0, y0 - 30, w * .45, y0 - 16, 0, y0 - 20], '#ffffff');
  }
  if (!decor && tr.hp < tr.max) { screenHp(tr, 82, tr.hp / tr.max, '#ffcf4d'); }
}
function drawRock(r) {
  if (r.stump) { ell(0, -2, 16 * r.s, 7 * r.s, '#9aa1a8'); ell(0, -3, 12 * r.s, 5 * r.s, '#b6bcc2'); return; }
  ctx.scale(r.s, r.s);
  if (r.shake > 0) ctx.translate(Math.sin(r.shake * 70) * 2, 0);
  shadow(24, 9);
  poly([-24, 0, -20, -20, -6, -32, 12, -28, 24, -14, 22, 0], '#7f878f');
  poly([-20, -20, -6, -32, 12, -28, 4, -18, -10, -14], '#a9b1b8');
  poly([4, -18, 12, -28, 24, -14, 22, 0, 8, -4], '#6b737b');
  ell(-8, -10, 3.5, 2.5, '#e08a3a'); ell(10, -12, 3, 2.2, '#e6a04e'); ell(-2, -22, 2.5, 2, '#f0b060');
  if (r.hp < r.max) screenHp(r, 50, r.hp / r.max, '#ffcf4d');
}
function drawYeti(y, t) {
  ctx.scale(y.face * 1.3, 1.3);
  shadow(44, 14);
  const bob = Math.sin(y.anim) * 2, lg = Math.sin(y.anim) * 5;
  rr(-22, -30, 16, 30 + lg * .2, 7, '#9aa6ba'); rr(8, -30, 16, 30 - lg * .2, 7, '#9aa6ba');
  ell(0, -62 + bob, 42, 40, '#7d889c');
  ell(0, -62 + bob, 40, 38, '#c9d1de');
  ell(-8, -55 + bob, 30, 28, '#b6bfcf');
  // Kristalle auf dem Rücken
  for (const [cx, cy, h, w] of [[-22, -92, 26, 8], [-6, -100, 32, 9], [12, -94, 24, 8], [-32, -78, 18, 6]]) {
    poly([cx - w, cy + bob, cx, cy - h + bob, cx + w, cy + bob], '#8f5bd9'); poly([cx, cy + bob, cx, cy - h + bob, cx + w, cy + bob], '#b98cff');
  }
  // Arme
  rr(30, -78 + bob - lg * .3, 16, 44, 8, '#c3cbd9'); rr(-46, -78 + bob + lg * .3, 16, 44, 8, '#a9b3c4');
  // Gesicht
  ell(20, -70 + bob, 16, 15, '#6f7a8e');
  ell(16, -74 + bob, 3, 3, '#ffd34d'); ell(26, -74 + bob, 3, 3, '#ffd34d');
  poly([12, -63 + bob, 30, -63 + bob, 21, -58 + bob], '#ffffff');
  poly([8, -88 + bob, 4, -104 + bob, 14, -90 + bob], '#f2efe6'); poly([28, -88 + bob, 36, -102 + bob, 32, -86 + bob], '#f2efe6');
  if (y.flash > 0) { ctx.globalAlpha = .45; ell(0, -60, 46, 44, '#ff4d4d'); ctx.globalAlpha = 1; }
}
function drawFurnace(t) {
  shadow(58, 22);
  const lvl = S.lv.furnace;
  // Füße
  for (const k of [-1, 1]) {
    poly([k * 26, -2, k * 52, 4, k * 54, -10, k * 30, -16], '#f2a531');
    poly([k * 30, -16, k * 54, -10, k * 50, -16, k * 28, -22], '#ffc75a');
  }
  poly([-18, 8, 18, 8, 22, -6, -22, -6], '#e58f1d');
  // Sockel
  ell(0, -10, 46, 18, '#2c2e33'); rr(-46, -38, 92, 28, 4, '#3a3d43'); ell(0, -38, 46, 18, '#4a4d54');
  // Körper
  poly([-40, -38, 40, -38, 30, -112, -30, -112], '#4d5058');
  poly([-40, -38, -10, -38, -8, -112, -30, -112], '#5d616a');
  for (let i = 0; i < 3; i++) { const yy = -58 - i * 20, w = 38 - i * 2.8; rr(-w, yy, w * 2, 4, 2, '#35373c'); }
  // Glut-Fenster
  const fl = .7 + Math.sin(t * 9) * .15 + Math.sin(t * 23) * .08;
  rr(-12, -66, 24, 16, 6, '#2a1a10'); ctx.globalAlpha = fl; rr(-10, -64, 20, 12, 5, '#ff9a2e'); ctx.globalAlpha = 1;
  // Rand
  ell(0, -112, 31, 11, '#2e3035'); ell(0, -113, 24, 8, '#ff8c1a'); ell(0, -114, 17, 5, '#ffd25a');
  // Flamme
  const fh = 26 + lvl * 5 + Math.sin(t * 11) * 4;
  ctx.globalAlpha = .95;
  poly([-16, -114, -6, -114 - fh * .75 + Math.sin(t * 13) * 3, 0, -114 - fh, 6, -114 - fh * .8, 16, -114], '#ff8a1c');
  poly([-9, -114, -2, -114 - fh * .6, 4, -114 - fh * .7, 9, -114], '#ffd23f');
  ctx.globalAlpha = 1;
  // Stufen-Anzeige
  const nl = S.own.lake || lvl > 5 ? 8 : 5;
  for (let i = 0; i < nl; i++) ell(-(nl - 1) * 4 + i * 8, -27, 2.6, 2.6, i < lvl ? (i >= 5 ? '#ff7a2b' : '#ffb12b') : '#25272b');
}
function drawKiln(t) {
  shadow(36, 14);
  ell(0, -4, 34, 14, '#7c4a35');
  rr(-34, -30, 68, 26, 6, '#a65d3f');
  ell(0, -30, 34, 24, '#b86a49'); ell(-8, -36, 20, 14, '#c97b58');
  for (let i = -2; i <= 2; i++) rr(i * 12 - 4, -24, 8, 4, 1, 'rgba(0,0,0,.12)');
  rr(-10, -20, 20, 16, 8, '#2a1a12'); ctx.globalAlpha = .7 + Math.sin(t * 7) * .2; rr(-7, -16, 14, 11, 6, '#ff8a2a'); ctx.globalAlpha = 1;
  rr(12, -72, 12, 30, 2, '#6d6f75'); rr(10, -74, 16, 5, 2, '#55575c');
  for (let i = 0; i < 3; i++) { const k = ((t * .5 + i / 3) % 1); ctx.globalAlpha = (1 - k) * .45; ell(18 + k * 10, -80 - k * 50, 6 + k * 10, 5 + k * 8, '#9aa0a8'); }
  ctx.globalAlpha = 1;
}
function drawTower(t) {
  shadow(30, 11);
  for (const [x1, x2] of [[-18, -12], [18, 12]]) { ctx.strokeStyle = '#8b5a33'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x2, -46); ctx.stroke(); }
  ctx.strokeStyle = '#a9713f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(14, -36); ctx.moveTo(16, -10); ctx.lineTo(-14, -36); ctx.stroke();
  rr(-24, -54, 48, 10, 3, '#b77a44'); rr(-24, -50, 48, 6, 2, '#94602f');
  // Armbrust
  ctx.save(); ctx.translate(0, -62);
  const ax = Math.cos(towerAim), ay = Math.sin(towerAim) * TY;
  const a = Math.atan2(ay, ax); ctx.rotate(a);
  rr(-14, -3, 30, 6, 2, '#7a4b2e');
  ctx.strokeStyle = '#5b3a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(12, 0, 14, -1.4, 1.4); ctx.stroke();
  ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, -14); ctx.lineTo(-6, 0); ctx.lineTo(14, 14); ctx.stroke();
  ctx.restore();
}
// ---------- Siedlung ----------
function smokePuffs(t, x, y, n = 3) {
  for (let i = 0; i < n; i++) { const k = ((t * .5 + i / n) % 1); ctx.globalAlpha = (1 - k) * .45; ell(x + k * 10, y - k * 50, 6 + k * 10, 5 + k * 8, '#9aa0a8'); }
  ctx.globalAlpha = 1;
}
function drawSmokehouse(t) {
  shadow(46, 16);
  rr(-40, -46, 80, 46, 3, '#8c5a35');
  for (let i = 0; i < 4; i++) rr(-40, -42 + i * 11, 80, 2, 1, 'rgba(0,0,0,.16)');
  rr(-10, -30, 20, 30, 3, '#4a2e1a');
  ctx.globalAlpha = .65 + Math.sin(t * 6) * .2; rr(-7, -27, 14, 9, 3, '#ff9a3c'); ctx.globalAlpha = 1;
  poly([-50, -44, 50, -44, 34, -80, -34, -80], '#6b4126');
  poly([-46, -48, 46, -48, 32, -78, -32, -78], '#ffffff');
  poly([-46, -48, 46, -48, 40, -54, -40, -54], '#e3eef6');
  rr(18, -100, 13, 26, 2, '#6d6f75'); rr(16, -102, 17, 5, 2, '#55575c');
  smokePuffs(t, 24, -108);
  // Fischgestell
  rr(-38, -30, 3, 30, 1, '#6b4126'); rr(-22, -30, 3, 30, 1, '#6b4126'); rr(-40, -32, 22, 3, 1, '#6b4126');
  for (let i = 0; i < 3; i++) { ell(-35 + i * 6, -22, 2.4, 6, '#d99a4e'); ell(-35 + i * 6, -26, 1.6, 2, '#a8662a'); }
}
function drawStall(t) {
  drawTable(STALL, 'smoked', S.stallCt, true);
  rr(-52, -84, 4, 62, 1, '#7a4b2e'); rr(48, -84, 4, 62, 1, '#7a4b2e');
  for (let i = 0; i < 6; i++) { rr(-57 + i * 19, -96, 19, 14, 0, i % 2 ? '#ffffff' : '#d9434a'); ell(-47.5 + i * 19, -82, 9.5, 4, i % 2 ? '#ffffff' : '#d9434a'); }
  poly([-60, -96, 60, -96, 52, -104, -52, -104], '#b8333b');
  rr(-52, -104, 104, 3, 1, '#ffffff');
}
function drawTent(t) {
  shadow(30, 11);
  poly([-30, 0, 30, 0, 2, -46], '#c9b48a'); poly([2, -46, 30, 0, 8, 0], '#ad976d');
  poly([-9, 0, 9, 0, 0, -24], '#4a3a28');
  poly([-6, -36, 10, -36, 2, -46], '#ffffff');
  rr(0.5, -54, 3, 10, 1, '#7a4b2e');
}
function drawHut(big, t) {
  shadow(38, 13);
  rr(-32, -38, 64, 38, 3, '#9a6338');
  for (let i = 0; i < 4; i++) { rr(-32, -36 + i * 9, 64, 2, 1, 'rgba(0,0,0,.18)'); ell(-32, -32 + i * 9, 3, 3.5, '#c49067'); ell(32, -32 + i * 9, 3, 3.5, '#c49067'); }
  rr(-8, -24, 16, 24, 2, '#5a3820');
  rr(13, -28, 12, 10, 2, '#3a2a1c'); ctx.globalAlpha = .8 + Math.sin(t * 3 + 1) * .15; rr(14.5, -26.5, 9, 7, 1.5, '#ffcf6a'); ctx.globalAlpha = 1;
  poly([-42, -34, 42, -34, 0, -72], '#7a4b2e');
  poly([-38, -38, 38, -38, 0, -70], '#ffffff');
  if (big) {
    rr(-26, -78, 11, 24, 2, '#8d939b'); smokePuffs(t * .8, -20, -84, 2);
    rr(26, -96, 2, 30, 1, '#6b4126'); poly([28, -96, 44, -91, 28, -86], '#d9434a');
  }
}
function drawStore(t) {
  shadow(46, 16);
  rr(-42, -50, 84, 50, 3, '#a8693c');
  for (let i = 0; i < 6; i++) rr(-40 + i * 14, -50, 2, 50, 1, 'rgba(0,0,0,.14)');
  rr(-15, -36, 30, 36, 2, '#6b4126');
  ctx.strokeStyle = '#4a2e1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-15, -36); ctx.lineTo(15, 0); ctx.moveTo(15, -36); ctx.lineTo(-15, 0); ctx.stroke();
  poly([-50, -48, 50, -48, 38, -80, -38, -80], '#5d6b78');
  poly([-46, -52, 46, -52, 36, -78, -36, -78], '#ffffff');
  rr(44, -18, 16, 16, 2, '#c98a52'); rr(44, -18, 16, 3, 1, '#e3a96d');
  if (S.lv.store >= 2) { rr(-60, -18, 16, 16, 2, '#c98a52'); rr(-60, -34, 16, 16, 2, '#b8793f'); rr(46, -34, 12, 14, 2, '#b8793f'); }
}
function drawBrazier(t, lit) {
  shadow(28, 10);
  ell(0, -4, 25, 10, '#6d7178'); rr(-23, -20, 46, 16, 7, '#80858d'); ell(0, -20, 23, 9, '#5a5e65');
  for (let i = 0; i < 6; i++) ell(-18 + i * 7.2, -12, 3.5, 3, 'rgba(0,0,0,.12)');
  if (!lit) { rr(-12, -24, 24, 5, 2, '#7a4b2e'); rr(-8, -26, 16, 4, 2, '#8b5a33'); return; }
  ell(0, -21, 18, 6.5, '#ff8c1a');
  const fh = 30 + Math.sin(t * 11) * 4;
  poly([-14, -21, -5, -21 - fh * .7 + Math.sin(t * 13) * 3, 0, -21 - fh, 5, -21 - fh * .8, 14, -21], '#ff8a1c');
  poly([-8, -21, -2, -21 - fh * .55, 4, -21 - fh * .62, 8, -21], '#ffd23f');
}
function drawStone(s) {
  if (s.stump) { ell(0, -2, 14 * s.s, 6 * s.s, '#a3a9b0'); ell(-4, -3, 6, 2.5, '#c3c8cd'); return; }
  ctx.scale(s.s, s.s);
  if (s.shake > 0) ctx.translate(Math.sin(s.shake * 70) * 2, 0);
  shadow(24, 9);
  ell(0, -13, 25, 16, '#868d95'); ell(-4, -17, 19, 12, '#a3aab1'); ell(-8, -22, 10, 6, '#bfc5ca');
  ell(-2, -27, 13, 4.5, '#ffffff');
  if (s.hp < s.max) screenHp(s, 44, s.hp / s.max, '#ffcf4d');
}
function drawCrystal(c, t) {
  if (c.stump) { ell(0, -2, 20, 8, '#bcd9ea'); poly([-6, -2, -3, -8, 2, -2], '#c9733c'); poly([3, -2, 6, -6, 8, -2], '#c9733c'); return; }
  if (c.shake > 0) ctx.translate(Math.sin(c.shake * 70) * 2, 0);
  shadow(26, 9);
  ell(0, -3, 27, 10, '#d8ecf7');
  ctx.globalAlpha = .3 + .15 * Math.sin(t * 3 + c.x); ell(0, -26, 30, 26, '#ffb35c'); ctx.globalAlpha = 1;
  for (const [cx, h, w, a] of [[-13, 30, 7, -.3], [12, 34, 7, .3], [0, 46, 9, 0], [6, 22, 5, .6]]) {
    ctx.save(); ctx.translate(cx, -4); ctx.rotate(a);
    poly([-w, 0, -w * .7, -h * .8, 0, -h, w * .7, -h * .8, w, 0], '#e0601c');
    poly([0, 0, 0, -h, w * .7, -h * .8, w, 0], '#ffa64a');
    poly([-w * .3, -h * .3, 0, -h * .9, w * .2, -h * .4], '#ffe1a8');
    ctx.restore();
  }
  if (c.flash > 0) { ctx.globalAlpha = .4; ell(0, -22, 28, 26, '#ffffff'); ctx.globalAlpha = 1; }
  if (c.hp < c.max) screenHp(c, 62, c.hp / c.max, '#ffb35c');
}
function drawHoles(t) { // auf dem Boden (groundT)
  for (const h of holes) {
    if (!onScreen(h.x, h.y, 60)) continue;
    ell(h.x, h.y, 27, 27, '#eef8fd');
    ell(h.x, h.y, 20, 20, '#1f5f8b'); ell(h.x - 3, h.y - 3, 14, 14, '#2f7fb0');
    if (h.cd > 0) {
      const k = Math.min(1, h.cd / 1.5);
      ctx.globalAlpha = .9 * k; ell(h.x, h.y, 20, 20, '#e2f1fa');
      ctx.strokeStyle = '#a9cde3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(h.x - 12, h.y - 4); ctx.lineTo(h.x, h.y + 2); ctx.lineTo(h.x + 10, h.y - 6); ctx.moveTo(h.x, h.y + 2); ctx.lineTo(h.x + 3, h.y + 13); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (S.own.lake) {
      // Blubbern: hier beißt was
      for (let i = 0; i < 3; i++) { const k = (t * .8 + i / 3 + h.bob) % 1; ctx.globalAlpha = 1 - k; ell(h.x + Math.sin(h.bob + i * 2) * 8, h.y + Math.cos(h.bob + i) * 6, 2 + k * 4, 2 + k * 4, '#bfe6ff'); }
      ctx.globalAlpha = 1;
    }
    const pr = Math.max(h.t / fishT(), h.np);
    if (pr > 0) {
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(h.x, h.y, 33, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(h.x, h.y, 33, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, pr)); ctx.stroke();
    }
  }
}
const NPC_COL = { hunter: '#c7553a', lumber: '#6a8f3a', server: '#e0a133', fisher: '#3f7fa8', seller: '#c06a92' };
// Angel: Rute vom Angler, Schnur mit Pose zum Eisloch
function fishLine(x, y, z, h, t) {
  const m = ctx.getTransform(); screenT();
  const a = P(x, y, z), tip = P(x + (h.x - x) * .35, y + (h.y - y) * .35, z + 28), b = P(h.x, h.y, 2 + Math.sin(t * 9) * 1.5);
  ctx.strokeStyle = '#6b4126'; ctx.lineWidth = 2.5 * Z; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1 * Z; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo(tip[0], b[1], b[0], b[1]); ctx.stroke();
  ell(b[0], b[1], 3.2 * Z, 3.2 * Z, '#e8413c'); ell(b[0], b[1] - 1.5 * Z, 3.2 * Z, 1.6 * Z, '#ffffff');
  ctx.setTransform(m);
}
function drawTable(ct, type, count, built) {
  if (!built) return;
  shadow(56, 12);
  rr(-48, -16, 6, 16, 1, '#8b5a33'); rr(42, -16, 6, 16, 1, '#8b5a33');
  rr(-52, -24, 104, 10, 3, '#c98a52'); rr(-52, -26, 104, 6, 3, '#e3a96d');
  if (count > 0) {
    const n = Math.min(count, 40), cols = 4;
    for (let c = 0; c < cols; c++) { const h = Math.floor(n / cols) + (c < n % cols ? 1 : 0); for (let i = 0; i < h; i++) { ctx.save(); ctx.translate(-33 + c * 22, -26 - i * 5); drawItem(type); ctx.restore(); } }
  }
}
function treeSprite(sc) {
  const b = Math.round(sc * 10) / 10;
  blit(sprite('t' + b, 56 * b, 92 * b, 28 * b, 80 * b, () => drawTree({ hp: 1, max: 1 }, b, true)));
}
function drawPost(p) {
  shadow(6, 3);
  rr(-3, -p.h, 6, p.h, 1.5, '#ead6bd'); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0.5, -p.h, 2.5, p.h);
  poly([-3, -p.h, 0, -p.h - 5, 3, -p.h], '#f6e8d6');
}
// Tor als echte senkrechte Fläche zwischen den Endpunkten (funktioniert in jeder Richtung)
function drawGate(s, open) {
  const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
  return () => {
    screenT();
    const q = (x, y, z) => P(x, y, z), quad = (z0, z1, col) => {
      const a = q(s.x1, s.y1, z0), b = q(s.x2, s.y2, z0), c = q(s.x2, s.y2, z1), d = q(s.x1, s.y1, z1);
      poly([a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]], col);
    };
    if (!open) {
      // rote Pfahl-Sperre: sieht in jeder Richtung (auch längs der Blickachse) wie ein Tor aus
      const L = dist(s.x1, s.y1, s.x2, s.y2), n = Math.max(2, Math.round(L / 13)), ks = [];
      for (let i = 0; i <= n; i++) ks.push(i / n);
      ks.sort((a, b) => (s.y2 - s.y1) * (a - b));
      for (const k of ks) { at(lerp(s.x1, s.x2, k), lerp(s.y1, s.y2, k)); rr(-5, -32, 10, 32, 2, '#b8333b'); poly([-5, -32, 0, -39, 5, -32], '#d94a4f'); rr(-5, -24, 10, 3, 1, 'rgba(0,0,0,.18)'); }
      screenT(); quad(12, 17, '#8a2228'); quad(25, 29, '#8a2228');
      // Schloss
      at(mx, my, 0);
      rr(-11, -50, 22, 18, 4, '#9ea6ae'); ctx.strokeStyle = '#9ea6ae'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -50, 7, Math.PI, 0); ctx.stroke(); ell(0, -42, 2.5, 2.5, '#555');
    } else {
      for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) { at(x, y); rr(-4, -36, 8, 36, 2, '#b8333b'); rr(-4, -36, 8, 5, 2, '#d94a4f'); }
    }
  };
}
function screenHp(o, zTop, frac, col = '#ff5050') {
  const m = ctx.getTransform();
  screenT();
  const p = P(o.x, o.y, zTop), w = 34;
  rr(p[0] - w / 2 - 1, p[1] - 1, w + 2, 6, 3, 'rgba(0,0,0,.45)'); rr(p[0] - w / 2, p[1], w * clamp(frac, 0, 1), 4, 2, col);
  ctx.setTransform(m);
}
