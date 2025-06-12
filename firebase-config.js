// Import Firebase
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/database"
import "firebase/storage"

// Firebase configuration and authentication check
const firebaseConfig = {
  apiKey: "AIzaSyDHXEMtVPn46b2qS1CPGUIEuQ8ntLyvLVM",
  authDomain: "society-poems-97f4d.firebaseapp.com",
  databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
  projectId: "society-poems-97f4d",
  storageBucket: "society-poems-97f4d.firebasestorage.app",
  messagingSenderId: "723670230106",
  appId: "1:723670230106:web:6d6dda4f8c46626c55a463",
}

// Initialize Firebase
if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

// Check authentication state
function checkAuthState() {
  if (typeof firebase !== "undefined" && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
      if (!user && !window.location.pathname.includes("login.html")) {
        window.location.href = "login.html"
      }
    })
  }
}

// Run auth check on pages that require authentication
if (!window.location.pathname.includes("login.html")) {
  document.addEventListener("DOMContentLoaded", checkAuthState)
}
