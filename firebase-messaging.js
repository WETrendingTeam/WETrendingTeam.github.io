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

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const messaging = getMessaging(app);
const auth = getAuth(app);
const db = getFirestore(app);

const VAPID_KEY =
    "BAw-ZA0fgoyK9bcUVcbZOeI_0oRNJZBtSkxRcPDJGba3nXRdo27FV4L0qHTZd_K7z_RE3qCToyK34gwMivNNBdE";

export async function requestNotificationPermission() {

    try {

        if (!("Notification" in window)) {
            alert("This browser/device does not support notifications.");
            return false;
        }

        if (!("serviceWorker" in navigator)) {
            alert("This browser does not support service workers.");
            return false;
        }

        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            alert("Notification permission was not granted.");
            return false;
        }

        // The Firestore rules require an authenticated UID for token creation.
        // Anonymous Auth lets normal Hub visitors subscribe without a login form.
        if (!auth.currentUser) {
            await signInAnonymously(auth);
        }

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Firebase could not create a subscriber identity.");
        }

        const registration =
            await navigator.serviceWorker.register(
                "./firebase-messaging-sw.js",
                { scope: "./" }
            );

        await navigator.serviceWorker.ready;

        const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        });

        if (!token) {
            throw new Error("No Firebase Cloud Messaging token was returned.");
        }

        console.log("FCM Token:", token);

        await setDoc(
            doc(db, "fcmTokens", token),
            {
                token,
                uid: user.uid,
                updatedAt: serverTimestamp(),
                platform: navigator.platform || "unknown",
                userAgent: navigator.userAgent
            },
            { merge: true }
        );

        console.log("FCM token saved to Firestore.");

        alert("✅ WETrendingTeam notifications are now enabled on this device.");
        return true;

    } catch (error) {

        console.error("Firebase Messaging Error:", error);

        if (error?.code === "auth/operation-not-allowed") {
            alert("Firebase Anonymous Authentication is not enabled yet. Enable Anonymous sign-in in Firebase Authentication, then try again.");
        } else {
            alert("Firebase notification error: " + error.message);
        }

        return false;
    }
}

// Receive notifications while the Hub is open.
onMessage(messaging, (payload) => {

    console.log("Foreground notification:", payload);

    const title =
        payload.notification?.title ||
        payload.data?.title ||
        "WETrendingTeam";

    const body =
        payload.notification?.body ||
        payload.data?.body ||
        "New notification from WETrendingTeam.";

    if (Notification.permission === "granted") {
        new Notification(title, {
            body,
            icon: "./images/logo.png"
        });
    }
});
