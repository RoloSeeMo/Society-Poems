// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js'; // Import auth from centralized config
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js'; //

// Ensure reCAPTCHA is initialized after the DOM is fully loaded AND grecaptcha API is ready.
document.addEventListener('DOMContentLoaded', () => {
  const enterBTNElement = document.getElementById('enterBTN'); 
  
  if (!enterBTNElement) {
    console.error("Error: 'enterBTN' element not found. Cannot initialize reCAPTCHA.");
    return; 
  }

  grecaptcha.ready(function() {
    console.log("Auth object at RecaptchaVerifier initialization attempt (inside grecaptcha.ready):", auth); 

    // Increased delay for robustness. This gives the Firebase Auth instance more time
    // to fully settle internally and ensure all properties are defined.
    setTimeout(() => { 
      try {
        // Check if auth object is not null/undefined and has expected properties
        // This is a defensive check, though the increased timeout should help more.
        if (auth && typeof auth.appVerificationDisabledForTesting !== 'undefined') {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, enterBTNElement, { 
            'size': 'invisible', 
            'callback': (response) => {
              console.log("reCAPTCHA invisible callback triggered. Response:", response);
            },
            'error-callback': (error) => {
              console.error("reCAPTCHA error:", error);
              const button = document.getElementById('enterBTN');
              if (button) {
                button.disabled = false;
                button.textContent = 'Send One-Time Code';
              }
              if (typeof window.showError === 'function') {
                  window.showError("reCAPTCHA verification failed. Please check your internet connection and try again.");
              }
            }
          });
          console.log("reCAPTCHA verifier initialized successfully.");
        } else {
            console.error("Firebase Auth object not fully ready or missing properties.");
            if (typeof window.showError === 'function') {
                window.showError("Firebase Auth initialization issue. Please refresh the page.");
            }
        }
      } catch (e) {
        console.error("Failed to create RecaptchaVerifier:", e);
        if (typeof window.showError === 'function') {
            window.showError("Failed to initialize reCAPTCHA. Please check your console for details.");
        }
      }
    }, 500); // Increased delay from 300ms to 500ms
  }); 
});