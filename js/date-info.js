var intervalTimer = setInterval(function () { updateEverything(); }, UPDATE_TIME);

function updateEverything() {
    updateCurrentTime();
}

var input = document.getElementById("input-box");
var inputValue = document.getElementById("input-box").value;

input.addEventListener("keypress", function () {
    inputValue = document.getElementById("input-box").value;
    const infoDiv = document.getElementById("info_div");
    const tempDate = new Date(inputValue);
    infoDiv.innerText = `Default parsing:\n${tempDate.toString()} (${twelveHourTime(tempDate)})`;
    infoDiv.innerText += `\n\nUTC time:\n${tempDate.toISOString()}`;
});
