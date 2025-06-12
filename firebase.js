export const initializeFirebase = () => {
  if (typeof window !== "undefined" && !window.firebase) {
    // Load Firebase scripts dynamically
    const script1 = document.createElement("script")
    script1.src = "https://www.gstatic.com/firebasejs/8.6.5/firebase-app.js"
    document.head.appendChild(script1)

    const script2 = document.createElement("script")
    script2.src = "https://www.gstatic.com/firebasejs/8.6.5/firebase-auth.js"
    document.head.appendChild(script2)

    script2.onload = () => {
      const firebaseConfig = {
        apiKey: "AIzaSyDHXEMtVPn46b2qS1CPGUIEuQ8ntLyvLVM",
        authDomain: "society-poems-97f4d.firebaseapp.com",
        databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
        projectId: "society-poems-97f4d",
        storageBucket: "society-poems-97f4d.firebasestorage.app",
        messagingSenderId: "723670230106",
        appId: "1:723670230106:web:6d6dda4f8c46626c55a463",
      }

      if (window.firebase && !window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig)
      }
    }
  }
}

export const checkAuthState = () => {
  if (typeof window !== "undefined") {
    // Show loading state initially
    document.body.style.display = "none"

    const checkAuth = () => {
      if (window.firebase) {
        window.firebase.auth().onAuthStateChanged((user) => {
          if (!user && window.location.pathname !== "/login") {
            window.location.href = "/login"
          } else {
            document.body.style.display = "block"
          }
        })
      } else {
        setTimeout(checkAuth, 100)
      }
    }

    checkAuth()
  }
}

