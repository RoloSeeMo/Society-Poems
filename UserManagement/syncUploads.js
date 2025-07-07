// syncUploads.js - Sync user upload counts and ensure data integrity
const admin = require("firebase-admin")

// Initialize Firebase Admin SDK (reuse existing initialization if already done)
if (!admin.apps.length) {
  const serviceAccount = require("./serviceAccountKey.json")

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
  })
}

const db = admin.database()

async function syncUserUploads() {
  console.log("Starting sync of user upload data...")

  let totalUsersProcessed = 0
  let totalDiscrepanciesFixed = 0
  let totalOrphanedUploadsFound = 0
  let totalMissingUserUploadsFixed = 0

  try {
    // 1. Get all users from the database
    const usersRef = db.ref("users")
    const usersSnapshot = await usersRef.once("value")
    const users = usersSnapshot.val()

    if (!users) {
      console.log("No users found in database.")
      return
    }

    // 2. Get all uploads from the main uploads collection
    const uploadsRef = db.ref("uploads")
    const uploadsSnapshot = await uploadsRef.once("value")
    const uploads = uploadsSnapshot.val()

    console.log(`Found ${Object.keys(users).length} users to process.`)

    // 3. Process each user
    for (const [uid, userData] of Object.entries(users)) {
      if (!userData.username) {
        console.log(`Skipping user ${uid} - no username set`)
        continue
      }

      totalUsersProcessed++
      console.log(`Processing user: ${userData.username} (${uid})`)

      // Count actual uploads for this user across all topics
      let actualUploadCount = 0
      const userActualUploads = {}

      if (uploads) {
        for (const [topic, topicUploads] of Object.entries(uploads)) {
          for (const [uploadKey, uploadData] of Object.entries(topicUploads)) {
            if (uploadData.uid === uid) {
              actualUploadCount++
              userActualUploads[uploadKey] = {
                topic: topic,
                timestamp: uploadData.timestamp,
                content: uploadData.content
                  ? uploadData.content.substring(0, 100) + (uploadData.content.length > 100 ? "..." : "")
                  : "No content",
              }
            }
          }
        }
      }

      // Get user's recorded upload count and uploads list
      const recordedUploadCount = userData.uploadCount || 0
      const userUploadsList = userData.uploads || {}

      console.log(`  - Actual uploads: ${actualUploadCount}`)
      console.log(`  - Recorded count: ${recordedUploadCount}`)
      console.log(`  - Tracked uploads: ${Object.keys(userUploadsList).length}`)

      let needsUpdate = false
      const updates = {}

      // 4. Fix upload count discrepancy
      if (actualUploadCount !== recordedUploadCount) {
        console.log(`  ⚠️  Upload count mismatch! Fixing: ${recordedUploadCount} → ${actualUploadCount}`)
        updates[`users/${uid}/uploadCount`] = actualUploadCount
        totalDiscrepanciesFixed++
        needsUpdate = true
      }

      // 5. Sync user's personal uploads list
      const actualUploadKeys = Object.keys(userActualUploads)
      const trackedUploadKeys = Object.keys(userUploadsList)

      // Find uploads that exist but aren't tracked
      const missingFromTracked = actualUploadKeys.filter((key) => !trackedUploadKeys.includes(key))
      if (missingFromTracked.length > 0) {
        console.log(`  ⚠️  Found ${missingFromTracked.length} uploads not in user's tracked list. Adding them.`)
        for (const uploadKey of missingFromTracked) {
          updates[`users/${uid}/uploads/${uploadKey}`] = userActualUploads[uploadKey]
          totalMissingUserUploadsFixed++
          needsUpdate = true
        }
      }

      // Find tracked uploads that no longer exist
      const orphanedTracked = trackedUploadKeys.filter((key) => !actualUploadKeys.includes(key))
      if (orphanedTracked.length > 0) {
        console.log(`  ⚠️  Found ${orphanedTracked.length} orphaned entries in user's tracked list. Removing them.`)
        for (const uploadKey of orphanedTracked) {
          updates[`users/${uid}/uploads/${uploadKey}`] = null // null removes the entry
          totalOrphanedUploadsFound++
          needsUpdate = true
        }
      }

      // 6. Apply updates if needed
      if (needsUpdate) {
        await db.ref().update(updates)
        console.log(`  ✅ Updated user data for ${userData.username}`)
      } else {
        console.log(`  ✅ User data is already in sync`)
      }
    }

    // 7. Summary report
    console.log("\n" + "=".repeat(50))
    console.log("SYNC UPLOAD DATA SUMMARY")
    console.log("=".repeat(50))
    console.log(`Total users processed: ${totalUsersProcessed}`)
    console.log(`Upload count discrepancies fixed: ${totalDiscrepanciesFixed}`)
    console.log(`Missing user upload entries added: ${totalMissingUserUploadsFixed}`)
    console.log(`Orphaned user upload entries removed: ${totalOrphanedUploadsFound}`)

    if (totalDiscrepanciesFixed === 0 && totalMissingUserUploadsFixed === 0 && totalOrphanedUploadsFound === 0) {
      console.log("✅ All user upload data is in perfect sync!")
    } else {
      console.log(
        `✅ Fixed ${totalDiscrepanciesFixed + totalMissingUserUploadsFixed + totalOrphanedUploadsFound} total inconsistencies.`,
      )
    }
  } catch (error) {
    console.error("Error during upload sync:", error)
    throw error
  }
}

// Additional function to check for uploads without valid users
async function checkForOrphanedUploads() {
  console.log("\nChecking for uploads from deleted users...")

  try {
    const usersRef = db.ref("users")
    const usersSnapshot = await usersRef.once("value")
    const users = usersSnapshot.val() || {}
    const validUserIds = new Set(Object.keys(users))

    const uploadsRef = db.ref("uploads")
    const uploadsSnapshot = await uploadsRef.once("value")
    const uploads = uploadsSnapshot.val()

    if (!uploads) {
      console.log("No uploads found.")
      return
    }

    let orphanedUploadsFound = 0
    const orphanedUploadsToDelete = {}

    for (const [topic, topicUploads] of Object.entries(uploads)) {
      for (const [uploadKey, uploadData] of Object.entries(topicUploads)) {
        if (uploadData.uid && !validUserIds.has(uploadData.uid)) {
          console.log(`  ⚠️  Found orphaned upload in topic "${topic}" from deleted user: ${uploadData.uid}`)
          orphanedUploadsToDelete[`uploads/${topic}/${uploadKey}`] = null
          orphanedUploadsFound++
        }
      }
    }

    if (orphanedUploadsFound > 0) {
      console.log(`Removing ${orphanedUploadsFound} orphaned uploads...`)
      await db.ref().update(orphanedUploadsToDelete)
      console.log(`✅ Removed ${orphanedUploadsFound} orphaned uploads.`)
    } else {
      console.log("✅ No orphaned uploads found.")
    }
  } catch (error) {
    console.error("Error checking for orphaned uploads:", error)
    throw error
  }
}

// Main execution
async function main() {
  try {
    await syncUserUploads()
    await checkForOrphanedUploads()
    console.log("\n🎉 Upload sync completed successfully!")
  } catch (error) {
    console.error("Upload sync failed:", error)
    process.exit(1)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("Fatal error:", error)
    process.exit(1)
  })
