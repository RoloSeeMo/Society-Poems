// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js'; // Import auth from centralized config
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Ensure reCAPTCHA is initialized after the DOM is fully loaded
// and grecaptcha is available.
document.addEventListener('DOMContentLoaded', () => {
  const enterBTNElement = document.getElementById('enterBTN'); // Get the actual DOM element
  if (!enterBTNElement) {
    console.error("Error: 'enterBTN' element not found. Cannot initialize reCAPTCHA.");
    return; // Exit if the element isn't there
  }

  // A function to try initializing RecaptchaVerifier, with a retry mechanism
  const initializeRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
      // grecaptcha.render exists, meaning the reCAPTCHA API is fully loaded
      window.recaptchaVerifier = new RecaptchaVerifier(auth, enterBTNElement, { // Pass the DOM element here
        'size': 'invisible', // Use 'invisible' to not show the widget immediately
        'callback': (response) => {
          // reCAPTCHA solved. For invisible reCAPTCHA, this means the user passed.
          console.log("reCAPTCHA invisible callback triggered.");
        },
        'error-callback': (error) => {
          console.error("reCAPTCHA error:", error);
          const enterButton = document.getElementById('enterBTN');
          if (enterButton) {
            enterButton.disabled = false; // Re-enable the button
            enterButton.textContent = 'Send One-Time Code';
          }
          // Optionally, display an error to the user if reCAPTCHA fails to load/execute
          // if (typeof window.showError === 'function') {
          //   window.showError("reCAPTCHA verification failed. Please refresh and try again.");
          // }
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