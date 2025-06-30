// syncUsers.js - UPDATED to delete orphaned database users.
const admin = require("firebase-admin");

// --- IMPORTANT: SETUP ---
// 1. Make sure your service account key JSON file is in this folder.
// 2. Make sure its name is "serviceAccountKey.json".
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com" // Your database URL
});

const auth = admin.auth();
const db = admin.database();

async function syncAndDeleteOrphanedUsers() {
  console.log("Starting user sync and cleanup...");
  
  // 1. Get all authenticated users and store their UIDs in a Set for fast lookups.
  const authenticatedUids = new Set();
  const listUsersResult = await auth.listUsers();
  listUsersResult.users.forEach((userRecord) => {
    authenticatedUids.add(userRecord.uid);
  });
  console.log(`Found ${authenticatedUids.size} users in Firebase Authentication.`);

  // 2. Get all user profiles from the Realtime Database.
  const dbUsersRef = db.ref("users");
  const dbUsersSnapshot = await dbUsersRef.once("value");
  const dbUsers = dbUsersSnapshot.val();
  
  if (!dbUsers) {
      console.log("No users found in the Realtime Database. Nothing to do.");
      return;
  }

  console.log(`Found ${Object.keys(dbUsers).length} user profiles in the Realtime Database.`);
  
  // 3. Find and delete database users who are not in the authentication list.
  const deletionPromises = [];
  for (const uid in dbUsers) {
    if (!authenticatedUids.has(uid)) {
      // This user is in the database but not in Authentication.
      console.log(`- Deleting orphaned user from database: ${dbUsers[uid].email || 'No Email'} (${uid})`);
      const userRefToDelete = db.ref(`users/${uid}`);
      deletionPromises.push(userRefToDelete.remove());
    }
  }

  if (deletionPromises.length === 0) {
      console.log("No orphaned users found. Database is in sync.");
  } else {
      await Promise.all(deletionPromises);
      console.log(`Successfully deleted ${deletionPromises.length} orphaned user(s).`);
  }
}

syncAndDeleteOrphanedUsers().then(() => {
  console.log("Cleanup script finished.");
  process.exit(0);
}).catch((error) => {
  console.error("An error occurred during the cleanup script:", error);
  process.exit(1);
});