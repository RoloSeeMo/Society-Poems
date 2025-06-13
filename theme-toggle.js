document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggleTheme")
  const body = document.body

  // Load saved theme or default to 'night'
  const savedTheme = localStorage.getItem("theme") || "night"
  body.setAttribute("data-theme", savedTheme)
  updateButtonText(savedTheme)

  toggleButton.addEventListener("click", () => {
    const currentTheme = body.getAttribute("data-theme")
    const newTheme = currentTheme === "night" ? "day" : "night"

    body.setAttribute("data-theme", newTheme)
    localStorage.setItem("theme", newTheme)
    updateButtonText(newTheme)
  })

  function updateButtonText(theme) {
    toggleButton.textContent = theme === "night" ? "☀️" : "🌙"
  }
})
