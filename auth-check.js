import { auth } from './.github/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

/**
 * Checks if a user is authenticated. If not, it redirects to the login page.
 * This script also prevents the page content from flashing before the check is complete.
 */
function protectPage() {
  // Hide the page content initially to prevent a "flash" of content.
  document.body.style.display = 'none';

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, so display the page content.
      console.log("Auth Guard: User is signed in. Access granted.");
      document.body.style.display = 'block';
    } else {
      // User is not signed in, redirect to the login page.
      console.log("Auth Guard: No user found. Redirecting to login.html");
      window.location.href = 'login.html';
    }
  });
}

// Run the protection logic as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', protectPage);