const OpenMenuButton = document.querySelector("#menu-open-button");
const CloseMenuButton = document.querySelector("#menu-close-button");


OpenMenuButton.addEventListener("click", ()=> {
    document.body.classList.toggle("show-mobile-menu");
});

CloseMenuButton.addEventListener("click", ()=> OpenMenuButton.click());