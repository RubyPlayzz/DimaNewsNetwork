const themeSelector = document.getElementById("theme-selector");
const themeSelectorText = themeSelector.querySelector("p");
const themeSelectorImage = themeSelector.querySelector("img");

const root = document.documentElement;


// Themes are defined in the script tag inside of header.html
// Change theme is also defined in the script tag
function updateThemeSelector() {
    const theme = window.themes[window.currentThemeIndex];

    themeSelectorText.innerText = theme.name;
    themeSelectorImage.src = theme.image;
}

updateThemeSelector()

themeSelector.addEventListener("click", (event) => {
    console.log("click");
    window.currentThemeIndex++;

    if (window.currentThemeIndex > window.themes.length - 1) window.currentThemeIndex = 0;

    const theme = window.themes[window.currentThemeIndex];

    updateThemeSelector();

    window.changeTheme(window.themes[window.currentThemeIndex]);

    
    if (navigator.cookieEnabled) {
        const encodedTheme = encodeURIComponent(theme.name)

        document.cookie = `userPreferedTheme=${encodedTheme}; path=/`;
    }
});