// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js'; // Import auth from centralized config
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const enterBTNElement = document.getElementById('enterBTN'); 
  
  if (!enterBTNElement) {
    console.error("Error: 'enterBTN' element not found. Cannot initialize reCAPTCHA.");
    return; 
  }

  const initializeRecaptchaVerifier = () => {
    // --- ADD THIS CONSOLE.LOG HERE ---
    console.log("Auth object at RecaptchaVerifier initialization attempt:", auth); 
    // --- END ADDITION ---

    if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, enterBTNElement, { 
          'size': 'invisible', 
          'callback': (response) => {
            console.log("reCAPTCHA invisible callback triggered.");
          },
          'error-callback': (error) => {
            console.error("reCAPTCHA error:", error);
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
      setTimeout(initializeRecaptchaVerifier, 200); 
    }
  };

  initializeRecaptchaVerifier();
});