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

const nodemailer = require("nodemailer"); // Import nodemailer

admin.initializeApp();


// --- EMAIL FUNCTION ---

// Configure the email transport using securely stored environment variables.
// We will set these variables in the next step.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.password,
    },
});

// This new function triggers when a new document is written to /feedback/{pushId}
exports.sendFeedbackEmail = functions.database.ref("/feedback/{pushId}")
    .onCreate((snapshot, context) => {
        // Get the feedback data from the snapshot
        const feedbackData = snapshot.val();

        // Set up the email options
        const mailOptions = {
            from: "Your Name <your-gmail-address@gmail.com>", // Can be the same as your login email
            to: "officialsocietypoems@gmail.com", // <-- SET YOUR EMAIL ADDRESS HERE
            subject: `New Feedback from ${feedbackData.name}`,
            html: `
                <p>You have received new feedback!</p>
                <ul>
                    <li><b>Name:</b> ${feedbackData.name}</li>
                    <li><b>Email:</b> ${feedbackData.email}</li>
                    <li><b>Message:</b> ${feedbackData.message}</li>
                </ul>
            `,
        };

        // Send the email
        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email: ", error);
                return;
            }
            console.log("Email sent successfully: " + info.response);
        });
    });

// --- END OF NEW EMAIL FUNCTION ---

// This is your existing function to clean up users. You can leave it as is.
exports.cleanupUser = functions.auth.user().onDelete((user) => {
  const db = admin.database();
  return db.ref(`/users/${user.uid}`).remove();
});