const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification = functions.firestore
 .document("notifications/{notificationId}")
 .onCreate(async (snap) => {
 const data = snap.data();

 const title = data.title || "WETrendingTeam";
 const body = data.body || data.message || "";

 // Get all registered device tokens
 const tokensSnapshot = await admin
 .firestore()
 .collection("fcmTokens")
 .get();

 const tokens = tokensSnapshot.docs
 .map(doc => doc.data().token)
 .filter(Boolean);

 if (tokens.length === 0) {
 console.log("No device tokens found.");
 return null;
 }

 const message = {
 notification: {
 title,
 body
 },
 tokens
 };

 const response = await admin.messaging().sendEachForMulticast(message);

 console.log(
 `Notifications sent: ${response.successCount}, failed: ${response.failureCount}`
 );

 return null;
 });