const SHELL_CACHE = "psychology-money-reader-shell-v11";
const BOOK_CACHE = "psychology-money-reader-book-v6";
const CORE = ["/", "/v10", "/publications.json", "/book/v5/manifest.json", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png"];

async function cacheResponse(cache, request) {
  try {
    const response = await fetch(request, { cache: "reload" });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return null;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const page = await cacheResponse(cache, "/");
    await Promise.all(CORE.slice(1).map((url) => cacheResponse(cache, url)));
    if (page) {
      const html = await page.clone().text();
      const assets = [...html.matchAll(/(?:src|href)=["'](\/[^"'#?]+)["']/g)]
        .map((match) => match[1])
        .filter((url, index, all) => all.indexOf(url) === index);
      await Promise.all(assets.map((url) => cacheResponse(cache, url)));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("psychology-money-reader-shell-") && name !== SHELL_CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function notify(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  clients.forEach((client) => client.postMessage(message));
}

self.addEventListener("message", (event) => {
  if (event.data?.type !== "WARM_BOOK" || !Array.isArray(event.data.urls)) return;
  const urls = [...new Set(event.data.urls)];
  event.waitUntil((async () => {
    const cache = await caches.open(BOOK_CACHE);
    let done = 0;
    for (const url of urls) {
      if (await cache.match(url)) done += 1;
      else if (await cacheResponse(cache, url)) done += 1;
      await notify({ type: "CACHE_PROGRESS", done, total: urls.length });
    }
    if (done === urls.length) {
      await notify({ type: "CACHE_COMPLETE", total: urls.length });
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith("psychology-money-reader-") && name !== SHELL_CACHE && name !== BOOK_CACHE).map((name) => caches.delete(name)));
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const book = await caches.open(BOOK_CACHE);
    if (url.pathname.startsWith("/book/")) {
      const cachedBook = await book.match(request);
      if (cachedBook) return cachedBook;
      const response = await fetch(request);
      if (response.ok) await book.put(request, response.clone());
      return response;
    }
    if (request.mode === "navigate") {
      const route = url.pathname.replace(/\/$/, "") === "/v10" ? "/v10" : "/";
      try {
        const response = await fetch(request, { cache: "reload" });
        if (response.ok) await shell.put(route, response.clone());
        return response;
      } catch {
        return await shell.match(route) || await shell.match("/") || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }
    const cached = await shell.match(request, { ignoreSearch: false });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await shell.put(request, response.clone());
      return response;
    } catch {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
