// firebase-config.js

// Import the necessary functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDHXEMtVPn46b2qS1CPGUIEuQ8ntLyvLVM",
    authDomain: "society-poems-97f4d.firebaseapp.com",
    databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
    projectId: "society-poems-97f4d",
    storageBucket: "society-poems-97f4d.firebasestorage.app",
    messagingSenderId: "723670230106",
    appId: "1:723670230106:web:6d6dda4f8c46626c55a463"
};

// Initialize Firebase and Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Wait for the DOM to fully load before running any scripts
document.addEventListener("DOMContentLoaded", () => {

    // Get references to all the HTML elements we need to interact with
    const phoneLoginForm = document.getElementById('phone-login-form');
    const phoneInput = document.getElementById('phone-input');
    const enterBtn = document.getElementById('enterBTN');
    const otpStep = document.getElementById('otp-verify-step');
    const phoneStep = document.getElementById('phone-entry-step');
    const otpInput = document.getElementById('otp-input');
    const verifyOTPBtn = document.getElementById('verifyOTPBtn');
    const errorContainer = document.getElementById('error-container');
    const successContainer = document.getElementById('success-container');

    // Set up the invisible reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'enterBTN', {
        'size': 'invisible'
    });

    // Event listener to handle the "Send Code" button click
    phoneLoginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent the form from submitting the traditional way
        hideError();
        hideSuccess();

        let phoneNumber = phoneInput.value.replace(/\D/g, ''); // Remove non-numeric characters
        if (!phoneNumber.startsWith('1')) {
           phoneNumber = '1' + phoneNumber; // Ensure US country code is present
        }

        const appVerifier = window.recaptchaVerifier;

        signInWithPhoneNumber(auth, `+${phoneNumber}`, appVerifier)
            .then((confirmationResult) => {
                window.confirmationResult = confirmationResult; // Store for later use
                showSuccess('A verification code has been sent to your phone.');
                phoneStep.style.display = 'none'; // Hide phone input
                otpStep.style.display = 'block'; // Show OTP input
                otpInput.focus();
            })
            .catch((error) => {
                console.error("Error sending SMS:", error);
                showError(`Error: ${error.message}`);
                // Reset reCAPTCHA if something goes wrong
                window.recaptchaVerifier.render().then((widgetId) => {
                    grecaptcha.reset(widgetId);
                });
            });
    });

    // Event listener to handle the "Verify Code" button click
    verifyOTPBtn.addEventListener('click', () => {
        const code = otpInput.value;
        if (!code || code.length < 6) {
            showError("Please enter the 6-digit verification code.");
            return;
        }
        hideError();

        window.confirmationResult.confirm(code).then((result) => {
            const user = result.user;
            showSuccess('Successfully logged in! You can now be redirected.');
            console.log("User signed in:", user);
            // On success, you would typically redirect the user
            // Example: window.location.href = "index.html";
        }).catch((error) => {
            console.error("Error verifying code:", error);
            showError("The verification code is invalid. Please try again.");
        });
    });

    // Helper functions to show and hide error/success messages
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }

    function hideError() {
        errorContainer.style.display = 'none';
    }

    function showSuccess(message) {
        successContainer.textContent = message;
        successContainer.style.display = 'block';
    }

    function hideSuccess() {
        successContainer.style.display = 'none';
    }
});