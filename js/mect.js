var intervalTimer = setInterval(function () { updateEverything(); }, UPDATE_TIME);
var allEvents = [];
var currentFormat = getFormat();

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
    const dateYear = d.getFullYear();
    const dateMonth = padNumber(d.getMonth() + 1);
    const dateDay = padNumber(d.getDate());
    const dateHours = padNumber(d.getHours());
    const dateMinutes = padNumber(d.getMinutes());
    const dateSeconds = padNumber(d.getSeconds());
    const dateString = `${dateYear}-${dateMonth}-${dateDay} ${dateHours}:${dateMinutes}:${dateSeconds}`;
    allEvents.push(new Event(formName, dateString, 0));
    saveEvents();
    displayAllEvents(currentEventsType);
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
        const eventDate = new Date(dateString);

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
        allEvents.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    } else {
        allEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
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
    if (notificationLength == 0 && notificationStatus === "enabled" && isTimeToNotify(0, timeUntil)) {
        createNotification(`"${name}" has occurred`, "", true);
    }
    // If notification array has one or more values, check all of them
    else if (notificationStatus === "enabled" && notificationLength > 0 && notificationsArray[0] >= 0) {
        for (const currentNumber of notificationsArray) {
            if (isTimeToNotify(currentNumber, timeUntil)) {
                let notificationText = `${currentNumber} minutes until "${name}"`;
                if (currentNumber == 0) notificationText = `"${name}" has occurred`;
                createNotification(notificationText, "", true);
            }
        }
    }
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
        const eventDate = new Date(dateString);
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

        if (someFormat == YMDHMS) {
            allTimes[i].innerText = `${eventType} ${yearsLeft} years, ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
        } else if (someFormat == MDHMS) {
            allTimes[i].innerText = `${eventType} ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
        } else if (someFormat == DHMS) {
            allTimes[i].innerText = `${eventType} ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
        } else if (someFormat == HMS) {
            allTimes[i].innerText = `${eventType} ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
        } else if (someFormat == MS) {
            allTimes[i].innerText = `${eventType} ${minutesLeft} minutes, ${secondsLeft} seconds`;
        } else if (someFormat == S) {
            allTimes[i].innerText = `${eventType} ${secondsLeft} seconds`;
        } else {
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
    if (someFormat === 6) {
        currentFormat = YMDHMS;
    } else if (someFormat === 5) {
        currentFormat = MDHMS;
    } else if (someFormat === 4) {
        currentFormat = DHMS;
    } else if (someFormat === 3) {
        currentFormat = HMS;
    } else if (someFormat === 2) {
        currentFormat = MS;
    } else if (someFormat === 1) {
        currentFormat = S;
    } else {
        currentFormat = YMDHMS;
    }
    localStorage.setItem("currentFormat", currentFormat);
}

function getFormat() {
    let savedItem = localStorage.getItem("currentFormat");
    if (savedItem == null) savedItem = YMDHMS;
    return savedItem;
}
