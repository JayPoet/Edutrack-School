/* EduTrack service worker: offline app shell. Change CACHE when you publish a new version. */
const CACHE = 'edutrackpro-v2';
const SHELL = ['./', 'index.html', 'manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Only handle our own site's GET requests. Firebase, Google and CDN traffic goes straight to the network.
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Network first, so users always get the latest version; fall back to the saved copy when offline.
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
