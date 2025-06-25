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

        // Use the IDs from login.html
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // Try to sign in first
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                // If user not found, show an error. Do not auto-signup from the login form.
                // This is a better user experience than the combined sign-in/sign-up logic.
                showMessage('error', 'Invalid email or password.');
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
    // This line is a correction. The verifier must be attached to the window
    // to be accessible by the signInWithPhoneNumber function and the reset logic.
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
    });

    const phoneForm = document.getElementById('phone-login-form');
    // NOTE: The submit listener on the form is not ideal here because you have
    // buttons with type="button". Let's attach to the button click instead.
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');

    if(phoneInput && countryCodeSelect) {
        phoneInput.addEventListener('input', (e) => {
            // Only apply auto-formatting if USA is selected
            if (countryCodeSelect.value === '+1') {
                let input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
                input = input.substring(0, 10); // Enforce 10 digit limit

                let formattedInput = '';
                if (input.length > 6) {
                    formattedInput = `${input.substring(0, 3)}-${input.substring(3, 6)}-${input.substring(6)}`;
                } else if (input.length > 3) {
                    formattedInput = `${input.substring(0, 3)}-${input.substring(3, 6)}`;
                } else {
                    formattedInput = input;
                }
                e.target.value = formattedInput;
            }
        });
    }

    if(sendCodeBtn) {
        sendCodeBtn.addEventListener('click', async () => {
            const countryCode = document.getElementById('country-code').value;
            const phoneInput = document.getElementById('phone-input').value;
            const phoneNumber = countryCode + phoneInput.replace(/\D/g, '');
            const appVerifier = window.recaptchaVerifier;

            try {
                window.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
                showMessage('success', 'Verification code sent!');
                document.getElementById('phone-entry-step').style.display = 'none';
                document.getElementById('otp-verify-step').style.display = 'block';
            } catch (error) {
                showMessage('error', `SMS sending failed: ${error.message}`);
                // --- SOLUTION ---
                // Add the reset logic here
                appVerifier.render().then(function(widgetId) {
                    grecaptcha.reset(widgetId);
                });
                // --- END SOLUTION ---
            }
        });
    }

    if(verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const code = document.getElementById('otp-input').value;
            try {
                await window.confirmationResult.confirm(code);
            } catch (error) {
                showMessage('error', `Invalid code: ${error.message}`);
            }
        });
    }
}