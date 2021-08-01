const YMDHMS = 6;
const MDHMS = 5;
const DHMS = 4;
const HMS = 3;
const MS = 2;
const S = 1;

const MS_IN_SECOND = 1000;
const SEC_IN_MINUTE = 60;
const MIN_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MONTHS_IN_YEAR = 12;

const UPDATE_TIME = 1000;

const USER_EVENT = 1;
const SLEEP_EVENT = 2;

var now = new Date();

function updateNow() {
    now = new Date();
}

function updateCurrentTime() {
    updateNow();
    const currentTimeDiv = document.getElementById("current_time_div");
    const twelveHourString = twelveHourTime(now);
    currentTimeDiv.innerText = `${now.toString()}\n(${twelveHourString})`;
}

function padNumber(someNumber) {
    return (someNumber < 10) ? `0${someNumber}` : someNumber;
}

function twelveHourTime(someDate) {
    let hours = someDate.getHours();
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = ((hours + 11) % 12 + 1);
    let minutes = someDate.getMinutes();
    let seconds = someDate.getSeconds();
    hours = padNumber(hours);
    minutes = padNumber(minutes);
    seconds = padNumber(seconds);
    return `${hours}:${minutes}:${seconds} ${suffix}`;
}

function setDateToNextTime(someDate, hours, minutes) {
    const time = someDate.getHours() * MIN_IN_HOUR + someDate.getMinutes();
    const totalTime = hours * MIN_IN_HOUR + minutes;
    let tmp1 = 0;
    let tmp2 = 0;
    if (time < totalTime) {
        tmp1 = hours;
        tmp2 = minutes;
    } else {
        tmp1 = hours + HOURS_IN_DAY;
        tmp2 = minutes;
    }
    someDate.setHours(tmp1, tmp2, 0, 0);
}

function setTimeUntilOrSinceEvent(divName, eventDate, offsetHours, qualifier) {
    const theDiv = document.getElementById(divName);
    const tempDate = new Date(eventDate);
    tempDate.setMinutes(tempDate.getMinutes() - MIN_IN_HOUR * offsetHours);
    const preciseDiff = moment.preciseDiff(now, tempDate);
    theDiv.innerText = `Time ${(now > tempDate) ? "since" : "until"} ${qualifier} is\n${preciseDiff}`;
    return tempDate.getTime() - now.getTime();
}

function enableNotifications() {
    if (!("Notification" in window)) {
        alert("This browser doesn't support notifications");
    }

    if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                localStorage.setItem("notifications", "enabled");
            }
        });
    }

    if (Notification.permission === "denied") {
        alert("Notifications appear to be blocked");
    }
}

function disableNotifications() {
    localStorage.setItem("notifications", "disabled");
}

function testNotification() {
    createNotification("This is a test notification", "This is a test notification", true);
}

function createNotification(title, theBody, shouldRequireInteraction) {
    const options = {
        body: theBody,
        requireInteraction: shouldRequireInteraction
    };
    const n = new Notification(title, options);
}

// Given some number in minutes, convert to ms and check if the number is within one second of another number
function isTimeToNotify(someNumber, timeUntilEventMs) {
    someNumber = someNumber * SEC_IN_MINUTE * MS_IN_SECOND;
    if (timeUntilEventMs >= someNumber && timeUntilEventMs <= (someNumber + MS_IN_SECOND)) return true;
    return false;
}

function deleteClassChildItems(className) {
    Array.prototype.slice.call(document.getElementsByClassName(className)).forEach(
        function (item) {
            item.remove();
        }
    );
}

function getLocalStorageItem(itemName) {
    let savedItem = localStorage.getItem(itemName);
    if (savedItem == null) savedItem = [];
    return JSON.parse(savedItem);
}

function toggleLightMode() {
    const theme = document.querySelector("#theme-link");
    theme.href = (theme.getAttribute("href") == "../css/dark-mode.css") ? "../css/light-mode.css" : "../css/dark-mode.css";
}

function hasEventPassed(someDate) {
    return (someDate.getTime() - now.getTime() < 0) ? true : false;
}

function getMsFromNowUntilDate(someDate) {
    return Math.abs(now.getTime() - someDate.getTime());
}

function setTimeLeft(eventDate, someFormat, timeMs) {
    if (someFormat == YMDHMS || someFormat == MDHMS) {
        const eventMoment = moment(eventDate);
        const currentMoment = moment(now);
        const diff = moment.preciseDiff(eventMoment, currentMoment, true);
        if (someFormat == YMDHMS) {
            yearsLeft = diff.years;
            monthsLeft = diff.months;
        } else {
            yearsLeft = 0;
            monthsLeft = diff.months + diff.years * MONTHS_IN_YEAR;
        }
        daysLeft = diff.days;
        hoursLeft = diff.hours;
        minutesLeft = diff.minutes;
        secondsLeft = diff.seconds;
    } else if (someFormat == DHMS) {
        yearsLeft = monthsLeft = 0;
        daysLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR / HOURS_IN_DAY);
        timeMs = timeMs - (daysLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR * HOURS_IN_DAY);
        hoursLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR);
        timeMs = timeMs - (hoursLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR);
        minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
        timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
        secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
    } else if (someFormat == HMS) {
        yearsLeft = monthsLeft = daysLeft = 0;
        hoursLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR);
        timeMs = timeMs - (hoursLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR);
        minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
        timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
        secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
    } else if (someFormat == MS) {
        yearsLeft = monthsLeft = daysLeft = hoursLeft = 0;
        minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
        timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
        secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
    } else {
        yearsLeft = monthsLeft = daysLeft = hoursLeft = minutesLeft = 0;
        secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
    }
}