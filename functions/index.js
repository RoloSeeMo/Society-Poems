// This is the corrected file for /functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// This function triggers whenever a user is deleted from Authentication
exports.cleanupUser = functions.auth.user().onDelete((user) => {
  const uid = user.uid;
  console.log(`User ${uid} deleted, cleaning up database profile.`);

  // Return the promise from the remove() operation
  return admin.database().ref(`/users/${uid}`).remove();
});
