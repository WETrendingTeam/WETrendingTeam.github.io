/* ==================================================
   WETrendingTeam v2.0
   SCRIPT FILE
================================================== */


/* ==========================
   LOADING SCREEN
========================== */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    setTimeout(() => {

        if (loader) {

            loader.style.opacity = "0";
            loader.style.visibility = "hidden";

        }

    }, 2200);

});



/* ==========================
   HERO SLIDESHOW
========================== */

const slides = document.querySelectorAll(".slide");

let currentSlide = 0;


function showSlide(index) {

    slides.forEach(slide => {

        slide.classList.remove("active");

    });


    if (slides[index]) {

        slides[index].classList.add("active");

    }

}


if (slides.length > 0) {

    setInterval(() => {

        currentSlide++;

        if (currentSlide >= slides.length) {

            currentSlide = 0;

        }

        showSlide(currentSlide);

    }, 5000);

}




/* ==================================================
   TICKET COUNTDOWN
   23 AUGUST 2026 — 10:00 AM
   THAILAND TIME (UTC+7)
================================================== */


/*
   IMPORTANT:

   The countdown is fixed to:

   29 August 2026
   10:00 AM
   Thailand Time (UTC+7)

   It does NOT reset every day.
*/


const ticketSaleTime =
    new Date("2026-08-29T19:30:00+07:00").getTime();


function updateCountdown() {

    const now = Date.now();

    const distance =
        ticketSaleTime - now;


    /* ==========================
       COUNTDOWN ELEMENTS
    ========================== */

    const daysEl =
        document.getElementById("days");

    const hoursEl =
        document.getElementById("hours");

    const minutesEl =
        document.getElementById("minutes");

    const secondsEl =
        document.getElementById("seconds");


    /* ==========================
       TICKETS ARE AVAILABLE
    ========================== */

    if (distance <= 0) {

        if (daysEl) {

            daysEl.textContent = "00";

        }


        if (hoursEl) {

            hoursEl.textContent = "00";

        }


        if (minutesEl) {

            minutesEl.textContent = "00";

        }


        if (secondsEl) {

            secondsEl.textContent = "00";

        }


        const label =
            document.querySelector(
                ".countdown .section-title"
            );


        const sub =
            document.querySelector(
                ".countdown .section-subtitle"
            );


        if (label) {

         label.textContent =
    "PREMIER DAY";

        }


        if (sub) {

           sub.textContent =
    "YOu Maniac Opening Night — 29 August 2026";
        }


        return;

    }


    /* ==========================
       CALCULATE TIME REMAINING
    ========================== */

    const days =
        Math.floor(
            distance / (1000 * 60 * 60 * 24)
        );


    const hours =
        Math.floor(
            (distance % (1000 * 60 * 60 * 24))
            / (1000 * 60 * 60)
        );


    const minutes =
        Math.floor(
            (distance % (1000 * 60 * 60))
            / (1000 * 60)
        );


    const seconds =
        Math.floor(
            (distance % (1000 * 60))
            / 1000
        );


    /* ==========================
       DISPLAY COUNTDOWN
    ========================== */

    if (daysEl) {

        daysEl.textContent =
            String(days).padStart(2, "0");

    }


    if (hoursEl) {

        hoursEl.textContent =
            String(hours).padStart(2, "0");

    }


    if (minutesEl) {

        minutesEl.textContent =
            String(minutes).padStart(2, "0");

    }


    if (secondsEl) {

        secondsEl.textContent =
            String(seconds).padStart(2, "0");

    }

}


/* ==========================
   START COUNTDOWN
========================== */

updateCountdown();

setInterval(
    updateCountdown,
    1000
);




/* ==================================================
   PART 2
   THEME + MOBILE MENU + NAVBAR
================================================== */


const menuBtn =
    document.querySelector(".menu-btn");


const navLinks =
    document.querySelector(".nav-links");



if (menuBtn && navLinks) {


    menuBtn.addEventListener("click", () => {


        navLinks.classList.toggle(
            "mobile-active"
        );


        menuBtn.innerHTML =
            navLinks.classList.contains(
                "mobile-active"
            )
            ?
            '<i class="fa-solid fa-xmark"></i>'
            :
            '<i class="fa-solid fa-bars"></i>';


    });



    document.querySelectorAll(
        ".nav-links a"
    )
    .forEach(link => {


        link.addEventListener("click", () => {


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


const navbar =
    document.querySelector(".navbar");


window.addEventListener("scroll", () => {


    if (!navbar) {

        return;

    }


    if (window.scrollY > 80) {

        navbar.classList.add(
            "scrolled"
        );

    }

    else {

        navbar.classList.remove(
            "scrolled"
        );

    }


});




/* ==================================================
   PART 3
   BACK TO TOP + SCROLL ANIMATION
================================================== */


const backToTop =
    document.getElementById(
        "backToTop"
    );



if (backToTop) {


    window.addEventListener("scroll", () => {


        if (window.scrollY > 400) {

            backToTop.classList.add(
                "show"
            );

        }

        else {

            backToTop.classList.remove(
                "show"
            );

        }


    });



    backToTop.addEventListener(
        "click",
        () => {


            window.scrollTo({

                top: 0,

                behavior: "smooth"

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



if ("IntersectionObserver" in window) {


    const revealObserver =
        new IntersectionObserver(

            (entries) => {


                entries.forEach(entry => {


                    if (entry.isIntersecting) {


                        entry.target.classList.add(
                            "active"
                        );


                        revealObserver.unobserve(
                            entry.target
                        );


                    }


                });


            },

            {
                threshold: .15
            }

        );



    revealElements.forEach(element => {


        element.classList.add(
            "reveal"
        );


        revealObserver.observe(
            element
        );


    });


}




/* ==========================
   WATCH PLATFORM POPUP
========================== */


const platformPopup =
    document.getElementById(
        "platformPopup"
    );


const episodeButtons =
    document.querySelectorAll(
        ".episode-btn"
    );


const popupClose =
    document.querySelector(
        ".popup-close"
    );



/* ==========================
   OPEN POPUP
========================== */

episodeButtons.forEach(button => {


    button.addEventListener(
        "click",
        () => {


            if (platformPopup) {

                platformPopup.style.display =
                    "flex";

            }


        }

    );


});




/* ==========================
   CLOSE BUTTON
========================== */

if (popupClose) {


    popupClose.addEventListener(
        "click",
        () => {


            if (platformPopup) {

                platformPopup.style.display =
                    "none";

            }


        }

    );


}




/* ==========================
   CLOSE OUTSIDE POPUP
========================== */

window.addEventListener(
    "click",
    (e) => {


        if (e.target === platformPopup) {


            platformPopup.style.display =
                "none";


        }


    }

);
