const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configure the email transport for feedback emails.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.password,
    },
});

// Sends an email when new feedback is submitted.
exports.sendFeedbackEmail = functions.database.ref("/feedback/{pushId}")
    .onCreate((snapshot, context) => {
        const feedbackData = snapshot.val();
        const mailOptions = {
            from: "Society Poems Feedback <your-gmail-address@gmail.com>",
            to: "your-personal-email@example.com",
            subject: `New Feedback from ${feedbackData.name}`,
            html: `<p>You have received new feedback!</p><ul><li><b>Name:</b> ${feedbackData.name}</li><li><b>Email:</b> ${feedbackData.email}</li><li><b>Message:</b> ${feedbackData.message}</li></ul>`,
        };
        return transporter.sendMail(mailOptions);
    });

// Deletes a user's data from RTDB when they are deleted from FB Auth.
exports.cleanupUser = functions.auth.user().onDelete((user) => {
    const db = admin.database();
    return db.ref(`/users/${user.uid}`).remove();
});


// --- ** NEW FUNCTION: Increment upload count on post creation ** ---
exports.incrementUserUploadCount = functions.database.ref('/uploads/{pushId}')
    .onCreate(async (snapshot, context) => {
        const newPost = snapshot.val();
        const uid = newPost.uid;

        if (!uid) {
            console.log('No UID found on new post. Cannot increment count.');
            return null;
        }

        const userRef = admin.database().ref(`/users/${uid}/uploads`);

        // Use a transaction to safely increment the count, preventing race conditions.
        return userRef.transaction((currentUploads) => {
            return (currentUploads || 0) + 1;
        });
    });

// --- ** NEW FUNCTION: Decrement upload count on post deletion ** ---
exports.decrementUserUploadCount = functions.database.ref('/uploads/{pushId}')
    .onDelete(async (snapshot, context) => {
        const deletedPost = snapshot.val();
        const uid = deletedPost.uid;

        if (!uid) {
            console.log('No UID found on deleted post. Cannot decrement count.');
            return null;
        }

        const userRef = admin.database().ref(`/users/${uid}/uploads`);
        
        // Use a transaction to safely decrement the count.
        return userRef.transaction((currentUploads) => {
            if (currentUploads > 0) {
                return currentUploads - 1;
            }
            return 0; // Or null if you prefer to not have a zero value.
        });
    });
