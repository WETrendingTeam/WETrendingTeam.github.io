import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const ADMIN_EMAIL = "wetrendingteam@gmail.com";
const auth = getAuth(app);

const titleInput = document.getElementById("notificationTitle");
const messageInput = document.getElementById("notificationMessage");
const sendButton = document.getElementById("sendNotificationBtn");
const statusBox = document.getElementById("sendStatus");

let currentUser = null;
let authorized = false;

function status(message) {
  if (statusBox) statusBox.textContent = message;
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;

  if (!user || (user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    authorized = false;
    if (sendButton) sendButton.disabled = true;
    status("Admin session required. Please log in through Admin Login.");
    return;
  }

  authorized = true;
  if (sendButton) sendButton.disabled = false;
  status("Ready to send a notification.");
});

sendButton?.addEventListener("click", async () => {
  const title = titleInput?.value.trim();
  const message = messageInput?.value.trim();

  if (!title) return status("Please enter a notification title.");
  if (!message) return status("Please enter a notification message.");
  if (!currentUser || !authorized) {
    return status("Please log in through Admin Login first.");
  }

  sendButton.disabled = true;
  sendButton.textContent = "⏳ Sending…";
  status("Sending notification…");

  try {
    const idToken = await currentUser.getIdToken(true);

    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ title, message })
    });

    const raw = await response.text();
    let result = {};
    try { result = JSON.parse(raw); } catch {}

    if (!response.ok) {
      throw new Error(result.message || `Server returned ${response.status}.`);
    }

    status(`✅ Notification sent to ${result.sent ?? 0} subscriber(s).`);
    if (titleInput) titleInput.value = "";
    if (messageInput) messageInput.value = "";
  } catch (error) {
    console.error("Notification send error:", error);
    status(`⚠️ ${error.message || "Unable to send notification."}`);
  } finally {
    sendButton.disabled = !authorized;
    sendButton.textContent = "🔔 Send to All Subscribers";
  }
});
