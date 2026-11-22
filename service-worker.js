/* Hihi Digitizing - service worker (offline support + fast loading)
   Bump VERSION whenever you change CSS/JS/HTML so users get the new files. */
const VERSION = "hihi-v3";
const CORE = [
  "index.html", "about.html", "service.html", "blog.html", "contact.html", "offline.html",
  "css/style.css", "css/bootstrap.min.css", "css/chatbot.css", "css/app.css",
  "js/main.js", "js/chatbot.js", "js/app.js",
  "icons/icon-192.png", "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      Promise.all(CORE.map((u) => c.add(u).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.hostname === "wa.me" || url.hostname.endsWith("workers.dev")) return; // never cache chat/AI/WhatsApp

  // Pages: network first, fall back to cache, then offline page
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("offline.html")))
    );
    return;
  }

  // Everything else (css, js, images, fonts, CDN libs): serve cache instantly, refresh in background
  e.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(req).then((cached) => {
        const net = fetch(req).then((res) => {
          if (res && (res.status === 200 || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    )
  );
});
