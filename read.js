document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("entriesContainer")

  // Simulate loading entries - replace with actual Firebase logic
  setTimeout(() => {
    const entries = [
      {
        name: "Anonymous",
        content: "The stars whisper secrets\nTo those who dare to listen\nIn the quiet of night",
        timestamp: "2025-01-11, 10:30:00",
      },
      {
        name: "Maya",
        content: "Words flow like rivers\nCarrying dreams downstream\nTo oceans of possibility",
        timestamp: "2025-01-11, 09:15:00",
      },
    ]

    container.innerHTML = ""

    if (entries.length === 0) {
      container.innerHTML = '<p class="empty-text">No entries yet. Be the first to upload!</p>'
      return
    }

    entries.forEach((entry) => {
      const div = document.createElement("div")
      div.className = "entry"
      div.innerHTML = `
                <p class="entry-content">${entry.content}</p>
                <div class="entry-meta">— <strong>${entry.name}</strong>, <em>${entry.timestamp}</em></div>
            `
      container.appendChild(div)
    })
  }, 1000)
})
