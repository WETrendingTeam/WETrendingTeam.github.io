import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONTROL_EMAIL = "lade.galleria@gmail.com";
const auth = getAuth(app);
const db = getFirestore(app);

function liveCount(collectionName, elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  onSnapshot(
    collection(db, collectionName),
    (snapshot) => {
      element.textContent = String(snapshot.size);
    },
    (error) => {
      console.warn(`Could not load ${collectionName}:`, error);
      element.textContent = "—";
    }
  );
}

onAuthStateChanged(auth, (user) => {
  if (!user || (user.email || "").toLowerCase() !== CONTROL_EMAIL) {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userUID");
    window.location.replace("control-center.html");
    return;
  }

  const roleEl = document.getElementById("userRole");
  if (roleEl) roleEl.textContent = "Control Center";

  // Live Firebase values — no prototype numbers.
  // Each fcmTokens document represents a registered notification subscription/device token.
  liveCount("fcmTokens", "usersCount");

  // Each notifications document represents a notification recorded by the Admin send system.
  liveCount("notifications", "notificationCount");

  liveCount("campaigns", "campaignCount");
  liveCount("trendRequests", "trendCount");
});

document.getElementById("backBtn")?.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.replace("control-center.html");
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
  if (!confirm("Logout from Control Center?")) return;

  await signOut(auth);
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userUID");
  window.location.replace("control-center.html");
});
