import { app, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONTROL_EMAIL = "lade.galleria@gmail.com";
const ADMIN_EMAIL = "wetrendingteam@gmail.com";
const SEND_NOTIFICATION_URL = "https://us-central1-wetrendingteam-1f8ce.cloudfunctions.net/sendNotification";

const auth = getAuth(app);
const typeInput = document.getElementById("notificationType");
const campaignFields = document.getElementById("campaignFields");
const intentFields = document.getElementById("intentFields");
const titleInput = document.getElementById("notificationTitle");
const messageInput = document.getElementById("notificationMessage");
const campaignInput = document.getElementById("campaignName");
const intentInput = document.getElementById("intentUrl");
const sendButton = document.getElementById("sendNotificationBtn");
const statusBox = document.getElementById("sendStatus");

let currentUser = null;
let authorized = false;

function status(message, error=false) {
  if (statusBox) {
    statusBox.textContent = message;
    statusBox.classList.toggle("error", error);
  }
}

function renderTypeFields() {
  const type = typeInput?.value || "general";
  if (campaignFields) campaignFields.hidden = type !== "campaign";
  if (intentFields) intentFields.hidden = type !== "intent";
}
typeInput?.addEventListener("change", renderTypeFields);
renderTypeFields();

onSnapshot(collection(db, "fcmTokens"), snap => {
  const el = document.getElementById("subscriberLiveCount");
  if (el) el.textContent = String(snap.size);
}, err => console.warn("Subscriber count:", err));

onSnapshot(collection(db, "notifications"), snap => {
  const el = document.getElementById("notificationLiveCount");
  if (el) el.textContent = String(snap.size);
}, err => console.warn("Notification count:", err));

onAuthStateChanged(auth, user => {
  currentUser = user;
  const email = (user?.email || "").trim().toLowerCase();
  authorized = !!user && (email === CONTROL_EMAIL || email === ADMIN_EMAIL);
  if (sendButton) sendButton.disabled = !authorized;
  if (!user) status("Admin/Control Center session required. Please log in first.", true);
  else if (!authorized) status("You are not authorized to send notifications.", true);
  else status("Ready to send a notification.");
});

sendButton?.addEventListener("click", async () => {
  const type = typeInput?.value || "general";
  const title = titleInput?.value.trim();
  const message = messageInput?.value.trim();
  const campaignName = campaignInput?.value.trim();
  const intentUrl = intentInput?.value.trim();

  if (!authorized || !currentUser) return status("Please log in through Control Center or Admin Login.", true);
  if (!title) return status("Please enter a notification title.", true);
  if (!message) return status("Please enter a notification message.", true);
  if (type === "campaign" && !campaignName) return status("Enter the campaign name.", true);
  if (type === "intent" && !intentUrl) return status("Enter the intent/destination link.", true);

  try { new URL(type === "intent" ? intentUrl : "https://wetrendingteam.local"); }
  catch { return status("Please enter a valid destination link.", true); }

  if (!confirm("Send this notification to all subscribed devices?")) return;

  sendButton.disabled = true;
  sendButton.textContent = "⏳ Sending…";
  status("Connecting to the notification server…");

  try {
    const idToken = await currentUser.getIdToken(true);
    const response = await fetch(SEND_NOTIFICATION_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json", "Authorization":`Bearer ${idToken}`},
      body: JSON.stringify({
        title,
        message,
        type,
        campaignName: campaignName || "",
        url: type === "intent" ? intentUrl : (type === "campaign" ? "campaign.html" : "/")
      })
    });

    const raw = await response.text();
    let result = {};
    try { result = JSON.parse(raw); } catch {}
    if (!response.ok) throw new Error(result.message || `Notification server returned ${response.status}.`);

    status(`✅ Sent to ${Number(result.sent || 0)} subscriber(s).`);
    titleInput.value = "";
    messageInput.value = "";
    if (campaignInput) campaignInput.value = "";
    if (intentInput) intentInput.value = "";
  } catch (error) {
    console.error("Notification error:", error);
    status(`❌ ${error.message || "Unable to send notification."}`, true);
  } finally {
    sendButton.disabled = !authorized;
    sendButton.textContent = "🔔 Send Notification";
  }
});
