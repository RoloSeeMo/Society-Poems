// auth.js - A single, consolidated file for all Firebase Authentication logic.

// --- Modular Imports from Firebase SDK ---
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { get, getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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
        // We will now handle redirection manually after username creation
        // window.location.href = 'index.html';
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
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            signInWithEmailAndPassword(auth, email, password)
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => showMessage('error', `Login failed: ${error.message}`, loginMessageContainer));
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                showMessage('error', 'Passwords do not match.', signupMessageContainer);
                return;
            }
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // New user is created, now show the username form.
                    showCreateUsernameForm();
                })
                .catch(error => showMessage('error', `Sign up failed: ${error.message}`, signupMessageContainer));
        });

        googleBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            
            provider.setCustomParameters({
            prompt: 'select_account'
            });

            signInWithPopup(auth, provider)
                .then((result) => {
                    const user = result.user;
                    const userRef = ref(db, 'users/' + user.uid);
                    get(userRef).then((snapshot) => {
                        if (snapshot.exists() && snapshot.val().username) {
                            window.location.href = 'index.html';
                        } else {
                            showCreateUsernameForm();
                        }
                    });
                })
                .catch(error => {
                    const activeContainer = document.getElementById('login-view').style.display !== 'none' ? loginMessageContainer : signupMessageContainer;
                    showMessage('error', `Google sign-in failed: ${error.message}`, activeContainer);
                });
        });

        // --- ** USERNAME CREATION WITH VALIDATION ** ---
        createUsernameForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const user = auth.currentUser;

            // 1. Define the validation rule (alphanumeric, no spaces)
            const usernameValidationRegex = /^[a-zA-Z0-9]+$/;

            // 2. Test the username against the rule
            if (!usernameValidationRegex.test(username)) {
                showMessage('error', 'Username can only contain letters and numbers, with no spaces.', usernameMessageContainer);
                return; // Stop the submission if invalid
            }

            // 3. If valid, proceed with saving to the database
            if (user && username) {
                const userRef = ref(db, 'users/' + user.uid);
                set(userRef, {
                    username: username,
                    email: user.email
                }).then(() => {
                    window.location.href = 'index.html';
                }).catch(error => {
                    showMessage('error', `Failed to save username: ${error.message}`, usernameMessageContainer);
                });
            }
        });
    }

    // ========== LOGIC FOR cell-login.html PAGE ==========
    if (document.getElementById('phone-login-form')) {
        // ... (rest of your cell-login logic remains unchanged)
    }
});