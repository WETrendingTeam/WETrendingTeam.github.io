// ==========================================
// WETrendingTeam
// send-notification.js
// ONE-CLICK BROADCAST TO ALL SUBSCRIBERS
// ==========================================

import { app } from "./firebase-config.js";

import {
getAuth,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// ==========================================
// ADMIN CONFIGURATION
// ==========================================

const ADMIN_EMAIL =
"wetrendingteam@gmail.com";


// ==========================================
// CLOUD FUNCTION URL
// ==========================================
//
// IMPORTANT:
// After deploying your Firebase Cloud Function,
// replace the URL below with the actual URL
// Firebase gives you.
//
// Example:
// https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendNotification
//
// ==========================================

const SEND_NOTIFICATION_URL =
"https://us-central1-wetrendingteam-1f8ce.cloudfunctions.net/sendNotification";


// ==========================================
// FIREBASE AUTH
// ==========================================

const auth = getAuth(app);


// ==========================================
// PAGE ELEMENTS
// ==========================================

const titleInput =
document.getElementById(
"notificationTitle"
);

const messageInput =
document.getElementById(
"notificationMessage"
);

const sendButton =
document.getElementById(
"sendNotificationBtn"
);

const statusBox =
document.getElementById(
"sendStatus"
);


// ==========================================
// STATE
// ==========================================

let currentUser = null;

let authorized = false;


// ==========================================
// STATUS DISPLAY
// ==========================================

function status(message) {

if (statusBox) {
statusBox.textContent = message;
}
}


// ==========================================
// CHECK ADMIN LOGIN
// ==========================================

onAuthStateChanged(
auth,
(user) => {

currentUser = user;


// --------------------------------------
// NOT LOGGED IN
// --------------------------------------

if (!user) {

authorized = false;

if (sendButton) {
sendButton.disabled = true;
}

status(
"Admin session required. Please log in through Admin Login."
);

return;
}


// --------------------------------------
// CHECK ADMIN EMAIL
// --------------------------------------

const email =
(user.email || "")
.trim()
.toLowerCase();


if (email !== ADMIN_EMAIL) {

authorized = false;

if (sendButton) {
sendButton.disabled = true;
}

status(
"You are not authorized to send notifications."
);

return;
}


// --------------------------------------
// AUTHORIZED
// --------------------------------------

authorized = true;

if (sendButton) {
sendButton.disabled = false;
}

status(
"Ready to send a notification to all subscribers."
);
}
);


// ==========================================
// SEND TO ALL SUBSCRIBERS
// ==========================================

sendButton?.addEventListener(
"click",
async () => {

// --------------------------------------
// GET INPUT
// --------------------------------------

const title =
titleInput?.value
.trim();

const message =
messageInput?.value
.trim();


// --------------------------------------
// VALIDATION
// --------------------------------------

if (!title) {

status(
"Please enter a notification title."
);

titleInput?.focus();

return;
}


if (!message) {

status(
"Please enter a notification message."
);

messageInput?.focus();

return;
}


if (!currentUser || !authorized) {

status(
"Please log in through Admin Login first."
);

return;
}


// --------------------------------------
// CONFIRM SEND
// --------------------------------------

const confirmed =
confirm(
"Send this notification to ALL subscribed devices?"
);


if (!confirmed) {
return;
}


// --------------------------------------
// DISABLE BUTTON
// --------------------------------------

sendButton.disabled = true;

sendButton.textContent =
"⏳ Sending to everyone…";


status(
"Connecting to WETrendingTeam notification server…"
);


try {

// --------------------------------------
// GET ADMIN ID TOKEN
// --------------------------------------

const idToken =
await currentUser.getIdToken(
true
);


console.log(
"Admin authentication token obtained."
);


// --------------------------------------
// CALL FIREBASE CLOUD FUNCTION
// --------------------------------------

const response =
await fetch(
SEND_NOTIFICATION_URL,
{
method: "POST",

headers: {
"Content-Type":
"application/json",

"Authorization":
`Bearer ${idToken}`
},

body:
JSON.stringify({
title,
message
})
}
);


// --------------------------------------
// READ RESPONSE
// --------------------------------------

const raw =
await response.text();


let result = {};


try {

result =
JSON.parse(raw);

} catch {

result = {};
}


// --------------------------------------
// SERVER ERROR
// --------------------------------------

if (!response.ok) {

throw new Error(
result.message ||
`Notification server returned ${response.status}.`
);
}


// --------------------------------------
// SUCCESS
// --------------------------------------

const sent =
Number(
result.sent || 0
);


const failed =
Number(
result.failed || 0
);


status(
`✅ Notification sent to ${sent} subscriber(s).`
);


console.log(
"Notification broadcast result:",
{
sent,
failed,
response: result
}
);


// --------------------------------------
// CLEAR FORM
// --------------------------------------

if (titleInput) {
titleInput.value = "";
}


if (messageInput) {
messageInput.value = "";
}


// --------------------------------------
// SHOW FAILURE INFORMATION
// --------------------------------------

if (failed > 0) {

status(
`⚠️ Sent to ${sent} subscriber(s). ${failed} device(s) failed.`
);
}


} catch (error) {

console.error(
"Notification broadcast error:",
error
);


status(
`❌ ${error.message || "Unable to send notification."}`
);


} finally {

// --------------------------------------
// RESTORE BUTTON
// --------------------------------------

sendButton.disabled =
!authorized;

sendButton.textContent =
"🔔 Send to All Subscribers";
}
}
);