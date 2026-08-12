/*
 * WETrending SPACE Service Worker
 * --------------------------------
 * FCM is intentionally NOT activated in this version.
 * On the PC setup step we will add the Firebase Messaging SDK,
 * Firebase project configuration, and background-message handler here.
 */

const CACHE_NAME = "wetrending-space-v2";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

/*
 * Do not add a fetch cache yet.
 * The existing app loads campaign data dynamically from Google Sheets,
 * so aggressive caching could serve stale campaign content.
 */
