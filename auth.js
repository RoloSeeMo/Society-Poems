// auth.js - Handles all Firebase Authentication logic

// --- Modular Imports from Firebase SDK ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// --- Firebase Configuration (copied here for self-sufficiency) ---
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
// This pattern prevents "duplicate app" errors when navigating between pages.
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp(); // Use the existing app if one has been initialized.
}
const auth = getAuth(app); // Get a guaranteed-valid Auth instance.


// --- Utility Function for showing messages ---
function showMessage(type, text, containerId = 'message-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.className = `message-container ${type}-message`;
    container.textContent = text;
    container.style.display = 'block';
}

// --- Main Logic (runs after the page is fully loaded) ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Email/Password Auth Logic for login.html ---
    if (window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                try {
                    await signInWithEmailAndPassword(auth, email, password);
                } catch (error) {
                    showMessage('error', `Login failed: ${error.message}`, 'login-message-container');
                }
            });
        }
        
        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const provider = new GoogleAuthProvider();
                try {
                    await signInWithPopup(auth, provider);
                } catch (error) {
                    const loginView = document.getElementById('login-view');
                    const messageContainerId = loginView.style.display !== 'none' ? 'login-message-container' : 'signup-message-container';
                    showMessage('error', `Google sign-in failed: ${error.message}`, messageContainerId);
                }
            });
        }
    }

    // --- CORRECTED Phone Number Auth for cell-login.html ---
    if (window.location.pathname.includes('cell-login.html')) {
        
        window.confirmationResult = null;
        const recaptchaContainer = document.getElementById('recaptcha-container');

        if (recaptchaContainer) {
            // Initialize the verifier with our defensively-created auth instance.
            window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
                'size': 'invisible',
                'callback': (response) => {
                    console.log("reCAPTCHA solved, ready to send code.");
                },
                'expired-callback': () => {
                    showMessage('error', 'reCAPTCHA response expired. Please try again.');
                }
            });
        } else {
            console.error("Fatal Error: reCAPTCHA container div not found on page.");
            return;
        }

        const phoneInput = document.getElementById('phone-input');
        const countryCodeSelect = document.getElementById('country-code');
        const sendCodeBtn = document.getElementById('send-code-btn');
        const verifyOtpBtn = document.getElementById('verify-otp-btn');
        const otpInput = document.getElementById('otp-input');
        const phoneEntryStep = document.getElementById('phone-entry-step');
        const otpVerifyStep = document.getElementById('otp-verify-step');

        sendCodeBtn.addEventListener('click', () => {
            const countryCode = countryCodeSelect.value;
            const digitsOnly = phoneInput.value.replace(/\D/g, ''); 

            if (!digitsOnly) {
                showMessage('error', 'Please enter a valid phone number.');
                return;
            }

            const phoneNumber = `${countryCode}${digitsOnly}`;
            const appVerifier = window.recaptchaVerifier;

            signInWithPhoneNumber(auth, phoneNumber, appVerifier)
                .then((confirmationResult) => {
                    window.confirmationResult = confirmationResult;
                    showMessage('success', 'Verification code sent!');
                    phoneEntryStep.style.display = 'none';
                    otpVerifyStep.style.display = 'block';
                })
                .catch((error) => {
                    showMessage('error', `SMS sending failed: ${error.message}`);
                    if (window.grecaptcha && window.recaptchaVerifier) {
                       window.recaptchaVerifier.render().then((widgetId) => {
                           grecaptcha.reset(widgetId);
                       });
                    }
                });
        });

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

            window.confirmationResult.confirm(code)
                .then((result) => {
                    console.log("Phone number authentication successful:", result.user);
                })
                .catch((error) => {
                    showMessage('error', `Invalid code: ${error.message}`);
                });
        });

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
});
