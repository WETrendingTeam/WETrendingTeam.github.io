const CACHE_NAME = "wetrending-v1";

const filesToCache = [
  "./",
  "./index.html",
  "./campaign.html",
  "./trend.html",
  "./hub.css",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  );
});
