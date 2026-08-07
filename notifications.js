import { app } from "./firebase-config.js";

import {
    getFirestore,
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);

const notificationList = document.getElementById("notificationList");

const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {

    notificationList.innerHTML = "";

    if (snapshot.empty) {
        notificationList.innerHTML = "<p>No notifications available.</p>";
        return;
    }

    snapshot.forEach((doc) => {

        const data = doc.data();

        const card = document.createElement("div");
        card.className = "notification-card";

        card.innerHTML = `
            <h3>${data.title || "No Title"}</h3>
            <p>${data.message || ""}</p>
            <hr>
        `;

        notificationList.appendChild(card);

    });

});
