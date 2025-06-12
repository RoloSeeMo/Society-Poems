document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      const firebase = window.firebase // Declare the firebase variable

      if (typeof firebase !== "undefined" && firebase.auth) {
        firebase
          .auth()
          .signInWithEmailAndPassword(email, password)
          .then(() => {
            window.location.href = "index.html"
          })
          .catch((error) => {
            console.error("Login error:", error.code, error.message)
            alert("Login failed. Please check your credentials.")
          })
      }
    })
  }

  // Check if user is already logged in
  const firebase = window.firebase // Declare the firebase variable

  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        window.location.href = "index.html"
      }
    })
  }
})
