self.addEventListener("install", event => { event.waitUntil(caches.open("ai-morning-v1").then(cache => cache.addAll(["./", "./index.html", "./styles.css", "./app.js", "./manifest.webmanifest"]))); self.skipWaiting(); });
self.addEventListener("fetch", event => { event.respondWith(caches.match(event.request).then(found => found || fetch(event.request))); });
