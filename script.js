/* ==========================
   COUNTDOWN — 10:00 AM THAILAND TIME
   Thailand = UTC+7
========================== */

function getNextThailand10AM() {

    const now = new Date();

    // Current time in Thailand
    const thailandNow = new Date(
        now.toLocaleString("en-US", {
            timeZone: "Asia/Bangkok"
        })
    );

    // Set target to 10:00 AM Thailand time
    thailandNow.setHours(10, 0, 0, 0);

    // If 10:00 AM has already passed,
    // countdown to tomorrow's 10:00 AM
    if (new Date() >= thailandNow) {
        thailandNow.setDate(thailandNow.getDate() + 1);
    }

    // Convert Thailand target back to a UTC timestamp
    const targetString =
        thailandNow.getFullYear() +
        "-" +
        String(thailandNow.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(thailandNow.getDate()).padStart(2, "0") +
        "T10:00:00+07:00";

    return new Date(targetString).getTime();
}


let countdownTarget = getNextThailand10AM();


function updateCountdown() {

    const now = Date.now();

    let distance = countdownTarget - now;


    const daysEl =
        document.getElementById("days");

    const hoursEl =
        document.getElementById("hours");

    const minutesEl =
        document.getElementById("minutes");

    const secondsEl =
        document.getElementById("seconds");


    // When countdown reaches zero
    if (distance <= 0) {

        if (daysEl)
            daysEl.textContent = "00";

        if (hoursEl)
            hoursEl.textContent = "00";

        if (minutesEl)
            minutesEl.textContent = "00";

        if (secondsEl)
            secondsEl.textContent = "00";


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
                "🎟️ TICKETS OPEN NOW";

        }


        if (sub) {

            sub.textContent =
                "Tickets are now available. Get your tickets for YOU MANIAC Opening Night.";

        }


        return;

    }


    const days =
        Math.floor(
            distance / 86400000
        );


    const hours =
        Math.floor(
            (distance % 86400000) / 3600000
        );


    const minutes =
        Math.floor(
            (distance % 3600000) / 60000
        );


    const seconds =
        Math.floor(
            (distance % 60000) / 1000
        );


    if (daysEl)
        daysEl.textContent =
            String(days).padStart(2, "0");


    if (hoursEl)
        hoursEl.textContent =
            String(hours).padStart(2, "0");


    if (minutesEl)
        minutesEl.textContent =
            String(minutes).padStart(2, "0");


    if (secondsEl)
        secondsEl.textContent =
            String(seconds).padStart(2, "0");

}


updateCountdown();

setInterval(updateCountdown, 1000);
