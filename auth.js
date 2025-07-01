// auth.js - A single file for all Firebase Authentication logic.

// --- Modular Imports from Firebase SDK ---
import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup
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

// --- Utility Function for showing messages ---
function showMessage(type, text, container) {
    if (!container) return;
    container.className = `message-container ${type}-message`;
    container.textContent = text;
    container.style.display = 'block';
}

// --- Main Logic (runs after the page is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- ** INACTIVITY TIMEOUT LOGIC ** ---
    let inactivityTimer;

    function logoutDueToInactivity() {
        auth.signOut().then(() => {
            // Redirect to login with a message
            window.location.href = '/login.html?reason=inactivity';
        });
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        // Set timeout to 10 minutes (10 * 60 * 1000 milliseconds)
        inactivityTimer = setTimeout(logoutDueToInactivity, 300000);
    }

    // Events that reset the timer
    window.onload = resetInactivityTimer;
    document.onmousemove = resetInactivityTimer;
    document.onmousedown = resetInactivityTimer; 
    document.ontouchstart = resetInactivityTimer;
    document.onclick = resetInactivityTimer;
    document.onkeydown = resetInactivityTimer;
    document.addEventListener('scroll', resetInactivityTimer, true);
    // --- ** FIN INACTIVITY TIMEOUT LOGIC ** ---


    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const createUsernameView = document.getElementById('create-username-view');

    function showCreateUsernameForm() {
        if (loginView && signupView && createUsernameView) {
            loginView.style.display = 'none';
            signupView.style.display = 'none';
            createUsernameView.style.display = 'block';
        }
    }

    // --- ** MASTER AUTHENTICATION GATEKEEPER ** ---
    onAuthStateChanged(auth, async (user) => {
        const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('cell-login.html');

        if (user) {
            // A user is logged in. Start the inactivity timer.
            resetInactivityTimer();

            const userRef = ref(db, 'users/' + user.uid);
            const snapshot = await get(userRef);
            const usernameValidationRegex = /^[a-zA-Z0-9]+$/;

            let isProfileCompleteAndValid = false;

            if (snapshot.exists()) {
                const userData = snapshot.val();
                const hasValidUsername = userData.username && usernameValidationRegex.test(userData.username);

                if (hasValidUsername) {
                    if (!userData.username_lowercase) {
                        await set(userRef, { ...userData, username_lowercase: userData.username.toLowerCase() });
                    }
                    isProfileCompleteAndValid = true;
                }
            }

            if (isProfileCompleteAndValid) {
                if (isAuthPage) {
                    window.location.href = 'index.html';
                }
            } else {
                if (!isAuthPage) {
                    window.location.href = 'login.html';
                } else {
                    showCreateUsernameForm();
                }
            }
        } else {
            // No user is signed in. Stop the inactivity timer.
            clearTimeout(inactivityTimer);
            if (!isAuthPage) {
                window.location.href = 'login.html';
            }
        }
    });

    // ========== LOGIC FOR login.html PAGE ==========
    if (document.getElementById('login-form')) {
        // Display inactivity message if applicable
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reason') === 'inactivity') {
            const loginMessageContainer = document.getElementById('login-message-container');
            showMessage('info', 'You have been logged out due to inactivity.', loginMessageContainer);
        }

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
                .catch(error => showMessage('error', `Sign up failed: ${error.message}`, signupMessageContainer));
        });

        googleBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            signInWithPopup(auth, provider)
                .catch(error => {
                    const activeContainer = document.getElementById('login-view').style.display !== 'none' ? loginMessageContainer : signupMessageContainer;
                    showMessage('error', `Google sign-in failed: ${error.message}`, activeContainer);
                });
        });

        createUsernameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const user = auth.currentUser;
            
            if (!user) {
                showMessage('error', 'You are not logged in.', usernameMessageContainer);
                return;
            }

            const usernameValidationRegex = /^[a-zA-Z0-9]+$/;
            if (!usernameValidationRegex.test(username)) {
                showMessage('error', 'Username can only contain letters and numbers, with no spaces.', usernameMessageContainer);
                return;
            }

            const lowercaseUsername = username.toLowerCase();

            try {
                const usersRef = ref(db, 'users');
                const usernameQuery = query(usersRef, orderByChild('username_lowercase'), equalTo(lowercaseUsername));
                const snapshot = await get(usernameQuery);

                if (snapshot.exists()) {
                    showMessage('error', 'This username is already taken. Please choose another.', usernameMessageContainer);
                } else {
                    const userRef = ref(db, 'users/' + user.uid);
                    await set(userRef, {
                        username: username,
                        username_lowercase: lowercaseUsername,
                        email: user.email
                    });
                }
            } catch (error) {
                showMessage('error', `An error occurred: ${error.message}`, usernameMessageContainer);
            }
        });
    }


    // // ========== LOGIC FOR cell-login.html PAGE (in progress/development) ==========
    // if (document.getElementById('phone-login-form')) {
    //     const messageContainer = document.getElementById('message-container');
    //     const recaptchaContainer = document.getElementById('recaptcha-container');
    //     window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, { 'size': 'invisible' });

    //     const sendCodeBtn = document.getElementById('send-code-btn');
    //     sendCodeBtn.addEventListener('click', () => {
    //         const countryCode = document.getElementById('country-code').value;
    //         const phoneInput = document.getElementById('phone-input').value;
    //         const phoneNumber = `${countryCode}${phoneInput.replace(/\D/g, '')}`;

    //         signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
    //             .then(confirmationResult => {
    //                 window.confirmationResult = confirmationResult;
    //                 showMessage('success', 'Verification code sent!', messageContainer);
    //                 document.getElementById('phone-entry-step').style.display = 'none';
    //                 document.getElementById('otp-verify-step').style.display = 'block';
    //             }).catch(error => {
    //                 showMessage('error', `SMS sending failed: ${error.message}`, messageContainer);
    //                 if (window.grecaptcha) window.grecaptcha.reset();
    //             });
    //     });

    //     const verifyOtpBtn = document.getElementById('verify-otp-btn');
    //     verifyOtpBtn.addEventListener('click', () => {
    //         const code = document.getElementById('otp-input').value;
    //         if (code && window.confirmationResult) {
    //             window.confirmationResult.confirm(code)
    //                 .then((result) => {
    //                     const user = result.user;
    //                     const userRef = ref(db, 'users/' + user.uid);
    //                     get(userRef).then((snapshot) => {
    //                         if (snapshot.exists() && snapshot.val().username) {
    //                             window.location.href = 'index.html';
    //                         } else {
    //                             showCreateUsernameForm();
    //                         }
    //                     });
    //                 })
    //                 .catch(error => showMessage('error', `Invalid code: ${error.message}`, messageContainer));
    //         } else {
    //             showMessage('error', 'Please enter a valid code.', messageContainer);
    //         }
    //     });
    // }
});
