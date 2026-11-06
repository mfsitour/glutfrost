'use strict';
// Glutfrost – Eingabe und Effekte
// =====================================================================
//  EINGABE
// =====================================================================
const joy = { on: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = 1; if (e.key === 'Escape') toggleMenu(); });
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = 0; });
cv.addEventListener('pointerdown', e => {
  if (joy.on) return;
  joy.on = true; joy.id = e.pointerId; joy.ox = joy.x = e.clientX; joy.oy = joy.y = e.clientY;
  try { cv.setPointerCapture(e.pointerId); } catch (_) { }
  if (AC && AC.state === 'suspended') AC.resume();
});
cv.addEventListener('pointermove', e => { if (joy.on && e.pointerId === joy.id) { joy.x = e.clientX; joy.y = e.clientY; } });
const endJoy = e => { if (e.pointerId === joy.id) { joy.on = false; joy.id = null; } };
addEventListener('blur', () => { joy.on = false; for (const k in keys) keys[k] = 0; });
cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
function inputVec() {
  let x = 0, y = 0;
  if (keys['a'] || keys['arrowleft']) x -= 1; if (keys['d'] || keys['arrowright']) x += 1;
  if (keys['w'] || keys['arrowup']) y -= 1; if (keys['s'] || keys['arrowdown']) y += 1;
  if (x || y) { const l = Math.hypot(x, y); return [x / l, y / l]; }
  if (joy.on) {
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy), R = 55;
    if (l < 6) return [0, 0];
    const m = Math.min(1, l / R); return [dx / l * m, dy / l * m];
  }
  return [0, 0];
}

// =====================================================================
//  EFFEKTE
// =====================================================================
function fly(type, x0, y0, z0, tx, ty, tz, dur, cb) { flyers.push({ type, x0, y0, z0, tx, ty, tz, t: 0, dur, cb }); }
function burst(x, y, z, col, n, sp = 140, size = 4) {
  for (let i = 0; i < n; i++) parts.push({ x, y, z, vx: rand(-sp, sp), vy: rand(-sp, sp) * .7, vz: rand(60, 260), life: rand(.4, .8), max: .8, col, size: rand(size * .6, size * 1.3) });
}
function ftext(x, y, z, s, col = '#fff', size = 18) { texts.push({ x, y, z, s, col, size, life: 1.1 }); }
function spawnDrops(type, n, x, y, v = 1) {
  for (let i = 0; i < n; i++) drops.push({ type, v, x, y, z: 18, vx: rand(-110, 110), vy: rand(-100, 100), vz: rand(160, 260), age: 0 });
}
