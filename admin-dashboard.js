import { app } from "./firebase-config.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_EMAIL = "wetrendingteam@gmail.com";
const auth = getAuth(app);
const db = getFirestore(app);

function liveCount(name, id) {
  const el = document.getElementById(id);
  if (!el) return;

  onSnapshot(
    collection(db, name),
    snap => el.textContent = String(snap.size),
    err => {
      console.warn(`Could not load ${name}:`, err);
      el.textContent = "—";
    }
  );
}

onAuthStateChanged(auth, (user) => {
  if (!user || (user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    window.location.replace("admin.html");
    return;
  }

  // Real Firebase values — never hard-coded.
  liveCount("fcmTokens", "adminUsersCount");
  liveCount("notifications", "adminNotificationCount");
});

document.getElementById("adminBackBtn")?.addEventListener("click", () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.replace("admin.html");
  }
});

document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userUID");
  window.location.replace("admin.html");
});
