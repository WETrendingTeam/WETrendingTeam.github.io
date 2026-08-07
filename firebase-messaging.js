// ==========================================
// WETrendingTeam Notifications
// firebase-messaging.js
// ==========================================

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

import { app } from "./firebase-config.js";

const messaging = getMessaging(app);

export async function requestNotificationPermission() {

  try {

    // Check browser support

    if (!("Notification" in window)) {

      alert("This browser/device does not support notifications.");
      return;

    }

    // Ask permission

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {

      alert("Notification permission was not granted.");
      return;

    }

    // Register Service Worker

    const registration =
      await navigator.serviceWorker.register(
        "./firebase-messaging-sw.js"
      );

    // Get Firebase Cloud Messaging Token

    const token = await getToken(messaging, {

      vapidKey:
      "BAw-ZA0fgoyK9bcUVcbZOeI_0oRNJZBtSkxRcPDJGba3nXRdo27FV4L0qHTZd_K7z_RE3qCToyK34gwMivNNBdE",

      serviceWorkerRegistration: registration

    });

    if (token) {

      alert(
        "Device connected to WETrendingTeam notifications."
      );

      console.log(
        "FCM Token:",
        token
      );

    } else {

      alert(
        "No Firebase token was returned."
      );

    }

  } catch (error) {

    console.error(
      "Firebase Messaging Error:",
      error
    );

    alert(
      "Firebase error: " + error.message
    );

  }

}

// Receive notifications while website is open

onMessage(messaging, (payload) => {

  console.log(
    "Foreground notification:",
    payload
  );

  if (payload.notification) {

    new Notification(

      payload.notification.title,

      {

        body:
        payload.notification.body,

        icon:
        "./images/logo.png"

      }

    );

  }

});