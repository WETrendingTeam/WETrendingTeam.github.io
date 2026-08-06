import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { app } from "./firebase-config.js";

const messaging = getMessaging(app);


export async function requestNotificationPermission() {

  try {

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notification permission was not granted.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: "BAw-ZA0fgoyK9bcUVcbZOeI_0oRNJZBtSkxRcPDJGba3nXRdo27FV4L0qHTZd_K7z_RE3qCToyK34gwMivNNBdE"
    });

    if (token) {
      alert("Device connected to WETrendingTeam notifications");
      console.log("FCM Token:", token);
    } else {
      alert("No Firebase token was returned.");
    }

  } catch (error) {

    alert("Firebase error: " + error.message);
    console.error(error);

  }

}



onMessage(messaging, (payload) => {

  console.log("New notification:", payload);

});
