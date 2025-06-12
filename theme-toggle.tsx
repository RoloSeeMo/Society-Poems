"use client"

import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const [theme, setTheme] = useState("night")

  useEffect(() => {
    // Load saved theme or default to 'night'
    const savedTheme = localStorage.getItem("theme") || "night"
    setTheme(savedTheme)
    document.body.setAttribute("data-theme", savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "night" ? "day" : "night"
    setTheme(newTheme)
    document.body.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
  }

  return (
    <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
      {theme === "night" ? "☀️" : "🌙"} Theme
    </button>
  )
}
