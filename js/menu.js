'use strict';
// Glutfrost – Menü, Offline-Einnahmen, Service Worker
// =====================================================================
//  MENÜ
// =====================================================================
let paused = false;
const $ = id => document.getElementById(id);
function show(id, on) { $(id).classList.toggle('hidden', !on); paused = ['menu', 'help', 'confirm', 'offline', 'diary', 'chapter', 'credits', 'ngConfirm'].some(k => !$(k).classList.contains('hidden')); }
function toggleMenu() { show('menu', $('menu').classList.contains('hidden')); }
$('menuBtn').onclick = () => show('menu', true);
$('bResume').onclick = () => show('menu', false);
$('bHelp').onclick = () => { show('menu', false); show('help', true); };
$('bHelpOk').onclick = () => { show('help', false); S.helpSeen = 1; save(); };
$('bMute').onclick = () => { S.muted = S.muted ? 0 : 1; $('bMute').textContent = 'Ton: ' + (S.muted ? 'aus' : 'an'); save(); };
$('bMute').textContent = 'Ton: ' + (S.muted ? 'aus' : 'an');
$('bMusic').onclick = () => { S.music = S.music ? 0 : 1; $('bMusic').textContent = 'Musik: ' + (S.music ? 'an' : 'aus'); save(); };
$('bMusic').textContent = 'Musik: ' + (S.music ? 'an' : 'aus');
$('bReset').onclick = () => { show('menu', false); show('confirm', true); };
$('bNo').onclick = () => show('confirm', false);
// Beta: leeren Spielstand hinterlegen, sonst würde beim Neuladen wieder der echte Spielstand kopiert
$('bYes').onclick = () => { resetting = true; if (BETA) localStorage.setItem(KEY, '{}'); else localStorage.removeItem(KEY); location.reload(); };
if (!S.helpSeen) show('help', true);
// ---------- Offline-Einnahmen der Helfer ----------
function offlineRate() {
  let r = 0;
  if (S.own.server) {
    const meat = (S.own.tower ? .2 : 0) + .6 * S.lv.hunter;
    const coal = S.own.lumber && S.own.kiln && S.own.coalCt ? .55 : 0;
    r += meat * meatPrice() + coal * (2 + S.lv.furnace);
  }
  if (S.own.fisher && S.own.seller && S.own.stall) r += .5 * fishPrice();
  return r * priceMul();
}
let offlineGain = 0;
function checkOffline() {
  if (!S.lastSeen || resetting) return;
  const sec = Math.min(7200, (Date.now() - S.lastSeen) / 1000);
  const gain = Math.floor(offlineRate() * sec * .15);
  S.lastSeen = Date.now();
  if (sec < 60 || gain < 5) return;
  offlineGain = gain;
  const min = Math.round(sec / 60);
  $('offTxt').innerHTML = `Deine Helfer haben in ${min >= 120 ? '2 Stunden (Maximum)' : min + ' Minuten'} <b>${gain} $</b> verdient.`;
  show('offline', true);
}
$('bOff').onclick = () => {
  S.cash += offlineGain; ftext(player.x, player.y, 80, '+' + offlineGain + ' $', '#7cff9a', 22); snd('buy'); buzz([25, 40, 25]);
  offlineGain = 0; show('offline', false); save();
};
if (S.helpSeen) checkOffline();
addEventListener('visibilitychange', () => { if (document.hidden) save(); else checkOffline(); });
addEventListener('pagehide', save);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
