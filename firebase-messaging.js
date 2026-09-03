// ==========================================
// WETrendingTeam Notifications
// Automatic FCM registration + token refresh
// ==========================================

import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { app, db } from "./firebase-config.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const messaging = getMessaging(app);
const auth = getAuth(app);

const VAPID_KEY = "BAw-ZA0fgoyK9bcUVcbZOeI_0oRNJZBtSkxRcPDJGba3nXRdo27FV4L0qHTZd_K7z_RE3qCToyK34gwMivNNBdE";

export async function checkPushStatus() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

async function saveCurrentToken(token, uid) {
  // The token is also the Firestore document ID, so refreshing the token
  // updates the existing record instead of creating duplicate subscriber rows.
  await setDoc(
    doc(db, "fcmTokens", token),
    {
      token,
      uid,
      updatedAt: serverTimestamp(),
      platform: navigator.platform || "unknown",
      userAgent: navigator.userAgent,
      subscriptions: { team: true }
    },
    { merge: true }
  );
}

export async function refreshNotificationSubscription({ showAlert = false } = {}) {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
    if (Notification.permission !== "granted") return false;

    if (!auth.currentUser) await signInAnonymously(auth);
    const user = auth.currentUser;
    if (!user) throw new Error("Firebase could not create a subscriber identity.");

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;

    // getToken() returns the current FCM token and handles token rotation.
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) throw new Error("Firebase did not return an FCM registration token.");

    await saveCurrentToken(token, user.uid);

    console.log("FCM subscription refreshed:", token);
    if (showAlert) alert("WETrendingTeam notifications are now enabled on this device.");
    return true;
  } catch (error) {
    console.error("FCM subscription refresh error:", error);
    if (showAlert) {
      if (error?.code === "auth/operation-not-allowed") {
        alert("Anonymous Authentication is not enabled in Firebase.");
      } else if (error?.code === "messaging/permission-blocked") {
        alert("Notifications are blocked for this site. Please allow them in your browser settings.");
      } else {
        alert("Firebase notification error: " + (error?.message || "Unknown error."));
      }
    }
    return false;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("This browser/device does not support notifications.");
    return false;
  }

  let permission = Notification.permission;
  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    alert("Notification permission was not granted.");
    return false;
  }

  return refreshNotificationSubscription({ showAlert: true });
}

// IMPORTANT: existing users do not need to press the button again.
// If permission is already granted, refresh the current token automatically
// whenever this script is loaded.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    refreshNotificationSubscription({ showAlert: false });
  });
}

onMessage(messaging, (payload) => {
  console.log("Foreground notification received:", payload);

  const title = payload.notification?.title || payload.data?.title || "WETrendingTeam";
  const body = payload.notification?.body || payload.data?.body || "New notification from WETrendingTeam.";

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "./images/brand/logo.png"
    });
  }
});
