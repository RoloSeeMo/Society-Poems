document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm")
  const privacy = document.getElementById("privacy")
  const nameField = document.getElementById("nameField")
  const username = document.getElementById("username")
  const charLimit = document.getElementById("charLimit")
  const content = document.getElementById("content")
  const charCount = document.getElementById("charCount")
  const previewBox = document.getElementById("previewBox")
  const previewAuthor = document.getElementById("previewAuthor")
  const clearBtn = document.getElementById("clearDraft")
  const modal = document.getElementById("successModal")

  // Privacy selection
  if (privacy) {
    privacy.addEventListener("change", () => {
      nameField.style.display = privacy.value === "named" ? "block" : "none"
      updatePreviewAuthor()
    })
  }

  // Username input
  if (username && charLimit) {
    username.addEventListener("input", () => {
      charLimit.textContent = `(${username.value.length}/15)`
      updatePreviewAuthor()
    })
  }

  // Content input
  if (content && charCount) {
    content.addEventListener("input", () => {
      charCount.textContent = `${content.value.length} characters`
      const previewContent = previewBox.querySelector(".preview-content")
      if (previewContent) {
        previewContent.textContent = content.value.trim() || "Your writing preview will appear here..."
      }
      localStorage.setItem("draftContent", content.value)
    })
  }

  // Load draft
  const savedDraft = localStorage.getItem("draftContent")
  if (savedDraft && content) {
    content.value = savedDraft
    charCount.textContent = `${savedDraft.length} characters`
    const previewContent = previewBox.querySelector(".preview-content")
    if (previewContent) {
      previewContent.textContent = savedDraft
    }
  }

  // Clear draft
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (content) content.value = ""
      if (charCount) charCount.textContent = "0 characters"
      localStorage.removeItem("draftContent")
      const previewContent = previewBox.querySelector(".preview-content")
      if (previewContent) {
        previewContent.textContent = "Your writing preview will appear here..."
      }
      if (previewAuthor) previewAuthor.textContent = ""
    })
  }

  // Form submission
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault()

      const isAnonymous = privacy.value === "anonymous"
      const name = isAnonymous ? "Anonymous" : username.value.trim()
      const genre = document.getElementById("genre").value
      const contentValue = content.value.trim()
      const timestamp = new Date().toLocaleString("en-US", { hour12: false })

      if (!contentValue || (!isAnonymous && !name)) {
        alert("Please fill out all required fields.")
        return
      }

      // Simulate submission - replace with actual Firebase logic
      console.log("Submitting:", { name, genre, content: contentValue, timestamp })

      // Clear form and show success
      localStorage.removeItem("draftContent")
      form.reset()
      nameField.style.display = "none"
      charCount.textContent = "0 characters"
      const previewContent = previewBox.querySelector(".preview-content")
      if (previewContent) {
        previewContent.textContent = "Your writing preview will appear here..."
      }
      previewAuthor.textContent = ""

      if (modal) {
        modal.style.display = "flex"
      }
    })
  }

  function updatePreviewAuthor() {
    if (!previewAuthor) return

    if (privacy.value === "anonymous") {
      previewAuthor.textContent = "— Anonymous"
    } else if (privacy.value === "named" && username.value.trim()) {
      previewAuthor.textContent = `— ${username.value.trim()}`
    } else {
      previewAuthor.textContent = ""
    }
  }
})

function closeModal() {
  const modal = document.getElementById("successModal")
  if (modal) {
    modal.style.display = "none"
  }
}
