// syncUsers.js - Delete orphaned Firebase Authentication users.
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK.
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com"
});

const auth = admin.auth();
const db = admin.database();

async function deleteOrphanedAuthUsers() {
  console.log("Starting cleanup of orphaned Authentication users...");
  
  // 1. Get all user profiles from the Realtime Database and store UIDs in a Set for fast lookups.
  const dbUserUids = new Set();
  const dbUsersRef = db.ref("users");
  const dbUsersSnapshot = await dbUsersRef.once("value");
  const dbUsers = dbUsersSnapshot.val();
  
  if (dbUsers) {
    for (const uid in dbUsers) {
      dbUserUids.add(uid);
    }
  }
  console.log(`Found ${dbUserUids.size} user profiles in the Realtime Database.`);

  // 2. Get all authenticated users.
  const listUsersResult = await auth.listUsers();
  console.log(`Found ${listUsersResult.users.length} users in Firebase Authentication.`);

  // 3. Find and delete Auth users who are not in the Realtime Database list.
  const deletionPromises = [];
  for (const userRecord of listUsersResult.users) {
    if (!dbUserUids.has(userRecord.uid)) {
      // This user is in Authentication but not in the database.
      console.log(`- Deleting orphaned auth user: ${userRecord.email || 'No Email'} (${userRecord.uid})`);
      // Add the deletion promise to the array
      deletionPromises.push(auth.deleteUser(userRecord.uid));
    }
  }

  if (deletionPromises.length === 0) {
    console.log("No orphaned authentication users found. Auth is in sync with Database.");
  } else {
    // Wait for all the deletion operations to complete.
    await Promise.all(deletionPromises);
    console.log(`Successfully deleted ${deletionPromises.length} orphaned auth user(s).`);
    console.log("The corresponding database cleanup will be triggered automatically by the 'cleanupUser' Cloud Function.");
  }
}

deleteOrphanedAuthUsers().then(() => {
  console.log("Auth cleanup script finished.");
  process.exit(0);
}).catch((error) => {
  console.error("An error occurred during the auth cleanup script:", error);
  process.exit(1);
});