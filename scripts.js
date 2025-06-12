// Mobile menu functionality
document.addEventListener("DOMContentLoaded", () => {
  const menuOpen = document.getElementById("menu-open-button")
  const menuClose = document.getElementById("menu-close-button")
  const navMenu = document.querySelector(".nav-menu")
  const logoutBtn = document.getElementById("logoutBtn")
  const firebase = window.firebase // Declare the firebase variable

  // Mobile menu toggle
  if (menuOpen && menuClose && navMenu) {
    menuOpen.addEventListener("click", () => {
      document.body.classList.add("show-mobile-menu")
    })

    menuClose.addEventListener("click", () => {
      document.body.classList.remove("show-mobile-menu")
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navMenu.contains(e.target) && !menuOpen.contains(e.target)) {
        document.body.classList.remove("show-mobile-menu")
      }
    })
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase
          .auth()
          .signOut()
          .then(() => {
            window.location.href = "login.html"
          })
          .catch((error) => {
            console.error("Logout Error:", error)
          })
      } else {
        // Fallback if Firebase isn't loaded
        console.log("Firebase not loaded, redirecting to login")
        window.location.href = "login.html"
      }
    })
  }
})
