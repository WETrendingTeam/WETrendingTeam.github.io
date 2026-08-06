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


// Firebase Messaging
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"
);


firebase.initializeApp({
  apiKey: "AIzaSyDY5F84tiRyDLNPBaBGpO5giwxlJ4q27Cg",
  authDomain: "wetrendingteam-1f8ce.firebaseapp.com",
  projectId: "wetrendingteam-1f8ce",
  storageBucket: "wetrendingteam-1f8ce.firebasestorage.app",
  messagingSenderId: "1072737815830",
  appId: "1:1072737815830:web:4fce8aa6e88680404e1437"
});


const messaging = firebase.messaging();


messaging.onBackgroundMessage((payload) => {

  console.log(
    "Background message received:",
    payload
  );


  const notificationTitle =
    payload.notification.title;


  const notificationOptions = {
    body: payload.notification.body,
    icon: "/images/logo.png"
  };


  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );

});

