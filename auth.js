// auth.js - Handles all Firebase Authentication logic

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { auth } from './firebase-config.js';

// --- Utility Functions ---
const messageContainer = document.getElementById('message-container');

function showMessage(type, text) {
    if (!messageContainer) return;
    messageContainer.className = `message-container ${type}-message`;
    messageContainer.textContent = text;
    messageContainer.style.display = 'block';
}

// --- Email/Password Auth ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            // Try to sign in first
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                // If user not found, try to create a new account
                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                } catch (createError) {
                    showMessage('error', `Sign up failed: ${createError.message}`);
                }
            } else {
                showMessage('error', `Login failed: ${error.message}`);
            }
        }
    });
}

// --- Google Sign-in ---
const googleBtn = document.getElementById('google-signin-btn');
if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            showMessage('error', `Google sign-in failed: ${error.message}`);
        }
    });
}

// --- Phone Number Auth ---
if (window.location.pathname.includes('cell-login.html')) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
    });

    const phoneForm = document.getElementById('phone-login-form');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');

    phoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phoneNumber = document.getElementById('phone-input').value;
        const appVerifier = window.recaptchaVerifier;
        try {
            window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            showMessage('success', 'Verification code sent!');
            document.getElementById('phone-entry-step').style.display = 'none';
            document.getElementById('otp-verify-step').style.display = 'block';
        } catch (error) {
            showMessage('error', `SMS sending failed: ${error.message}`);
        }
    });

    verifyOtpBtn.addEventListener('click', async () => {
        const code = document.getElementById('otp-input').value;
        try {
            await window.confirmationResult.confirm(code);
            // On success, auth state change is handled by app.js
        } catch (error) {
            showMessage('error', `Invalid code: ${error.message}`);
        }
    });
}