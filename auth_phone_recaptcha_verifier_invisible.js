// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js';
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // Ensure the button element is retrieved *inside* the DOMContentLoaded listener
  // to guarantee it exists in the DOM.
  const enterBTNElement = document.getElementById('enterBTN'); 
  
  if (!enterBTNElement) {
    console.error("Error: 'enterBTN' element not found. Cannot initialize reCAPTCHA. Please ensure the button exists in CellLogin.html.");
    return; // Stop execution if the element isn't found
  }

  // Function to encapsulate reCAPTCHA initialization logic
  const initializeRecaptchaVerifier = () => {
    // Check if the global grecaptcha object and its render method are available
    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
      try {
        // Corrected: Pass the actual DOM element (enterBTNElement)
        window.recaptchaVerifier = new RecaptchaVerifier(auth, enterBTNElement, {
          'size': 'invisible', // Invisible reCAPTCHA
          'callback': (response) => {
            console.log("reCAPTCHA invisible callback triggered.");
            // This callback is for reCAPTCHA success. The sendOtp() function
            // is called by the button's onclick directly.
          },
          'error-callback': (error) => {
            console.error("reCAPTCHA error:", error);
            // Re-enable the button and show an error message to the user
            const button = document.getElementById('enterBTN');
            if (button) {
              button.disabled = false;
              button.textContent = 'Send One-Time Code';
            }
            if (typeof window.showError === 'function') {
                window.showError("reCAPTCHA verification failed. Please try again.");
            }
          }
        });
        console.log("reCAPTCHA verifier initialized successfully.");
      } catch (e) {
        console.error("Failed to create RecaptchaVerifier:", e);
        if (typeof window.showError === 'function') {
            window.showError("Failed to load reCAPTCHA. Please check your internet connection and try again.");
        }
      }
    } else {
      console.warn("grecaptcha not available yet. Retrying reCAPTCHA initialization...");
      // If grecaptcha isn't ready, retry after a short delay
      setTimeout(initializeRecaptchaVerifier, 200); // Retry every 200ms
    }
  };

  // Start the reCAPTCHA initialization process
  initializeRecaptchaVerifier();
});