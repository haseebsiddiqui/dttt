function toggleLightMode() {
    const theme = document.querySelector("#theme-link");
    theme.href = (theme.getAttribute("href") == "css/dark-mode.css") ? "css/light-mode.css" : "css/dark-mode.css";
}
