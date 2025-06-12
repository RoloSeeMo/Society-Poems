"use client"

import { useState } from "react"
import ThemeToggle from "./theme-toggle"

export default function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    if (typeof window !== "undefined" && window.firebase) {
      window.firebase
        .auth()
        .signOut()
        .then(() => {
          window.location.href = "/login"
        })
        .catch((error: any) => {
          console.error("Logout Error:", error)
        })
    }
  }

  return (
    <header className="site-header">
      <nav className="navbar">
        <a href="/" className="nav-logo">
          <h2 className="logo-text">📖 Society Poems</h2>
        </a>

        <ul className={`nav-menu ${showMobileMenu ? "show-mobile" : ""}`}>
          <button className="menu-close-button" onClick={() => setShowMobileMenu(false)}>
            ✕
          </button>

          <li className="nav-item">
            <a href="/" className="nav-link">
              Home
            </a>
          </li>
          <li className="nav-item">
            <a href="/read" className="nav-link">
              Read
            </a>
          </li>
          <li className="nav-item">
            <a href="/upload" className="nav-link">
              Upload
            </a>
          </li>
          <li className="nav-item">
            <button onClick={handleLogout} className="nav-link logout-btn">
              Sign Out
            </button>
          </li>
          <li className="nav-item">
            <ThemeToggle />
          </li>
        </ul>

        <button className="menu-open-button" onClick={() => setShowMobileMenu(true)}>
          ☰
        </button>
      </nav>
    </header>
  )
}
