import { auth } from "./firebase-config.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js"

/**
 * Comprehensive authentication guard that protects pages from unauthorized access
 * This script should be imported by all protected pages
 */

// List of pages that don't require authentication
const PUBLIC_PAGES = ["login.html", "CellLogin.html"]

// Check if current page is public
function isPublicPage() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  return PUBLIC_PAGES.includes(currentPage)
}

// Redirect to login if not on a public page
function redirectToLogin() {
  if (!isPublicPage()) {
    console.log("Auth Guard: No user found. Redirecting to login.html")
    window.location.href = "login.html"
  }
}

/**
 * Main authentication protection function
 * Hides page content initially and shows it only after successful auth check
 */
function protectPage() {
  // Skip protection for public pages
  if (isPublicPage()) {
    return
  }

  // Hide the page content initially to prevent flash of content
  document.body.style.display = "none"
  document.body.style.visibility = "hidden"

  // Show loading state
  const loadingDiv = document.createElement("div")
  loadingDiv.id = "auth-loading"
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #353535, #111111);
    color: #f2e8d5;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Poppins", sans-serif;
    font-size: 1.2rem;
    z-index: 9999;
  `
  loadingDiv.innerHTML = "<div>🔐 Checking authentication...</div>"
  document.body.appendChild(loadingDiv)

  // Set up authentication state listener
  const unsubscribe = onAuthStateChanged(
    auth,
    (user) => {
      // Remove loading screen
      const loading = document.getElementById("auth-loading")
      if (loading) {
        loading.remove()
      }

      if (user) {
        // User is signed in, show the page content
        console.log("Auth Guard: User is signed in. Access granted.", user.email)
        document.body.style.display = "block"
        document.body.style.visibility = "visible"

        // Store user info for other scripts to use
        window.currentUser = user
      } else {
        // User is not signed in, redirect to login
        redirectToLogin()
      }

      // Clean up the listener
      unsubscribe()
    },
    (error) => {
      console.error("Auth Guard: Authentication error:", error)
      // Remove loading screen
      const loading = document.getElementById("auth-loading")
      if (loading) {
        loading.remove()
      }
      // Redirect to login on error
      redirectToLogin()
    },
  )

  // Timeout fallback - if auth check takes too long, redirect to login
  setTimeout(() => {
    const loading = document.getElementById("auth-loading")
    if (loading) {
      console.warn("Auth Guard: Authentication check timed out")
      redirectToLogin()
    }
  }, 10000) // 10 second timeout
}

// Auto-run protection when script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", protectPage)
} else {
  protectPage()
}

// Export for manual use if needed
export { protectPage, redirectToLogin }
