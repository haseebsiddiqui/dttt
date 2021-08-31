const MS_IN_SECOND = 1000;
const SEC_IN_MINUTE = 60;
const MIN_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;

const UPDATE_TIME = 1000;

const USER_EVENT = 1;
const SLEEP_EVENT = 2;

var now = new Date();
var notificationStatus = getNotificationStatus();

function updateNow() {
    now = new Date();
}

function updateCurrentTime() {
    updateNow();
    const currentTimeDiv = document.getElementById("current_time_div");

    if (isElementVisible(currentTimeDiv)) {
        const twelveHourString = twelveHourTime(now);
        currentTimeDiv.innerText = `${now.toString()}\n(${twelveHourString})`;
    }
}

function isElementVisible(e) {
    const bounds = e.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom >= 0;
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

    notificationStatus = getNotificationStatus();
}

function disableNotifications() {
    localStorage.setItem("notifications", "disabled");
    notificationStatus = getNotificationStatus();
}

function testNotification() {
    createNotification("This is a test notification", "This is a test notification", true);
}

function getNotificationStatus() {
    return localStorage.getItem("notifications");
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
