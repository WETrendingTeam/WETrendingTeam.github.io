// ==========================================
// WETrendingTeam Control Center
// admin.js
// ==========================================

let selectedRole = "developer";


const roleCards = document.querySelectorAll(".role-card");


roleCards.forEach(function(card){


    card.addEventListener("click", function(){


        roleCards.forEach(function(item){

            item.classList.remove("active");

        });


        this.classList.add("active");


        selectedRole = this.dataset.role;


        console.log(
            "Selected role:",
            selectedRole
        );


    });


});