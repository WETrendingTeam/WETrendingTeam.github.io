// ==========================================
// WETrendingTeam Firebase Authentication
// firebase-auth.js
// ==========================================

import { app } from "./firebase-config.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event){

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try{

        // Firebase Authentication

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        // Firestore role lookup

        const usersRef = collection(db, "users");

        const q = query(
            usersRef,
            where("email", "==", user.email)
        );

        const snapshot = await getDocs(q);

        if(snapshot.empty){

            alert("No role assigned to this account.");

            return;

        }

        let role = "";

        snapshot.forEach((doc)=>{

            role = doc.data().role;

        });

        // Save Login Details

        localStorage.setItem(
            "userEmail",
            user.email
        );

        localStorage.setItem(
            "userRole",
            role
        );

        // Open Dashboard

        window.location.href = "dashboard.html";

    }

    catch(error){

        alert(
            "Login failed:\n" + error.message
        );

        console.error(error);

    }

});
