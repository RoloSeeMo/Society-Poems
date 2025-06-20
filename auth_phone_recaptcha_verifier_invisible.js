// auth_phone_recaptcha_verifier_invisible.js
import { auth } from './firebase-config.js';
import { RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// The reCAPTCHA verifier should be attached to a button that triggers the phone sign-in process.
// In CellLogin.html, 'enterBTN' (Send One-Time Code) is a good candidate.
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'enterBTN', {
  'size': 'invisible', // Use 'invisible' to not show the widget immediately
  'callback': (response) => {
    // reCAPTCHA solved, this is automatically triggered for invisible reCAPTCHA on interaction
    // The `sendOtp()` function in CellLogin.html will handle the next step.
    console.log("reCAPTCHA invisible callback triggered.");
  },
  'error-callback': (error) => {
    // Handle reCAPTCHA error
    console.error("reCAPTCHA error:", error);
    // You might want to show an error message to the user here
  }
});

// For invisible reCAPTCHA, you typically don't call onSignInSubmit() here.
// Instead, the button that triggers the phone number submission should be the reCAPTCHA container,
// and its click handler should then proceed with signInWithPhoneNumber.