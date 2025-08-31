const hamburgerButton = document.getElementById("link-hamburger-menu");
const dropdownItems = document.getElementById("hamburger-dropdown");

let menuVisible = false;

dropdownItems.style.opacity = "0"; // Hide items at start
dropdownItems.style.pointerEvents = "none";

function ChangeMenuVisibility() {
    menuVisible = !menuVisible; // Invert visibility: if true then false, if false then true

    if (menuVisible) {
        // Show menu \\
        dropdownItems.style.opacity = "1";
        dropdownItems.style.pointerEvents = "all";
    } else {
        // Hide menu \\
        dropdownItems.style.opacity = "0";
        dropdownItems.style.pointerEvents = "none";
    }
}

hamburgerButton.addEventListener("click", (e) => {
    e.stopPropagation() // Stop menu from being hidden

    ChangeMenuVisibility()
})

document.addEventListener("click", () => {
    ChangeMenuVisibility()

    if (menuVisible) {
        ChangeMenuVisibility() // Hide menu
    }
})

dropdownItems.addEventListener("click", (e) => {
    e.stopPropagation(); // Stops menu from being hidden after link is clicked
});

window.addEventListener("resize", () => {
    if (menuVisible) {
        ChangeMenuVisibility() // Hide menu if window is resized
    }
})