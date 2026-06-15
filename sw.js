/* LGNS Rates PWA service worker — 앱 셸 캐시(설치형 PWA 조건) + network-first. 외부 RPC는 통과(캐시 안 함). */
const CACHE = 'lgns-rates-shell-v1';
const SHELL = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((u) => c.add(u)));
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 같은 출처(앱 셸)만 network-first→cache 폴백. 외부 RPC/API는 그대로 통과.
  if (url.origin === location.origin && e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
    );
  }
});
