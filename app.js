// app.js
// This script contains shared JavaScript logic that runs on every page of the website.
// It handles core functionalities like checking user authentication status,
// managing user logout, and controlling the responsive mobile navigation menu.

// Import necessary functions from the Firebase SDK and the local config file.
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { auth } from './firebase-config.js';

/**
 * Checks the user's current authentication state.
 * This is a crucial security and UX function. It ensures that:
 * 1. Unauthorized users cannot access protected pages (and are redirected to login).
 * 2. Logged-in users who land on a login page are redirected to the homepage.
 */
const checkAuthState = () => {
    onAuthStateChanged(auth, user => {
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('cell-login.html');
        
        if (!user && !isAuthPage) {
            console.log("User not authenticated. Redirecting to login.");
            window.location.href = 'login.html';
        } else if (user && isAuthPage) {
            console.log("User already authenticated. Redirecting to home.");
            window.location.href = 'index.html';
        } else {
            // Make the page visible only after the check is complete.
            document.body.style.visibility = 'visible';
        }
    });
};

/**
 * Attaches a click event listener to the logout button.
 * When clicked, it signs the user out of Firebase and redirects to the login page.
 */
const handleLogout = () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).catch(error => console.error('Sign out error', error));
        });
    }
};

/**
 * Sets up the event listeners for the mobile navigation menu (hamburger menu).
 * Toggles the 'active' class to slide the menu in and out.
 * THIS IS THE CRITICAL FUNCTION FOR THE MENU BUTTON.
 */
const setupMobileMenu = () => {
    const openBtn = document.getElementById('menu-open-button');
    const closeBtn = document.getElementById('menu-close-button');
    const navMenu = document.querySelector('.nav-menu');

    // We must ensure all three elements exist before adding listeners.
    if (openBtn && closeBtn && navMenu) {
        console.log("Menu elements found. Attaching listeners.");
        
        openBtn.addEventListener('click', () => {
            console.log("Menu open button clicked.");
            navMenu.classList.add('active');
        });

        closeBtn.addEventListener('click', () => {
            console.log("Menu close button clicked.");
            navMenu.classList.remove('active');
        });
    } else {
        console.error("Could not find one or more menu elements required for setup.");
    }
};

// --- Main Execution ---
// The 'DOMContentLoaded' event ensures that this entire block of code
// runs only AFTER the browser has finished loading and parsing the whole HTML document.
// This is the most reliable way to prevent JavaScript from running too early.
document.addEventListener('DOMContentLoaded', () => {
    // Hide the body to prevent a "flash" of content before the auth check completes.
    document.body.style.visibility = 'hidden';
    
    // Initialize all core functionalities.
    setupMobileMenu(); // Setup the menu listeners.
    handleLogout();    // Setup the logout button.
    checkAuthState();  // Check if the user is logged in and handle redirects.
});
