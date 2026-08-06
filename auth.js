// ==========================================
// WETrendingTeam Control Center
// auth.js
// ==========================================

let selectedRole = "developer";

const roleCards = document.querySelectorAll(".role-card");

roleCards.forEach(function(card){

    card.onclick = function(){

        roleCards.forEach(function(item){
            item.classList.remove("active");
        });

        this.classList.add("active");

        selectedRole = this.dataset.role;

        localStorage.setItem("selectedRole", selectedRole);

        console.log("Selected role:", selectedRole);

    };

});