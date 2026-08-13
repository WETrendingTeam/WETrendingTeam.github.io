// WETrendingTeam — FCM status helper
const statusEl = document.getElementById("fcmStatus");

function render(message) {
  if (statusEl) statusEl.innerHTML = `<p>${message}</p>`;
}

export async function showFCMReadyStatus() {
  try {
    if (!("Notification" in window)) {
      render("⚠️ This browser does not support notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      render("✅ Push notifications are enabled on this device.");
    } else if (Notification.permission === "denied") {
      render("⚠️ Push notifications are blocked for this site.");
    } else {
      render("🔔 Push notifications have not been enabled yet.");
    }
  } catch (error) {
    console.error("FCM status error:", error);
    render("⚠️ Unable to check push notification status.");
  }
}

showFCMReadyStatus();
