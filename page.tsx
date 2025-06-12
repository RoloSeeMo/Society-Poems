"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { initializeFirebase } from "@/lib/firebase"
import ThemeToggle from "@/components/theme-toggle"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  useEffect(() => {
    initializeFirebase()

    // Check if user is already logged in
    if (typeof window !== "undefined" && window.firebase) {
      window.firebase.auth().onAuthStateChanged((user: any) => {
        if (user) {
          window.location.href = "/"
        }
      })
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (typeof window !== "undefined" && window.firebase) {
      try {
        await window.firebase.auth().signInWithEmailAndPassword(email, password)
        window.location.href = "/"
      } catch (error: any) {
        console.error("Login error:", error.code, error.message)
        alert("Login failed. Please check your credentials.")
      }
    }
  }

  return (
    <div className="min-h-screen login-page">
      <header className="login-header">
        <div className="header-content">
          <a href="/" className="home-link">
            <h2 className="logo-text">📖 Society Poems</h2>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="login-main">
        <div className="login-container">
          <h1>Login</h1>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
