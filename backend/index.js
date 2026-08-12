// Legacy backend placeholder.
// Notification delivery is handled only by functions/index.js.
// Keeping a second Firestore onCreate sender here would send every notification twice.
const functions = require("firebase-functions/v1");

exports.sendNotification = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async () => null);
