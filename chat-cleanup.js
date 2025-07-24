// Chat room message cleanup utility
// This handles automatic deletion of messages older than 24 hours and inactive chat rooms after 24 hours

const ChatCleanup = {
  // 24 hours in milliseconds
  MESSAGE_EXPIRY_TIME: 24 * 60 * 60 * 1000,
  ROOM_EXPIRY_TIME: 24 * 60 * 60 * 1000,

  // Cleanup interval (every 5 minutes for messages, every 10 minutes for rooms)
  CLEANUP_INTERVAL: 10 * 60 * 1000,

  // Store cleanup intervals to clear them when leaving rooms
  cleanupIntervals: {},

  // Global cleanup interval ID
  globalCleanupInterval: null,

  // Initialize cleanup for a specific room
  initRoomCleanup(roomId, db) {
    console.log(`Initializing cleanup for room: ${roomId}`)

    // Run cleanup immediately when joining
    this.cleanupOldMessages(roomId, db)

    // Set interval for periodic cleanup
    this.cleanupIntervals[roomId] = setInterval(() => {
      this.cleanupOldMessages(roomId, db)
    }, this.CLEANUP_INTERVAL)

    return true
  },

  // Stop cleanup when leaving a room
  stopRoomCleanup(roomId) {
    if (this.cleanupIntervals[roomId]) {
      clearInterval(this.cleanupIntervals[roomId])
      delete this.cleanupIntervals[roomId]
      console.log(`Stopped cleanup for room: ${roomId}`)
    }
  },

  // Clean up messages older than 24 hours
  cleanupOldMessages(roomId, db) {
    const cutoffTime = Date.now() - this.MESSAGE_EXPIRY_TIME
    console.log(`Cleaning up messages older than: ${new Date(cutoffTime).toLocaleString()}`)

    // Query for old messages
    const messagesRef = db.ref(`chatRooms/${roomId}/messages`)
    messagesRef
      .orderByChild("timestamp")
      .endAt(cutoffTime)
      .once("value", (snapshot) => {
        if (!snapshot.exists()) {
          console.log("No old messages to clean up")
          return
        }

        // Count messages to delete
        let deleteCount = 0
        const updates = {}

        // Mark messages for deletion
        snapshot.forEach((messageSnapshot) => {
          const messageId = messageSnapshot.key
          updates[messageId] = null // Firebase way to delete
          deleteCount++
        })

        // Perform batch delete if there are messages to remove
        if (deleteCount > 0) {
          messagesRef
            .update(updates)
            .then(() => {
              console.log(`Deleted ${deleteCount} expired messages from room ${roomId}`)
            })
            .catch((error) => {
              console.error("Error deleting expired messages:", error)
            })
        }
      })
  },

  // Initialize global room cleanup
  initGlobalCleanup(db) {
    console.log("Initializing global chat room cleanup...")

    // Run cleanup immediately
    this.cleanupInactiveRooms(db)

    // Set interval for periodic cleanup
    if (!this.globalCleanupInterval) {
      this.globalCleanupInterval = setInterval(() => {
        this.cleanupInactiveRooms(db)
      }, this.CLEANUP_INTERVAL)
    }

    return true
  },

  // Stop global cleanup
  stopGlobalCleanup() {
    if (this.globalCleanupInterval) {
      clearInterval(this.globalCleanupInterval)
      this.globalCleanupInterval = null
      console.log("Stopped global chat room cleanup")
    }
  },

  // Clean up inactive chat rooms
  cleanupInactiveRooms(db) {
    const cutoffTime = Date.now() - this.ROOM_EXPIRY_TIME
    console.log(`Cleaning up chat rooms inactive since: ${new Date(cutoffTime).toLocaleString()}`)

    // Get all chat rooms
    db.ref("chatRooms").once("value", (snapshot) => {
      if (!snapshot.exists()) {
        console.log("No chat rooms to check for cleanup")
        return
      }

      const roomsToDelete = []
      let activeRoomsCount = 0

      snapshot.forEach((roomSnapshot) => {
        const roomId = roomSnapshot.key
        const roomData = roomSnapshot.val()

        // Check if room has any active users
        const hasActiveUsers = roomData.activeUsers && Object.keys(roomData.activeUsers).length > 0

        // Get the last activity time (use the most recent of lastActivity or createdAt)
        const lastActivity = roomData.lastActivity || roomData.createdAt || 0
        const isInactive = lastActivity < cutoffTime

        console.log(
          `Room ${roomId}: Last activity ${new Date(lastActivity).toLocaleString()}, Active users: ${hasActiveUsers ? Object.keys(roomData.activeUsers).length : 0}`,
        )

        // Mark room for deletion if it's inactive AND has no active users
        if (isInactive && !hasActiveUsers) {
          roomsToDelete.push({
            id: roomId,
            topic: roomData.topic || "Untitled",
            lastActivity: lastActivity,
          })
        } else {
          activeRoomsCount++
        }
      })

      // Delete inactive rooms
      if (roomsToDelete.length > 0) {
        console.log(
          `Found ${roomsToDelete.length} inactive rooms to delete:`,
          roomsToDelete.map((r) => r.topic),
        )

        const deletePromises = roomsToDelete.map((room) => {
          console.log(
            `Deleting inactive room: "${room.topic}" (last active: ${new Date(room.lastActivity).toLocaleString()})`,
          )
          return db.ref(`chatRooms/${room.id}`).remove()
        })

        Promise.all(deletePromises)
          .then(() => {
            console.log(`Successfully deleted ${roomsToDelete.length} inactive chat rooms`)
          })
          .catch((error) => {
            console.error("Error deleting inactive rooms:", error)
          })
      } else {
        console.log(`No inactive rooms found. ${activeRoomsCount} rooms remain active.`)
      }
    })
  },

  // Update room activity (call this when users send messages, join, etc.)
  updateRoomActivity(roomId, db, firebase) {
    const activityRef = db.ref(`chatRooms/${roomId}/lastActivity`)
    activityRef
      .set(firebase.database.ServerValue.TIMESTAMP)
      .then(() => {
        console.log(`Updated activity for room ${roomId}`)
      })
      .catch((error) => {
        console.error("Error updating room activity:", error)
      })
  },

  // Add expiry notice to room
  addExpiryNotice(roomId, messagesContainer) {
    const expiryNotice = document.createElement("div")
    expiryNotice.className = "system-message expiry-notice"
    expiryNotice.innerHTML = `
      <div class="system-message-content">
        <span class="system-icon">⏱️</span>
        <span>Messages in this room automatically expire after 24 hours</span>
      </div>
    `
    messagesContainer.appendChild(expiryNotice)
  },

  // Add room expiry notice to room list
  addRoomExpiryNotice(container) {
    const expiryNotice = document.createElement("div")
    expiryNotice.className = "room-expiry-notice"
    expiryNotice.innerHTML = `
      <div class="expiry-notice-content">
        <span class="expiry-icon">🕒</span>
        <span>Chat rooms automatically close after 24 hours of inactivity</span>
      </div>
    `
    container.insertBefore(expiryNotice, container.firstChild)
  },

  // Check if a room is close to expiring (within 2 hours)
  isRoomNearExpiry(lastActivity) {
    const twoHoursFromExpiry = this.ROOM_EXPIRY_TIME - 2 * 60 * 60 * 1000 // 22 hours
    const timeSinceActivity = Date.now() - lastActivity
    return timeSinceActivity > twoHoursFromExpiry
  },

  // Get time until room expires
  getTimeUntilExpiry(lastActivity) {
    const expiryTime = lastActivity + this.ROOM_EXPIRY_TIME
    const timeLeft = expiryTime - Date.now()

    if (timeLeft <= 0) return "Expired"

    const hours = Math.floor(timeLeft / (60 * 60 * 1000))
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  },
}

// Export for use in other files
window.ChatCleanup = ChatCleanup
