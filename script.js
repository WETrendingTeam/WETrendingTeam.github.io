/* ==================================================
   WETrendingTeam v2.0
   SCRIPT FILE
================================================== */


/* ==========================
   LOADING SCREEN
========================== */

window.addEventListener("load",()=>{

    const loader = document.getElementById("loader");

    setTimeout(()=>{

        if(loader){

            loader.style.opacity="0";

            loader.style.visibility="hidden";

        }

    },2200);

});



/* ==========================
   HERO SLIDESHOW
========================== */

const slides = document.querySelectorAll(".slide");

let currentSlide = 0;


function showSlide(index){

    slides.forEach(slide=>{

        slide.classList.remove("active");

    });


    if(slides[index]){

        slides[index].classList.add("active");

    }

}


if(slides.length > 0){

    setInterval(()=>{

        currentSlide++;

        if(currentSlide >= slides.length){

            currentSlide = 0;

        }

        showSlide(currentSlide);


    },5000);

}



/* ==========================
   COUNTDOWN
========================== */


/*
Change this date whenever
you start a new campaign.
*/


const targetDate = new Date(
    "August 08, 2026 23:59:59"
).getTime();



function updateCountdown(){


    const now = new Date().getTime();


    const distance = targetDate - now;



    if(distance < 0){

        return;

    }



    const days = Math.floor(

        distance /
        (1000 * 60 * 60 * 24)

    );



    const hours = Math.floor(

        (distance %
        (1000 * 60 * 60 * 24))
        /
        (1000 * 60 * 60)

    );



    const minutes = Math.floor(

        (distance %
        (1000 * 60 * 60))
        /
        (1000 * 60)

    );



    const seconds = Math.floor(

        (distance %
        (1000 * 60))
        /
        1000

    );



    document.getElementById("days").innerHTML =
        days;


    document.getElementById("hours").innerHTML =
        hours;


    document.getElementById("minutes").innerHTML =
        minutes;


    document.getElementById("seconds").innerHTML =
        seconds;


}



updateCountdown();


setInterval(
    updateCountdown,
    1000
);
/* ==================================================
   PART 2
   THEME + MOBILE MENU + NAVBAR
================================================== */



/* ==========================
   MOBILE MENU
========================== */


const menuBtn = document.querySelector(".menu-btn");

const navLinks = document.querySelector(".nav-links");



if(menuBtn && navLinks){


    menuBtn.addEventListener("click",()=>{


        navLinks.classList.toggle("mobile-active");


        menuBtn.innerHTML =
        navLinks.classList.contains("mobile-active")

        ?
        '<i class="fa-solid fa-xmark"></i>'

        :

        '<i class="fa-solid fa-bars"></i>';


    });



    // Close menu after clicking link

    document.querySelectorAll(".nav-links a")
    .forEach(link=>{


        link.addEventListener("click",()=>{


            navLinks.classList.remove(
                "mobile-active"
            );


            menuBtn.innerHTML =
            '<i class="fa-solid fa-bars"></i>';


        });


    });


}




/* ==========================
   NAVBAR SCROLL EFFECT
========================== */


const navbar = document.querySelector(".navbar");


window.addEventListener("scroll",()=>{


    if(!navbar){

        return;

    }



    if(window.scrollY > 80){


        navbar.classList.add(
            "scrolled"
        );


    }


    else{


        navbar.classList.remove(
            "scrolled"
        );


    }


});
/* ==================================================
   PART 3
   BACK TO TOP + SCROLL ANIMATION
================================================== */


/* ==========================
   BACK TO TOP BUTTON
========================== */


const backToTop =
document.getElementById("backToTop");


if(backToTop){


    window.addEventListener("scroll",()=>{


        if(window.scrollY > 400){


            backToTop.classList.add(
                "show"
            );


        }

        else{


            backToTop.classList.remove(
                "show"
            );


        }


    });



    backToTop.addEventListener(
        "click",
        ()=>{


            window.scrollTo({

                top:0,

                behavior:"smooth"

            });


        }

    );


}



/* ==========================
   SCROLL REVEAL
========================== */


const revealElements =
document.querySelectorAll(
    "section, .status-card, .mission-card, .rating-card, .event-card"
);



const revealObserver =
new IntersectionObserver(

(entries)=>{


    entries.forEach(entry=>{


        if(entry.isIntersecting){


            entry.target.classList.add(
                "reveal"
            );


            setTimeout(()=>{


                entry.target.classList.add(
                    "active"
                );


            },100);


            revealObserver.unobserve(
                entry.target
            );


        }


    });


},

{

    threshold:.15

}

);



revealElements.forEach(element=>{


    element.classList.add(
        "reveal"
    );


    revealObserver.observe(
        element
    );


});
