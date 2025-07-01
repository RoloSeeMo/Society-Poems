// auth.js - A single, consolidated file for all Firebase Authentication logic.

// --- Modular Imports from Firebase SDK ---
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { equalTo, get, getDatabase, orderByChild, query, ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDHXEMtVPn46b2qS1CPGUIEuQ8ntLyvLVM",
    authDomain: "society-poems-97f4d.firebaseapp.com",
    databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
    projectId: "society-poems-97f4d",
    storageBucket: "society-poems-97f4d.firebasestorage.app",
    messagingSenderId: "723670230106",
    appId: "1:723670230106:web:6d6dda4f8c46626c55a463"
};

// --- Defensive Firebase App and Auth Initialization ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

// --- Global Auth State Listener ---
onAuthStateChanged(auth, (user) => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('cell-login.html');
    if (user && isAuthPage) {
        // Redirection is handled manually after username creation
    }
});

// --- Utility Function for showing messages ---
function showMessage(type, text, container) {
    if (!container) return;
    container.className = `message-container ${type}-message`;
    container.textContent = text;
    container.style.display = 'block';
}

// --- Main Logic (runs after the page is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {

    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const createUsernameView = document.getElementById('create-username-view');

    function showCreateUsernameForm() {
        loginView.style.display = 'none';
        signupView.style.display = 'none';
        createUsernameView.style.display = 'block';
    }

    // ========== LOGIC FOR login.html PAGE ==========
    if (document.getElementById('login-form')) {
        const loginMessageContainer = document.getElementById('login-message-container');
        const signupMessageContainer = document.getElementById('signup-message-container');
        const usernameMessageContainer = document.getElementById('username-message-container');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const createUsernameForm = document.getElementById('create-username-form');
        const googleBtn = document.getElementById('google-signin-btn');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // ... (login logic remains the same)
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // ... (signup logic remains the same)
        });

        googleBtn.addEventListener('click', () => {
            // ... (Google sign-in logic remains the same)
        });

        // --- ** USERNAME CREATION WITH VALIDATION AND UNIQUENESS CHECK ** ---
        createUsernameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const user = auth.currentUser;
            
            if (!user) {
                showMessage('error', 'You are not logged in.', usernameMessageContainer);
                return;
            }

            // 1. Validate the format (alphanumeric, no spaces)
            const usernameValidationRegex = /^[a-zA-Z0-9]+$/;
            if (!usernameValidationRegex.test(username)) {
                showMessage('error', 'Username can only contain letters and numbers, with no spaces.', usernameMessageContainer);
                return;
            }

            // 2. Check if the username is already taken
            try {
                const usersRef = ref(db, 'users');
                const usernameQuery = query(usersRef, orderByChild('username'), equalTo(username));
                const snapshot = await get(usernameQuery);

                if (snapshot.exists()) {
                    // Username is already taken
                    showMessage('error', 'This username is already taken. Please choose another.', usernameMessageContainer);
                } else {
                    // Username is available, proceed to save it
                    const userRef = ref(db, 'users/' + user.uid);
                    await set(userRef, {
                        username: username,
                        email: user.email
                    });
                    // Success, redirect to the main page
                    window.location.href = 'index.html';
                }
            } catch (error) {
                showMessage('error', `An error occurred: ${error.message}`, usernameMessageContainer);
            }
        });
    }
});