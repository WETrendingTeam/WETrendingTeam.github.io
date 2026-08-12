import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = "wetrendingteam@gmail.com";
const auth = getAuth(app);
const db = getFirestore(app);

function liveCount(name, id) {
  const el = document.getElementById(id);
  if (!el) return;
  onSnapshot(collection(db, name), snap => {
    el.textContent = String(snap.size);
  }, err => {
    console.warn(`Could not load ${name}:`, err.message);
    el.textContent = "0";
  });
}

onAuthStateChanged(auth, user => {
  if (!user || (user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    window.location.replace("admin.html");
    return;
  }
  liveCount("fcmTokens", "adminSubscriberCount");
  liveCount("users", "adminUsersCount");
  liveCount("campaigns", "adminCampaignCount");
  liveCount("notifications", "adminNotificationCount");
  liveCount("trendRequests", "adminTrendCount");
});

document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userUID");
  window.location.replace("admin.html");
});
