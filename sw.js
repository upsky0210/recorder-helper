/* 直笛小幫手 service worker：第一次載入後把全部檔案存起來，之後沒網路也能用。
   有網路時先抓新的（老師更新後馬上看得到），抓不到再用存起來的。改檔案時：index.html、js/*.js、data/fingerings.js 裡的 ?v= 一起加 1，這裡的 FILES 和 VERSION 也跟著改。 */
const VERSION = 'rh-v3';
const FILES = [
  './', 'index.html', 'css/style.css?v=3', 'js/app.js?v=3', 'js/music.js?v=3', 'js/audio.js?v=3', 'js/store.js?v=3', 'data/fingerings.js?v=3',
  'vendor/lamejs/lame.min.js?v=1.2.1', 'vendor/abcjs/abcjs-basic-min.js?v=6.4.4', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: false }).then((r) => r || caches.match(req, { ignoreSearch: true })).then((r) => r || caches.match('index.html')))
  );
});
