// debug.js
// This script ONLY contains the logic for the mobile menu.
// There is no Firebase code here.

/**
 * Sets up the event listeners for the mobile navigation menu (hamburger menu).
 * Toggles the 'active' class to slide the menu in and out.
 */
const setupMobileMenu = () => {
    const openBtn = document.getElementById('menu-open-button');
    const closeBtn = document.getElementById('menu-close-button');
    const navMenu = document.querySelector('.nav-menu');

    // We must ensure all three elements exist before adding listeners.
    if (openBtn && closeBtn && navMenu) {
        console.log("DEBUG: Menu elements found. Attaching listeners.");
        
        openBtn.addEventListener('click', () => {
            console.log("DEBUG: Menu open button clicked.");
            navMenu.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            console.log("DEBUG: Menu close button clicked.");
            navMenu.classList.remove('active');
        });
    } else {
        console.error("DEBUG: Could not find one or more menu elements required for setup.");
    }
};

// --- Main Execution ---
// Run the menu setup function after the page has loaded.
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG: Page loaded. Running setupMobileMenu().");
    setupMobileMenu();
});