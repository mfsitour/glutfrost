'use strict';
// Glutfrost – Spielschleife
// =====================================================================
//  LOOP
// =====================================================================
camX = player.x; camY = player.y - 70 / TY;
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (!paused) update(dt);
  chapterUI();
  draw(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Debug-Zugriff für Tests
window.__g = { S, player, bears, PADS, queues, npcs, holes, crystals, stones, trees, get yeti() { return yeti; }, FIG, toasts };
