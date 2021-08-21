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

function updateEventStatistics() {
    let numberOfPastEvents = 0;
    let numberOfFutureEvents = 0;

    for (const someEvent of allEvents) {
        if (hasEventPassed(returnCorrectDate(someEvent.dateTime))) {
            numberOfPastEvents += 1;
        } else {
            numberOfFutureEvents += 1;
        }
    }

    const statisticsDiv = document.getElementById("statistics_div");
    statisticsDiv.innerText = `Total number of events: ${allEvents.length}\nPassed: ${numberOfPastEvents}\nUpcoming: ${numberOfFutureEvents}`;
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
        const endDateString = allEvents[i].endDateTime;
        let eventEndDate = null;
        let endDateExists = false;

        if (endDateString !== undefined) {
            endDateExists = true;
            eventEndDate = returnCorrectDate(endDateString);
        }

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

        const timeDiv = document.createElement("div");
        timeDiv.classList.add("timeUntil");
        newElement.appendChild(timeDiv);

        const endDateDiv = document.createElement("div");
        const endDateStringDiv = document.createElement("div");
        const endTimeDiv = document.createElement("div");
        const percentDiv = document.createElement("div");

        if (endDateExists) {
            const endTwelveHourString = twelveHourTime(eventEndDate);
            endDateDiv.innerHTML = `End Date: ${endDateString} (${endTwelveHourString})`;
            endDateStringDiv.innerHTML = `Expanded: ${eventEndDate.toString()}`;
        }

        endTimeDiv.classList.add("endTimeUntil");
        percentDiv.classList.add("percent");
        newElement.appendChild(endDateDiv);
        newElement.appendChild(endDateStringDiv);
        newElement.appendChild(endTimeDiv);
        newElement.appendChild(percentDiv);

        const notificationsDiv = document.createElement("div");
        notificationsDiv.innerHTML = `Notifications: ${allEvents[i].notifications}`;
        newElement.appendChild(notificationsDiv);

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
    const notificationStatus = getNotificationStatus();
    if (notificationStatus !== "enabled") return;
    const notificationsArray = someEvent.notifications;
    if (notificationsArray == null) return;
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

function returnCorrectDate(someDateString) {
    if (/^[0-9]{8}T[0-9]{6}Z$/.test(someDateString)) {
        return moment(someDateString, 'YYYYMMDDTHHmmssZ').toDate();
    }
    return new Date(someDateString);
}

function getCorrectIndexArray(eventType) {
    switch (eventType) {
        case ALL_EVENTS:
            return [...allEvents];
        case FUTURE_EVENTS:
            return [...futureEventIndexes];
        case PAST_EVENTS:
            return [...pastEventIndexes];
        default:
            return [...allEvents];
    }
}

function updateEvents(someFormat) {
    const timeElements = document.getElementsByClassName("timeUntil");
    const endTimeElements = document.getElementsByClassName("endTimeUntil");
    const percentElements = document.getElementsByClassName("percent");
    const passedColor = "#ff000d";
    const upcomingColor = "#34eb4c";
    let percentString = "";
    let eventType = "";
    let indexesArray = [];

    indexesArray = getCorrectIndexArray(currentEventsType);

    for (let i = 0; i < indexesArray.length; i++) {
        const event = (currentEventsType == ALL_EVENTS) ? allEvents[i] : allEvents[indexesArray[i]];
        const dateString = event.dateTime;
        const eventDate = returnCorrectDate(dateString);
        const endDateString = event.endDateTime;

        if (endDateString !== undefined) {
            const eventEndDate = returnCorrectDate(endDateString);
            const hasEndPassed = hasEventPassed(eventEndDate);

            if (hasEndPassed) {
                eventType = "Passed:";
                endTimeElements[i].style.color = passedColor;
            } else {
                eventType = "Upcoming:";
                endTimeElements[i].style.color = upcomingColor;
            }

            const timeToEndEvent = getMsFromNowUntilDate(eventEndDate);
            setTimeLeft(eventEndDate, someFormat, timeToEndEvent);
            setInnerText(endTimeElements[i], someFormat, eventType);

            const duration = Math.abs(eventDate.getTime() - eventEndDate.getTime());
            const percentFinished = (duration - timeToEndEvent) / duration * 100;

            if (percentFinished > 100 || percentFinished < 0 || hasEndPassed) {
                percentString = `--- finished, --- left`;
            } else {
                percentString = `${percentFinished.toFixed(3)} finished, ${(100 - percentFinished).toFixed(3)} left`;
            }

            percentElements[i].innerText = percentString;
        }

        const timeToEvent = getMsFromNowUntilDate(eventDate);
        const isEventFinished = hasEventPassed(eventDate);
        setTimeLeft(eventDate, someFormat, timeToEvent);

        if (!isEventFinished) {
            checkNotifications(event, timeToEvent);
        }

        if (isEventFinished) {
            eventType = "Passed:";
            timeElements[i].style.color = passedColor;
        } else {
            eventType = "Upcoming:";
            timeElements[i].style.color = upcomingColor;
        }

        setInnerText(timeElements[i], someFormat, eventType);
    }
}

function setInnerText(someElement, someFormat, eventType) {
    switch (someFormat) {
        case WDHMS:
            someElement.innerText = `${eventType} ${weeksLeft} weeks, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case YMDHMS:
            someElement.innerText = `${eventType} ${yearsLeft} years, ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case MDHMS:
            someElement.innerText = `${eventType} ${monthsLeft} months, ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case DHMS:
            someElement.innerText = `${eventType} ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case HMS:
            someElement.innerText = `${eventType} ${hoursLeft} hours, ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case MS:
            someElement.innerText = `${eventType} ${minutesLeft} minutes, ${secondsLeft} seconds`;
            break;
        case S:
            someElement.innerText = `${eventType} ${secondsLeft} seconds`;
            break;
        default:
            someElement.innerText = "Error";
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
        prompt("Copy this text", JSON.stringify(allEvents));
        alert(JSON.stringify(allEvents));
    } else {
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
