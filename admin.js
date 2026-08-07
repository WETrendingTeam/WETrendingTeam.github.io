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

} 

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const auth = getAuth(app);



// Login form

const loginForm = document.getElementById("loginForm");


console.log(
    "Login form:",
    loginForm
);



const rememberBox = document.getElementById("remember");



// Stop if form is missing

if (!loginForm) {


    console.error(
        "Login form not found"
    );


} else {



    // ================================
    // ROLE SELECTOR
    // ================================


    let selectedRole = "developer";



    const roleCards =
    document.querySelectorAll(".role-card");



    roleCards.forEach((card) => {



        card.addEventListener("click", () => {



            roleCards.forEach((item) => {


                item.classList.remove("active");


            });



            card.classList.add("active");



            selectedRole =
            card.dataset.role;



            console.log(

                "Selected role:",

                selectedRole

            );


        });


    });




    // ================================
    // LOGIN
    // ================================



    loginForm.addEventListener(

        "submit",

        async (event) => {



            event.preventDefault();



            const email =

            document.getElementById("email").value;



            const password =

            document.getElementById("password").value;



            console.log(

                "Trying login:",

                email

            );



            try {



                await setPersistence(

                    auth,

                    rememberBox && rememberBox.checked

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

                    "Login success:",

                    user.email

                );




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

                    "Login failed: "

                    + error.message

                );



            }



        }

    );


}