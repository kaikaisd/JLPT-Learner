// JLPT Trainer service worker — precaches the entire app (shell + data) so it
// works fully offline. Bump VERSION whenever any shipped file changes.
const VERSION = 'v2';
const CACHE = `jlpt-trainer-${VERSION}`;

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1'];
const DATA_FILES = LEVELS.flatMap((l) => [
  `data/vocab-${l}.json`,
  `data/grammar-${l}.json`,
  `data/reading-${l}.json`,
  `data/listening-${l}.json`,
]);

const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/app.js',
  'js/ui.js',
  'js/data.js',
  'js/store.js',
  'js/tts.js',
  'js/progress.js',
  'js/views/home.js',
  'js/views/level.js',
  'js/views/vocab.js',
  'js/views/grammar.js',
  'js/views/reading.js',
  'js/views/listening.js',
  'js/views/settings.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'data/index.json',
  ...DATA_FILES,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache-first: everything the app needs is precached; the network is only a
// fallback (and refreshes the cache when reachable).
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return res;
      }).catch(() => {
        // Offline and not cached: for navigations, serve the app shell.
        if (request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    }),
  );
});
