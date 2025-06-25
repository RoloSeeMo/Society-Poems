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

// --- Utility Functions for showing messages ---
function showMessage(type, text, containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.className = `message-container ${type}-message`;
    container.textContent = text;
    container.style.display = 'block';
}

// --- Email/Password Auth Logic for login.html ---
if (window.location.pathname.includes('login.html')) {
    // This logic remains unchanged as it applies to a different page.
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        // ... (existing email/password login logic)
    }
    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
        // ... (existing google sign-in logic)
    }
}


// --- CORRECTED Phone Number Auth for cell-login.html ---
if (window.location.pathname.includes('cell-login.html')) {
    
    // Set up a global confirmationResult object to store the result from sending the code.
    window.confirmationResult = null;

    // Initialize the reCAPTCHA verifier once the DOM is loaded.
    // It's crucial this only happens once.
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
            console.log("reCAPTCHA solved");
        },
        'expired-callback': () => {
            // Response expired. Ask user to solve reCAPTCHA again.
            showMessage('error', 'reCAPTCHA response expired. Please try sending the code again.');
        }
    });

    // Get all necessary HTML elements
    const phoneInput = document.getElementById('phone-input');
    const countryCodeSelect = document.getElementById('country-code');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const otpInput = document.getElementById('otp-input');
    const phoneEntryStep = document.getElementById('phone-entry-step');
    const otpVerifyStep = document.getElementById('otp-verify-step');

    // Attach listener to the "Send Code" button.
    sendCodeBtn.addEventListener('click', () => {
        const countryCode = countryCodeSelect.value;
        const digitsOnly = phoneInput.value.replace(/\D/g, ''); // Remove non-numeric characters

        if (!digitsOnly) {
            showMessage('error', 'Please enter a valid phone number.');
            return;
        }

        // Combine country code and phone number to create the E.164 format number.
        const phoneNumber = `${countryCode}${digitsOnly}`;
        console.log(`Attempting to send code to formatted number: ${phoneNumber}`);

        const appVerifier = window.recaptchaVerifier;

        // Call Firebase to send the verification code.
        signInWithPhoneNumber(auth, phoneNumber, appVerifier)
            .then((confirmationResult) => {
                // SMS sent. Save confirmation result to verify the code later.
                window.confirmationResult = confirmationResult;
                showMessage('success', 'Verification code sent!');
                // Show the OTP entry field and hide the phone number field.
                phoneEntryStep.style.display = 'none';
                otpVerifyStep.style.display = 'block';
            })
            .catch((error) => {
                // Handle errors like invalid phone number, etc.
                showMessage('error', `SMS sending failed: ${error.message}`);
                // Reset the reCAPTCHA so the user can try again.
                window.recaptchaVerifier.render().then(function(widgetId) {
                    grecaptcha.reset(widgetId);
                });
            });
    });

    // Attach listener to the "Verify Code" button.
    verifyOtpBtn.addEventListener('click', () => {
        const code = otpInput.value;
        if (!code) {
            showMessage('error', 'Please enter the verification code.');
            return;
        }
        if (!window.confirmationResult) {
            showMessage('error', 'Please request a code first.');
            return;
        }

        // Use the saved confirmationResult to confirm the user's code.
        window.confirmationResult.confirm(code)
            .then((result) => {
                // User signed in successfully.
                // The onAuthStateChanged listener in app.js will handle the redirect.
                console.log("Phone number authentication successful:", result.user);
            })
            .catch((error) => {
                // Handle errors like an invalid code.
                showMessage('error', `Invalid code: ${error.message}`);
            });
    });

    // Added the auto-formatting logic for the phone number input
    phoneInput.addEventListener('input', (e) => {
        if (countryCodeSelect.value === '+1') {
            let input = e.target.value.replace(/\D/g, '').substring(0, 10);
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
