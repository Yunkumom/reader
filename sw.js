const SHELL_CACHE = "psychology-money-reader-shell-v12";
const BOOK_CACHE = "psychology-money-reader-book-v12";
const CORE = [
  "./",
  "./index.html",
  "./source_materials/publications.json",
  "./source_materials/psychology-money/book-data-v5.js",
  "./source_materials/positive-psychology-progress/ppp-data.js",
  "./source_materials/red-book/red-book-data.js",
  "./manifest.webmanifest",
  "./favicon.svg"
];

async function cacheResponse(cache, request) {
  try {
    const response = await fetch(request, { cache: "reload" });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return null;
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(CORE.map((url) => cacheResponse(cache, url)));
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names.filter((name) => name !== SHELL_CACHE && name !== BOOK_CACHE).map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

async function notify(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => client.postMessage(message));
}

self.addEventListener("fetch", (event) => {
  // Network first strategy for html / js data files, fallback to cache
  if (event.request.mode === 'navigate' || event.request.url.includes('red-book-data.js') || event.request.url.includes('publications.json')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
