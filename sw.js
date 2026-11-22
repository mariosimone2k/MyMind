/* MyMind service worker: rende l'app disponibile offline. Mette in cache solo i file dell'app, mai i dati. */
const CACHE = 'mymind-v1.3.0';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest',
  'fonts/figtree.woff2', 'fonts/newsreader-500.woff2', 'fonts/newsreader-400-italic.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  'vendor/xlsx.mini.min.js', 'vendor/mammoth.browser.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('index.html'))));
});
