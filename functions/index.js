const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

const APP_BASE_URL = "https://comfy-starburst-5f9eb9.netlify.app";

const AUTHORIZED_SENDERS = new Set([
  "wetrendingteam@gmail.com",
  "lade.galleria@gmail.com"
]);

function chunks(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

exports.sendNotification = onRequest(
  { region: "us-central1", cors: true },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ message: "POST required." });

    try {
      const header = req.get("Authorization") || "";
      if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const decoded = await getAuth().verifyIdToken(header.substring(7));
      const senderEmail = String(decoded.email || "").trim().toLowerCase();

      if (!AUTHORIZED_SENDERS.has(senderEmail)) {
        return res.status(403).json({ message: "This account is not authorized to send notifications." });
      }

      const title = String(req.body?.title || "").trim();
      const message = String(req.body?.message || "").trim();
      const type = String(req.body?.type || "general").trim().toLowerCase();
      const campaignName = String(req.body?.campaignName || "").trim();
      const rawUrl = String(req.body?.url || "").trim();
      const url = rawUrl ? (rawUrl.startsWith("http") ? rawUrl : `${APP_BASE_URL}/${rawUrl.replace(/^\//, "")}`) : `${APP_BASE_URL}/`;

      if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
      if (!["general", "campaign", "intent"].includes(type)) {
        return res.status(400).json({ message: "Invalid notification type." });
      }
      if (type === "campaign" && !campaignName) {
        return res.status(400).json({ message: "Campaign name is required." });
      }
      if (type === "intent" && !rawUrl) {
        return res.status(400).json({ message: "Intent destination URL is required." });
      }

      const notificationRef = await db.collection("notifications").add({
        title,
        message,
        type,
        campaignName: campaignName || null,
        url,
        sender: decoded.email || decoded.uid,
        createdAt: FieldValue.serverTimestamp()
      });

      const tokenSnap = await db.collection("fcmTokens").get();
      const tokens = [...new Set(tokenSnap.docs.map(d => d.data().token).filter(Boolean))];

      let sent = 0;
      let failed = 0;

      for (const batch of chunks(tokens, 500)) {
        const response = await getMessaging().sendEachForMulticast({
          tokens: batch,
          notification: { title, body: message },
          data: {
            title,
            body: message,
            type,
            url,
            notificationId: notificationRef.id
          },
          webpush: {
            notification: {
              title,
              body: message,
              icon: "/images/logo.png",
              badge: "/images/logo.png"
            },
            fcmOptions: { link: url }
          }
        });
        sent += response.successCount;
        failed += response.failureCount;
      }

      return res.status(200).json({ sent, failed, notificationId: notificationRef.id, type });
    } catch (error) {
      console.error("sendNotification error:", error);
      return res.status(500).json({ message: error.message || "Notification server error." });
    }
  }
);
