// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js'; // Import auth from centralized config
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Ensure reCAPTCHA is initialized after the DOM is fully loaded AND grecaptcha API is ready.
document.addEventListener('DOMContentLoaded', () => {
  const enterBTNElement = document.getElementById('enterBTN'); 
  
  if (!enterBTNElement) {
    console.error("Error: 'enterBTN' element not found. Cannot initialize reCAPTCHA.");
    // Optionally, if the button is critical for reCAPTCHA, you might disable sendOtp
    // or provide an alternative path here.
    return; // Exit if the element isn't there
  }

  // Use grecaptcha.ready() for the most reliable initialization point
  // This callback executes when the grecaptcha API is fully loaded and available.
  grecaptcha.ready(function() {
    // --- CONSOLE.LOG KEPT FOR DIAGNOSIS ---
    console.log("Auth object at RecaptchaVerifier initialization attempt (inside grecaptcha.ready):", auth); 
    // --- END CONSOLE.LOG ---

    // Introduce a longer delay to give the Firebase Auth instance more time to fully settle internally.
    setTimeout(() => { // Increased setTimeout delay here for more robustness
      try {
        // Corrected: Pass the actual DOM element (enterBTNElement)
        // By wrapping it in grecaptcha.ready AND a a slightly longer setTimeout, we give Firebase Auth
        // even more time to fully initialize all internal properties required by RecaptchaVerifier.
        window.recaptchaVerifier = new RecaptchaVerifier(auth, enterBTNElement, { 
          'size': 'invisible', // Invisible reCAPTCHA
          'callback': (response) => {
            // This callback is for reCAPTCHA success.
            console.log("reCAPTCHA invisible callback triggered. Response:", response);
            // The sendOtp() function is called directly by the button's onclick.
            // No need to call it here.
          },
          'error-callback': (error) => {
            // This callback is for reCAPTCHA errors (e.g., network issues, configuration problems)
            console.error("reCAPTCHA error:", error);
            // Re-enable the button and show an error message to the user
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
      } catch (e) {
        // This catch block will now capture errors during RecaptchaVerifier construction
        console.error("Failed to create RecaptchaVerifier:", e);
        if (typeof window.showError === 'function') {
            window.showError("Failed to initialize reCAPTCHA. Please check your console for details.");
        }
      }
    }, 300); // Consistent 300ms delay.
  }); // End of grecaptcha.ready()
});