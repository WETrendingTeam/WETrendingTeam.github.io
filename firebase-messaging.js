import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { app } from "./firebase-config.js";

const messaging = getMessaging(app);

export async function requestNotificationPermission() {
alert("Button connected");
  const permission = await Notification.requestPermission();

  if (permission === "granted") {

    console.log("Notification permission granted");

    const token = await getToken(messaging, {
      vapidKey: "BAw-ZA0fgoyK9bcUVcbZOeI_0oRNJZBtSkxRcPDJGba3nXRdo27FV4L0qHTZd_K7z_RE3qCToyK34gwMivNNBdE"
    });

    console.log("FCM Token:", token);

  } else {

    console.log("Notification permission denied");

  }

}


onMessage(messaging, (payload) => {

  console.log("New notification:", payload);

});
