// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js'; // Import auth from centralized config
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Ensure reCAPTCHA is initialized after the DOM is fully loaded
// and grecaptcha is available.
document.addEventListener('DOMContentLoaded', () => {
  // A function to try initializing RecaptchaVerifier, with a retry mechanism
  const initializeRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
      // grecaptcha.render exists, meaning the reCAPTCHA API is fully loaded
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'enterBTN', {
        'size': 'invisible', // Use 'invisible' to not show the widget immediately
        'callback': (response) => {
          // reCAPTCHA solved. For invisible reCAPTCHA, this means the user passed.
          console.log("reCAPTCHA invisible callback triggered.");
          // The sendOtp() function is called directly by the button's onclick,
          // so no need to call it here. This callback just signifies reCAPTCHA success.
        },
        'error-callback': (error) => {
          console.error("reCAPTCHA error:", error);
          // Display an error to the user if reCAPTCHA fails
          // If you have a global showError function, you could call it here:
          // if (typeof window.showError === 'function') {
          //   window.showError("reCAPTCHA verification failed. Please refresh and try again.");
          // }
          const enterButton = document.getElementById('enterBTN');
          if (enterButton) {
            enterButton.disabled = false; // Re-enable the button
            enterButton.textContent = 'Send One-Time Code';
          }
        }
      });
      console.log("reCAPTCHA verifier initialized successfully.");
    } else {
      console.warn("grecaptcha not available yet. Retrying reCAPTCHA initialization...");
      // If grecaptcha isn't ready, retry after a short delay
      setTimeout(initializeRecaptcha, 200); // Retry every 200ms until grecaptcha is ready
    }
  };

  // Start the initialization process
  initializeRecaptcha();
});