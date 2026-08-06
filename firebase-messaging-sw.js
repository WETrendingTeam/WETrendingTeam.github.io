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