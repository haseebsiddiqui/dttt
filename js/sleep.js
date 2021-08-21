var intervalTimer = setInterval(function () { updateEverything(); }, UPDATE_TIME);
var desiredHoursOfSleep = getUserSleep();
var userCustomSleepTime = getCustomTime();
var splitNotifications = [];
var notifications = getNotifications();

updateDesiredHoursOfSleep(desiredHoursOfSleep);
showNotifications();

function updateEverything() {
    updateCurrentTime();
    updateCustomTime(userCustomSleepTime);
    updateAllDefaults();
}

function updateDesiredHoursOfSleep(number) {
    const hourDiv = document.getElementById("desired_sleep_div");
    hourDiv.innerText = `${number}`;
}

function updateCustomTime(someTime) {
    const splitTime = someTime.split(":");
    const futureTime = new Date(now);
    setDateToNextTime(futureTime, parseInt(splitTime[0], 10), parseInt(splitTime[1], 10));
    const timeDiv = document.getElementById("custom_time_div");
    timeDiv.innerText = `Next ${someTime} (${twelveHourTime(futureTime)}) is\n${futureTime.toString()}`;
    const timeUntilDiv = document.getElementById("time_until_custom");
    timeUntilDiv.innerText = `Time until ${someTime} is\n${moment.preciseDiff(futureTime, now)}`;
    const timeUntilBedtime = setTimeUntilOrSinceEvent("time_until_custom_bedtime", futureTime, desiredHoursOfSleep, "bedtime");

    if (timeUntilBedtime >= 0) handleNotifications(timeUntilBedtime);
}

function handleNotifications(timeUntilBedtime) {
    for (const n of splitNotifications) {
        if (n >= 0 && isTimeToNotify(n, timeUntilBedtime)) {
            createNotification(`${n} minutes until bedtime`, `Waking at ${userCustomSleepTime}, ${desiredHoursOfSleep} hours of sleep`, true);
        }
    }
}

function updateSomeDefault(firstNum, secondNum, withColon, noColon) {
    const futureTime = new Date(now);
    setDateToNextTime(futureTime, firstNum, secondNum);
    const timeDiv = document.getElementById(noColon);
    timeDiv.innerText = `Next ${withColon} is\n${futureTime.toString()}`;
    const timeUntilDiv = document.getElementById(`timeUntil${noColon}`);
    timeUntilDiv.innerText = `Time until ${withColon} is\n${moment.preciseDiff(futureTime, now)}`;
    setTimeUntilOrSinceEvent(`timeUntilBedtime${noColon}`, futureTime, desiredHoursOfSleep, "bedtime");
}

function updateAllDefaults() {
    updateSomeDefault(7, 0, "7:00 AM", "700");
    updateSomeDefault(7, 30, "7:30 AM", "730");
    updateSomeDefault(8, 0, "8:00 AM", "800");
    updateSomeDefault(8, 30, "8:30 AM", "830");
    updateSomeDefault(9, 0, "9:00 AM", "900");
}

function setUserSleep() {
    const input = prompt("Enter the hours of sleep (example: 8 for 8 hr, 7.5 for 7 hr 30 min)");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("desiredHoursOfSleep");
        localStorage.setItem("desiredHoursOfSleep", input);
        desiredHoursOfSleep = input;
        updateDesiredHoursOfSleep(desiredHoursOfSleep);
    }
}

function getUserSleep() {
    let savedItem = localStorage.getItem("desiredHoursOfSleep");
    if (savedItem == null) savedItem = 8;
    return savedItem;
}

function setCustomTime() {
    const input = prompt("Enter the time in 24 hr format (example: 7:45, 8:00, 9:15)");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("customSleepTime");
        localStorage.setItem("customSleepTime", input);
        userCustomSleepTime = input;
    }
}

function getCustomTime() {
    let savedItem = localStorage.getItem("customSleepTime");
    if (savedItem == null) savedItem = "9:00";
    return savedItem;
}

function setNotifications() {
    const input = prompt("Enter notifications");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("sleepNotifications");
        localStorage.setItem("sleepNotifications", input);
        notifications = getNotifications();
        showNotifications();
    }
}

function getNotifications() {
    let savedItem = localStorage.getItem("sleepNotifications");
    if (savedItem == null) savedItem = "0";
    splitNotifications = savedItem.split(",");
    return savedItem;
}

function showNotifications() {
    const div = document.getElementById("notifications_div");
    div.innerText = notifications;
}
