// ==========================================
// WETrendingTeam Dashboard
// dashboard.js
// ==========================================

// Logged-in user

const role =
localStorage.getItem("userRole") || "Developer";

const email =
localStorage.getItem("userEmail") || "";

// Display role

document.getElementById("userRole").textContent = role;

// Welcome message

const welcome =
document.querySelector(".welcome h1");

if(email){

    welcome.textContent =
    "Welcome, " + email + " 👋";

}

// Quick Action cards

const actionCards =
document.querySelectorAll(".action-card");

// Role Permissions

if(role === "Moderator"){

    // Hide User Management

    actionCards[3].style.display = "none";

    // Hide Settings

    actionCards[4].style.display = "none";

}

if(role === "Admin"){

    // Hide Settings

    actionCards[4].style.display = "none";

}

// Logout

document.getElementById("logoutBtn").addEventListener("click", ()=>{

    if(confirm("Logout from Control Center?")){

        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");

        window.location.href = "admin.html";

    }

});
