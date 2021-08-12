const WDHMS = 7;
const YMDHMS = 6;
const MDHMS = 5;
const DHMS = 4;
const HMS = 3;
const MS = 2;
const S = 1;

var intervalTimer = setInterval(function () { updateEverything(); }, UPDATE_TIME);
var allEvents = [];
var currentFormat = getFormat();

var weeksLeft = 0;
var yearsLeft = 0;
var monthsLeft = 0;
var daysLeft = 0;
var hoursLeft = 0;
var minutesLeft = 0;
var secondsLeft = 0;

var FUTURE_EVENTS = 1;
var PAST_EVENTS = 2;
var ALL_EVENTS = 3;

var pastEventIndexes = [];
var futureEventIndexes = [];

var currentEventsType = ALL_EVENTS;

var eventMoment = null;
var currentMoment = null;
var diff = null;

allEvents = getLocalStorageItem("allEvents");
displayAllEvents(currentEventsType);

function Event(name, dateTime, notifications) {
    this.name = name;
    this.dateTime = dateTime;
    this.notifications = notifications;
}

function updateEverything() {
    updateCurrentTime();
    updateEvents(currentFormat);
}

function addEvent() {
    const formName = document.forms["eventForm"]["name"].value;
    const formTime = document.forms["eventForm"]["dateTime"].value;
    const formNotifications = document.forms["eventForm"]["notifications"].value;
    let notifications = formNotifications.split(",");

    // If the notification input box is empty then create a default notification at 0 seconds
    if (notifications == null || notifications == "") {
        notifications = [0];
    }

    allEvents.push(new Event(formName, formTime, notifications));
    saveEvents();
    displayAllEvents(currentEventsType);
}

function quickAdd(minutes) {
    const formName = document.forms["quickAddForm"]["name"].value;
    let d = new Date(now);
    d.setMinutes(d.getMinutes() + minutes);
    allEvents.push(new Event(formName, convertDateToString(d), [0]));
    saveEvents();
    displayAllEvents(currentEventsType);
}

function convertDateToString(d) {
    const dateYear = d.getFullYear();
    const dateMonth = padNumber(d.getMonth() + 1);
    const dateDay = padNumber(d.getDate());
    const dateHours = padNumber(d.getHours());
    const dateMinutes = padNumber(d.getMinutes());
    const dateSeconds = padNumber(d.getSeconds());
    return `${dateYear}-${dateMonth}-${dateDay} ${dateHours}:${dateMinutes}:${dateSeconds}`;
}

function saveEvents() {
    localStorage.setItem("allEvents", JSON.stringify(allEvents));
}

function deleteEvent(someIndex) {
    allEvents.splice(someIndex, 1);
    saveEvents();
    displayAllEvents(currentEventsType);
}

function displayAllEvents(eventsType) {
    if (eventsType === 1) {
        currentEventsType = FUTURE_EVENTS;
    } else if (eventsType === 2) {
        currentEventsType = PAST_EVENTS;
    } else {
        currentEventsType = ALL_EVENTS;
    }

    deleteClassChildItems("an_event");

    pastEventIndexes = [];
    futureEventIndexes = [];

    for (let i = 0; i < allEvents.length; i++) {
        const dateString = allEvents[i].dateTime;
        const eventDate = returnCorrectDate(dateString);

        if (eventsType === FUTURE_EVENTS || eventsType === PAST_EVENTS) {
            if (hasEventPassed(eventDate)) {
                pastEventIndexes.push(i);
                if (eventsType === FUTURE_EVENTS) {
                    continue;
                }
            } else {
                futureEventIndexes.push(i);
                if (eventsType === PAST_EVENTS) {
                    continue;
                }
            }
        }

        const newElement = document.createElement("fieldset");
        newElement.classList.add("an_event");

        const newLegend = document.createElement("legend");
        const legendContent = document.createTextNode(`(${i + 1}) ${allEvents[i].name}`);
        newLegend.appendChild(legendContent);
        newElement.appendChild(newLegend);

        const indexDiv = document.createElement("div");
        indexDiv.classList.add("index");
        newElement.appendChild(indexDiv);

        const dateDiv = document.createElement("div");
        const twelveHourString = twelveHourTime(eventDate);
        dateDiv.innerHTML = `Date: ${dateString} (${twelveHourString})`;
        newElement.appendChild(dateDiv);

        const dateStringDiv = document.createElement("div");
        dateStringDiv.innerHTML = `Expanded: ${eventDate.toString()}`;
        newElement.appendChild(dateStringDiv);

        const notificationsDiv = document.createElement("div");
        notificationsDiv.innerHTML = `Notifications: ${allEvents[i].notifications}`;
        newElement.appendChild(notificationsDiv);

        const timeDiv = document.createElement("div");
        timeDiv.classList.add("timeUntil");
        newElement.appendChild(timeDiv);

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "Delete";
        deleteButton.classList.add("delete_button");
        deleteButton.onclick = function () { deleteEvent(i); };
        newElement.appendChild(deleteButton);

        const elementBreak = document.createElement("br");
        elementBreak.classList.add("an_event");

        const finalDiv = document.getElementById("users_events");
        finalDiv.appendChild(newElement);
        finalDiv.appendChild(elementBreak);
    }
}

function sortEvents(sortType) {
    if (sortType === 1) {
        allEvents.sort((a, b) => returnCorrectDate(a.dateTime) - returnCorrectDate(b.dateTime));
    } else {
        allEvents.sort((a, b) => returnCorrectDate(b.dateTime) - returnCorrectDate(a.dateTime));
    }
    saveEvents();
    displayAllEvents(currentEventsType);
}

function checkNotifications(someEvent, timeUntil) {
    const notificationStatus = localStorage.getItem("notifications");
    if (notificationStatus !== "enabled") return;
    const notificationsArray = someEvent.notifications;
    const notificationLength = notificationsArray.length;
    const name = someEvent.name;

    // If notification array is empty, notify at 0 seconds
    if (notificationLength == 0 && isTimeToNotify(0, timeUntil)) {
        createNotification(`"${name}" has occurred`, "", true);
    }
    // If notification array has one or more values, check all of them
    else if (notificationLength > 0 && notificationsArray[0] >= 0) {
        for (const currentNumber of notificationsArray) {
            if (isTimeToNotify(currentNumber, timeUntil)) {
                let notificationText = `${currentNumber} minutes until "${name}"`;
                if (currentNumber == 0) notificationText = `"${name}" has occurred`;
                createNotification(notificationText, "", true);
            }
        }
    }
}

function returnCorrectDate(someDate) {
    if (/^[0-9]{8}T[0-9]{6}Z$/.test(someDate)) {
        return moment(someDate, 'YYYYMMDDTHHmmssZ').toDate();
    }
    return new Date(someDate);
}

function updateEvents(someFormat) {
    const allTimes = document.getElementsByClassName("timeUntil");
    let indexesArray = [];

    if (currentEventsType === PAST_EVENTS) {
        indexesArray = [...pastEventIndexes];
    } else if (currentEventsType === FUTURE_EVENTS) {
        indexesArray = [...futureEventIndexes];
    } else {
        indexesArray = [...allEvents];
    }

    for (let i = 0; i < indexesArray.length; i++) {
        let isEventFinished = false;
        let event = "";
        let dateString = "";
        event = (currentEventsType == ALL_EVENTS) ? allEvents[i] : allEvents[indexesArray[i]];

        dateString = event.dateTime;
        const eventDate = returnCorrectDate(dateString);
        const timeToEvent = getMsFromNowUntilDate(eventDate);
        isEventFinished = hasEventPassed(eventDate);
        setTimeLeft(eventDate, someFormat, timeToEvent);

        if (!isEventFinished) {
            checkNotifications(event, timeToEvent);
        }

        let eventType = "";

        if (isEventFinished === true) {
            eventType = "Passed:";
            allTimes[i].style.color = "#FF2400";
        } else {
            eventType = "Upcoming:";
            allTimes[i].style.color = "aqua";
        }

        switch (someFormat) {
            case WDHMS:
                allTimes[i].innerText = `${eventType} ${weeksLeft} weeks, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case YMDHMS:
                allTimes[i].innerText = `${eventType} ${yearsLeft} years, ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case MDHMS:
                allTimes[i].innerText = `${eventType} ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case DHMS:
                allTimes[i].innerText = `${eventType} ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case HMS:
                allTimes[i].innerText = `${eventType} ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case MS:
                allTimes[i].innerText = `${eventType} ${minutesLeft} minutes, ${secondsLeft} seconds`;
                break;
            case S:
                allTimes[i].innerText = `${eventType} ${secondsLeft} seconds`;
                break;
            default:
                allTimes[i].innerText = "Formatting error";
        }
    }
}

function clearEvents() {
    localStorage.removeItem("allEvents");
    localStorage.setItem("allEvents", "[]");
    allEvents = getLocalStorageItem("allEvents");
    displayAllEvents(currentEventsType);
}

function exportEvents(number) {
    if (number === 1) {
        console.log(JSON.stringify(allEvents));
        alert(JSON.stringify(allEvents));
    } else {
        console.log(JSON.stringify(allEvents, null, 2));
        alert(JSON.stringify(allEvents, null, 2));
    }
}

function importEvents() {
    const input = prompt("Enter the text to import");

    if (input == null || input == "") {
        alert("INVALID INPUT");
    } else {
        localStorage.removeItem("allEvents");
        localStorage.setItem("allEvents", input);
        allEvents = getLocalStorageItem("allEvents");
        displayAllEvents(currentEventsType);
    }
}

function changeFormat(someFormat) {
    switch (someFormat) {
        case 7:
            currentFormat = WDHMS;
            break;
        case 6:
            currentFormat = YMDHMS;
            break;
        case 5:
            currentFormat = MDHMS;
            break;
        case 4:
            currentFormat = DHMS;
            break;
        case 3:
            currentFormat = HMS;
            break;
        case 2:
            currentFormat = MS;
            break;
        case 1:
            currentFormat = S;
            break;
        default:
            currentFormat = YMDHMS;
    }

    currentFormat = parseInt(currentFormat, 10);
    localStorage.setItem("currentFormat", currentFormat);
}

function getFormat() {
    let savedItem = localStorage.getItem("currentFormat");
    if (savedItem == null) savedItem = YMDHMS;
    return parseInt(savedItem, 10);
}

function setTimeLeft(eventDate, someFormat, timeMs) {
    switch (someFormat) {
        case WDHMS:
            weeksLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR / HOURS_IN_DAY / DAYS_IN_WEEK);
            timeMs = timeMs - (weeksLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR * HOURS_IN_DAY * DAYS_IN_WEEK);
            daysLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR / HOURS_IN_DAY);
            timeMs = timeMs - (daysLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR * HOURS_IN_DAY);
            hoursLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR);
            timeMs = timeMs - (hoursLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR);
            minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
            timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
            secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
            break;
        case MDHMS:
            eventMoment = moment(eventDate);
            currentMoment = moment(now);
            diff = moment.preciseDiff(eventMoment, currentMoment, true);
            monthsLeft = diff.months + diff.years * MONTHS_IN_YEAR;
            daysLeft = diff.days;
            hoursLeft = diff.hours;
            minutesLeft = diff.minutes;
            secondsLeft = diff.seconds;
            break;
        case DHMS:
            daysLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR / HOURS_IN_DAY);
            timeMs = timeMs - (daysLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR * HOURS_IN_DAY);
            hoursLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR);
            timeMs = timeMs - (hoursLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR);
            minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
            timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
            secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
            break;
        case HMS:
            hoursLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE / MIN_IN_HOUR);
            timeMs = timeMs - (hoursLeft * MS_IN_SECOND * SEC_IN_MINUTE * MIN_IN_HOUR);
            minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
            timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
            secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
            break;
        case MS:
            minutesLeft = Math.floor(timeMs / MS_IN_SECOND / SEC_IN_MINUTE);
            timeMs = timeMs - (minutesLeft * MS_IN_SECOND * SEC_IN_MINUTE);
            secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
            break;
        case S:
            secondsLeft = Math.floor(timeMs / MS_IN_SECOND);
            break;
        default:
            eventMoment = moment(eventDate);
            currentMoment = moment(now);
            diff = moment.preciseDiff(eventMoment, currentMoment, true);
            yearsLeft = diff.years;
            monthsLeft = diff.months;
            daysLeft = diff.days;
            hoursLeft = diff.hours;
            minutesLeft = diff.minutes;
            secondsLeft = diff.seconds;
    }
}
