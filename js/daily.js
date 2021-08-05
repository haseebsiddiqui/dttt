var intervalTimer = setInterval(function () { updateEverything(); }, UPDATE_TIME);
var startTime;
var endTime;
var timeFromStartMs;
var timeUntilEndMs;
var userStart;
var userEnd;
var fixedEnd;
var splitNotifications = [];
var notifications = getNotifications();

showNotifications();

function updateEverything() {
    updateCurrentTime();
    updateEndTime();
    updateStartTime();
    updatePercentFinishedAndLeft();
}

function subtractFromDate(someDate, numDays) {
    return someDate.setDate(someDate.getDate() - numDays);
}

function updateStartTime() {
    startTime = new Date(now);
    const start = getEventStart();
    const splitTime = start.split(":");
    const hour = splitTime[0];
    const minute = splitTime[1];

    // Only set the start time to the next day's start time if the event is finished
    if (startTime.getDay() !== endTime.getDay()) {
        subtractFromDate(startTime, -1);
    }

    setDateToNextTime(startTime, hour, minute);
    const timeDiv = document.getElementById("start_time_div");
    timeDiv.innerText = `Next ${start} (${twelveHourTime(startTime)}) is\n${startTime.toString()}`;
    setTimeUntilOrSinceEvent("time_until_start", startTime, 0, "start");
    timeFromStartMs = startTime.getTime();
}

function updateEndTime() {
    endTime = new Date(now);
    const end = getEventEnd();
    const splitTime = end.split(":");
    const hour = splitTime[0];
    const minute = splitTime[1];

    setDateToNextTime(endTime, hour, minute);
    // Set the end time to the next day if the end has passed
    if (now.getTime() > endTime.getTime()) {
        subtractFromDate(endTime, -1);
        setDateToNextTime(endTime, hour, minute);
    }

    const timeDiv = document.getElementById("end_time_div");
    timeDiv.innerText = `Next ${end} (${twelveHourTime(endTime)}) is\n${endTime.toString()}`;
    timeUntilEndMs = setTimeUntilOrSinceEvent("time_until_end", endTime, 0, "end");
    if (timeUntilEndMs >= 0) handleNotifications(timeUntilEndMs);
}

function handleNotifications(timeUntilEnd) {
    for (const n of splitNotifications) {
        if (n >= 0 && isTimeToNotify(n, timeUntilEnd)) {
            createNotification(`${n} minutes until end`, "", true);
        }
    }
}

function updatePercentFinishedAndLeft() {
    const theDiv = document.getElementById("percent");
    const duration = Math.abs(startTime.getTime() - endTime.getTime());
    const eventLengthInHours = duration / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR;
    updateDuration(`${eventLengthInHours.toFixed(2)} hours`);

    const percentFinished = (duration - timeUntilEndMs) / duration * 100;
    let finalString = "";

    if (percentFinished > 100 || percentFinished < 0) {
        finalString = `---`;
    } else {
        finalString = `${percentFinished.toFixed(3)} finished ${(100 - percentFinished).toFixed(3)} left`;
    }

    theDiv.innerText = finalString;
}

function updateDuration(someDuration) {
    const theDiv = document.getElementById("duration");
    theDiv.innerText = someDuration;
}

function setEventStart() {
    const input = prompt("Enter the start time in 24 hr format (example: 9:00, 13:15)");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("eventStart");
        localStorage.setItem("eventStart", input);
        userStart = input;
    }
}

function getEventStart() {
    let savedItem = localStorage.getItem("eventStart");
    if (savedItem == null) savedItem = "9:00";
    return savedItem;
}

function setEventEnd() {
    const input = prompt("Enter the end time in 24 hr format (example: 17:00, 19:15)");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("eventEnd");
        localStorage.setItem("eventEnd", input);
        userEnd = input;
    }
}

function getEventEnd() {
    let savedItem = localStorage.getItem("eventEnd");
    if (savedItem == null) savedItem = "17:00";
    return savedItem;
}

function setNotifications() {
    const input = prompt("Enter notifications");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("dailyNotifications");
        localStorage.setItem("dailyNotifications", input);
        notifications = getNotifications();
        showNotifications();
    }
}

function getNotifications() {
    let savedItem = localStorage.getItem("dailyNotifications");
    if (savedItem == null) savedItem = "0";
    splitNotifications = savedItem.split(",");
    return savedItem;
}

function showNotifications() {
    const div = document.getElementById("notifications_div");
    div.innerText = notifications;
}
