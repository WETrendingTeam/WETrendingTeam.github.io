// ==========================================
// WETrendingTeam Control Center
// admin.js
// Firebase Authentication Login
// ==========================================

import { app } from "./firebase-config.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const auth = getAuth(app);


const loginForm = document.getElementById("loginForm");

const rememberBox = document.getElementById("remember");


// ================================
// ROLE SELECTOR
// ================================

let selectedRole = "developer";


const roleCards = document.querySelectorAll(".role-card");


roleCards.forEach((card) => {


    card.addEventListener("click", () => {


        roleCards.forEach((item) => {

            item.classList.remove("active");

        });


        card.classList.add("active");


        selectedRole = card.dataset.role;


        console.log(
            "Selected role:",
            selectedRole
        );


    });


});



// ================================
// LOGIN
// ================================

loginForm.addEventListener("submit", async (event) => {


    event.preventDefault();



    const email =
    document.getElementById("email").value;


    const password =
    document.getElementById("password").value;



    try {


        // Remember me option

        await setPersistence(

            auth,

            rememberBox.checked

            ? browserLocalPersistence

            : browserSessionPersistence

        );



        const userCredential =
        await signInWithEmailAndPassword(

            auth,

            email,

            password

        );



        const user =
        userCredential.user;



        console.log(
            "Logged in:",
            user.email
        );



        // Save session temporarily

        localStorage.setItem(

            "userEmail",

            user.email

        );


        localStorage.setItem(

            "userRole",

            selectedRole

        );



        alert(
            "Login successful"
        );



        window.location.href =
        "dashboard.html";



    } catch(error) {


        console.error(
            "Login error:",
            error
        );


        alert(
            "Login failed: " + error.message
        );


    }


});