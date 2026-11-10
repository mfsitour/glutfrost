// Service Worker: macht Glutfrost offline spielbar.
// Bei jeder Änderung am Spiel VERSION erhöhen, damit Geräte die neue Fassung laden.
// Neue Dateien müssen in FILES eingetragen werden, sonst fehlen sie offline.
const BETA = self.registration.scope.includes('/beta/');
const PREFIX = BETA ? 'glutfrost-beta-' : 'glutfrost-';
const VERSION = PREFIX + 'v9';
const FILES = [
  './', 'index.html', 'manifest.json',
  'js/core.js', 'js/state.js', 'js/world.js', 'js/entities.js', 'js/input.js', 'js/logic.js', 'js/hint.js',
  'js/draw-objects.js', 'js/draw-scene.js', 'js/menu.js', 'js/story.js', 'js/meta.js', 'js/ch3.js', 'js/kit.js', 'js/gear.js', 'js/ch4.js', 'js/ch5.js', 'js/ch6.js', 'js/endgame.js', 'js/hero.js', 'js/main.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
];
// Nur eigene alte Caches löschen: Live und Beta teilen sich die Domain
const mine = k => k.startsWith(PREFIX) && (BETA || !k.startsWith('glutfrost-beta-'));

self.addEventListener('install', e => {
  // cache: 'reload' – nicht die (bis zu 10 Min. alte) Browser-Kopie übernehmen, sondern frisch vom Server
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => mine(k) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Netzwerk zuerst und immer beim Server nachfragen (no-cache), damit Updates sofort ankommen;
// ohne Netz aus dem Offline-Cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(new Request(e.request, { cache: 'no-cache' })).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.open(VERSION).then(c => c.match(e.request, { ignoreSearch: true })))
  );
});
