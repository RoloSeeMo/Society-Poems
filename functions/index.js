const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

/**
 * Sends an email when new feedback is submitted.
 */
exports.sendFeedbackEmail = functions.database.ref("/feedback/{pushId}")
    .onCreate((snapshot, context) => {
      const feedbackData = snapshot.val();

      const mailOptions = {
        from: "Society Poems Feedback <officialsocietypoems@gmail.com>",
        to: "officialsocietypoems@gmail.com", // REPLACE with your email
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
          return console.error("Error sending email:", error);
        }
        return console.log("Email sent successfully:", info.response);
      });
    });

/**
 * Deletes user data when a user is deleted from Firebase Auth.
 */
exports.cleanupUser = functions.auth.user().onDelete((user) => {
  const db = admin.database();
  return db.ref(`/users/${user.uid}`).remove();
});
