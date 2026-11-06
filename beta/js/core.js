'use strict';
// Glutfrost – Grundlagen: Mathe-Helfer, Canvas, Projektion, Zeichen-Helfer, Sound
// =====================================================================
//  GLUTFROST – ein Idle-Arcade-Survival-Spiel
// =====================================================================
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;

const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
// ---------- Sprite-Cache: statische Grafiken einmal vorrendern ----------
const SPR = {}; let sprK = 0;
function sprite(key, w, h, ox, oy, fn) {
  const k = Z * DPR;
  if (k !== sprK) { for (const q in SPR) delete SPR[q]; sprK = k; }
  let sp = SPR[key];
  if (!sp) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * k)); c.height = Math.max(1, Math.ceil(h * k));
    const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, ox * k, oy * k);
    const old = ctx; ctx = g; try { fn(); } finally { ctx = old; }
    sp = SPR[key] = { c, w, h, ox, oy };
  }
  return sp;
}
function blit(sp) { ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h); }
let W = 0, H = 0, DPR = 1, Z = 1;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  Z = clamp(Math.min(W / 560, H / 860), 0.5, 1.25);
}
addEventListener('resize', resize); resize();

// ---------- Projektion (leicht geneigte Draufsicht) ----------
const TY = 0.78;
let camX = 0, camY = 0;
function setT(a, b, c, d, e, f) { ctx.setTransform(a * DPR, b * DPR, c * DPR, d * DPR, e * DPR, f * DPR); }
let shake = 0, shX = 0, shY = 0;
function P(x, y, z = 0) { return [W / 2 + shX + (x - camX) * Z, H / 2 + shY + ((y - camY) * TY - z) * Z]; }
function at(x, y, z = 0, s = 1) { const p = P(x, y, z); setT(Z * s, 0, 0, Z * s, p[0], p[1]); }
function groundT() { setT(Z, 0, 0, Z * TY, W / 2 + shX - camX * Z, H / 2 + shY - camY * TY * Z); }
function screenT() { setT(1, 0, 0, 1, 0, 0); }
function onScreen(x, y, m = 160) {
  const p = P(x, y);
  return p[0] > -m * Z && p[0] < W + m * Z && p[1] > -m * Z * 2.2 && p[1] < H + m * Z;
}

// ---------- Zeichen-Helfer ----------
function ell(x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, TAU); ctx.fill(); }
function rr(x, y, w, h, r, c) {
  ctx.fillStyle = c; ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  ctx.fill();
}
function poly(pts, c) {
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); ctx.fill();
}
function txt(s, x, y, size, col, align = 'center', stroke = 'rgba(0,0,0,.55)', weight = 800) {
  ctx.font = `${weight} ${size}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = Math.max(2, size / 6); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

// ---------- Sound ----------
let AC = null; const sndLast = {};
const SND = {
  hit: [170, .05, 'square', .035], chop: [260, .05, 'square', .03], coin: [990, .06, 'sine', .045],
  pick: [560, .035, 'triangle', .04], drop: [380, .035, 'triangle', .04], buy: [520, .35, 'sine', .08],
  hurt: [110, .18, 'sawtooth', .05], warn: [240, .5, 'sine', .07], boom: [70, .35, 'sawtooth', .08],
  splash: [620, .16, 'sine', .05], gem: [1320, .09, 'triangle', .04],
};
function snd(k) {
  if (S.muted) return;
  const now = performance.now(); if (sndLast[k] && now - sndLast[k] < 45) return; sndLast[k] = now;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const [f, d, type, v] = SND[k]; const t = AC.currentTime;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (k === 'buy') { o.frequency.setValueAtTime(f, t); o.frequency.setValueAtTime(f * 1.25, t + .1); o.frequency.setValueAtTime(f * 1.5, t + .2); }
    if (k === 'coin') o.frequency.exponentialRampToValueAtTime(f * 1.5, t + d);
    if (k === 'boom' || k === 'hurt' || k === 'splash') o.frequency.exponentialRampToValueAtTime(f * .5, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) { }
}
