// Shared authentication utilities for all pages
// This replaces the repetitive auth logic in each HTML file

const AuthUtils = {
  currentUser: null,
  currentUsername: null,
  currentUserIsAdmin: false,
  adminUIDs: ["SAD2VGjLrtVA80Cg0ay71rDiijQ2"],

  // Initialize authentication for pages that allow read-only access
  initReadOnlyAuth(firebase, auth, db, options = {}) {
    const {
      onAuthSuccess = () => {},
      onAuthFailure = () => {},
      requireAuth = false, // Set to true for pages that require login
      showReadOnlyMessage = true,
    } = options

    return new Promise((resolve) => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // User is logged in
          try {
            const userRef = db.ref("users/" + user.uid)
            const snapshot = await userRef.once("value")

            if (snapshot.exists() && snapshot.val().username) {
              // Valid authenticated user
              this.currentUser = user
              this.currentUsername = snapshot.val().username
              this.currentUserIsAdmin = this.adminUIDs.includes(user.uid)

              document.body.style.visibility = "visible"
              this.updateUIForAuthenticatedUser()
              onAuthSuccess(user, snapshot.val())
              resolve({ authenticated: true, user, userData: snapshot.val() })
            } else {
              // User exists but no username - redirect to complete profile
              window.location.href = "login.html?step=profile"
            }
          } catch (error) {
            console.error("Error checking user data:", error)
            if (requireAuth) {
              window.location.href = "login.html"
            } else {
              this.handleUnauthenticatedUser(showReadOnlyMessage)
              resolve({ authenticated: false })
            }
          }
        } else {
          // No user logged in
          if (requireAuth) {
            window.location.href = "login.html"
          } else {
            this.handleUnauthenticatedUser(showReadOnlyMessage)
            onAuthFailure()
            resolve({ authenticated: false })
          }
        }
      })
    })
  },

  handleUnauthenticatedUser(showMessage = true) {
    document.body.style.visibility = "visible"
    this.updateUIForUnauthenticatedUser()

    if (showMessage) {
      this.showReadOnlyBanner()
    }
  },

  updateUIForAuthenticatedUser() {
    // Show authenticated user elements
    const authElements = document.querySelectorAll(".auth-required")
    authElements.forEach((el) => (el.style.display = "block"))

    const guestElements = document.querySelectorAll(".guest-only")
    guestElements.forEach((el) => (el.style.display = "none"))

    // Update logout button
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.style.display = "block"
      logoutBtn.textContent = "Logout"
    }
  },

  updateUIForUnauthenticatedUser() {
    // Hide authenticated user elements
    const authElements = document.querySelectorAll(".auth-required")
    authElements.forEach((el) => (el.style.display = "none"))

    const guestElements = document.querySelectorAll(".guest-only")
    guestElements.forEach((el) => (el.style.display = "block"))

    // Update logout button to login button
    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.style.display = "block"
      logoutBtn.textContent = "Login"
      logoutBtn.onclick = () => (window.location.href = "login.html")
    }
  },

  showReadOnlyBanner() {
    // Create and show a banner for read-only users
    const existingBanner = document.getElementById("readonly-banner")
    if (existingBanner) return // Don't create multiple banners

    const banner = document.createElement("div")
    banner.id = "readonly-banner"
    banner.className = "readonly-banner"
    banner.innerHTML = `
            <div class="readonly-banner-content">
                <span>📖 You're browsing as a guest. <a href="login.html">Sign in</a> to post, comment, and join discussions!</span>
                <button onclick="this.parentElement.parentElement.remove()" class="readonly-banner-close">&times;</button>
            </div>
        `

    // Insert after header
    const header = document.querySelector("header")
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling)
    } else if (header) {
      header.parentNode.appendChild(banner)
    } else {
      document.body.insertBefore(banner, document.body.firstChild)
    }
  },

  // Check if user can perform write operations
  canWrite() {
    return this.currentUser !== null
  },

  // Check if user is admin
  isAdmin() {
    return this.currentUserIsAdmin
  },

  // Get current user info
  getCurrentUser() {
    return {
      user: this.currentUser,
      username: this.currentUsername,
      isAdmin: this.currentUserIsAdmin,
    }
  },
}

// Export for use in other files
window.AuthUtils = AuthUtils
