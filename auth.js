// auth.js - A single, consolidated file for all Firebase Authentication logic.

// --- Modular Imports from Firebase SDK ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// --- Firebase Configuration ---
// This config is now self-contained in this file.
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
// This ensures the app is initialized only once across the entire site.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// --- Global Auth State Listener ---
// Redirects logged-in users away from auth pages.
onAuthStateChanged(auth, (user) => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('cell-login.html');
    if (user && isAuthPage) {
        console.log("User is logged in, redirecting to index.html");
        window.location.href = 'index.html';
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

    // ========== LOGIC FOR login.html PAGE ==========
    if (document.getElementById('login-form')) {
        const loginMessageContainer = document.getElementById('login-message-container');
        const signupMessageContainer = document.getElementById('signup-message-container');
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const googleBtn = document.getElementById('google-signin-btn');

        // Email/Password Login
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            signInWithEmailAndPassword(auth, email, password)
                .catch(error => showMessage('error', `Login failed: ${error.message}`, loginMessageContainer));
        });

        // Email/Password Sign Up
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            // You should add password confirmation and validation logic here
            createUserWithEmailAndPassword(auth, email, password)
                .catch(error => showMessage('error', `Sign up failed: ${error.message}`, signupMessageContainer));
        });

        // Google Sign-in
        googleBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider).catch(error => {
                const activeContainer = document.getElementById('login-view').style.display !== 'none' ? loginMessageContainer : signupMessageContainer;
                showMessage('error', `Google sign-in failed: ${error.message}`, activeContainer);
            });
        });
    }

    // ========== LOGIC FOR cell-login.html PAGE ==========
    if (document.getElementById('phone-login-form')) {
        window.confirmationResult = null;
        const messageContainer = document.getElementById('message-container');
        const recaptchaContainer = document.getElementById('recaptcha-container');

        // Initialize the verifier
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, { 'size': 'invisible' });

        const phoneInput = document.getElementById('phone-input');
        const countryCodeSelect = document.getElementById('country-code');
        const sendCodeBtn = document.getElementById('send-code-btn');
        const phoneEntryStep = document.getElementById('phone-entry-step');
        const otpVerifyStep = document.getElementById('otp-verify-step');
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        const otpInput = document.getElementById('otp-input');

        // "Send Code" button listener
        sendCodeBtn.addEventListener('click', () => {
            const phoneNumber = `${countryCodeSelect.value}${phoneInput.value.replace(/\D/g, '')}`;
            signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
                .then(confirmationResult => {
                    window.confirmationResult = confirmationResult;
                    showMessage('success', 'Verification code sent!', messageContainer);
                    phoneEntryStep.style.display = 'none';
                    otpVerifyStep.style.display = 'block';
                }).catch(error => {
                    showMessage('error', `SMS sending failed: ${error.message}`, messageContainer);
                    if (window.grecaptcha) window.grecaptcha.reset();
                });
        });

        // "Verify Code" button listener
        verifyOtpBtn.addEventListener('click', () => {
            const code = otpInput.value;
            if (code && window.confirmationResult) {
                window.confirmationResult.confirm(code)
                    .catch(error => showMessage('error', `Invalid code: ${error.message}`, messageContainer));
            }
        });
    }
});
