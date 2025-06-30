const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer"); // One import for nodemailer

admin.initializeApp();

// --- Securely configure the email transport ---
// This uses the environment variables we set with the CLI.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.password,
    },
});

// --- NEW Cloud Function to send email on feedback ---
exports.sendFeedbackEmail = functions.database.ref("/feedback/{pushId}")
    .onCreate((snapshot, context) => {
        const feedbackData = snapshot.val();

        const mailOptions = {
            from: "Society Poems Feedback <officialsocietypoems@gmail.com>", // Replace with your email
            to: "officialsocietypoems@gmail.com", // REPLACE with your personal email
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

        return transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return;
            }
            console.log("Email sent successfully:", info.response);
        });
    });

// --- EXISTING Cloud Function to clean up users ---
exports.cleanupUser = functions.auth.user().onDelete((user) => {
  const db = admin.database();
  return db.ref(`/users/${user.uid}`).remove();
});