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
            from: "Society Poems Feedback <officialsocietypoems@gmail.com>",
            to: "officialsocietypoems@gmail.com",
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


// --- ** Increment upload count on post creation ** ---
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

// --- ** Decrement upload count on post deletion ** ---
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

// --- ** Handle Topic and Post Creation ** ---
// Helper function to format topic names for RTDB keys
function formatTopicName(topic) {
    return topic.toLowerCase().replace(/\s/g, ''); // Convert to lowercase and remove all whitespace
}

exports.createTopicAndPost = functions.https.onCall(async (data, context) => {
    // 1. Authenticate the user
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const uid = context.auth.uid;
    const { topicName, postContent } = data;

    // 2. Validate input
    if (!topicName || typeof topicName !== 'string' || topicName.trim() === '') {
        throw new functions.https.HttpsError('invalid-argument', 'Topic name cannot be empty.');
    }
    if (topicName.length > 100) {
        throw new functions.https.HttpsError('invalid-argument', 'Topic name cannot exceed 100 characters.');
    }
    if (!postContent || typeof postContent !== 'string' || postContent.trim() === '') {
        throw new functions.https.HttpsError('invalid-argument', 'Post content cannot be empty.');
    }

    const formattedTopicName = formatTopicName(topicName);
    const db = admin.database();

    try {
        // 3. Get username
        const userSnapshot = await db.ref(`/users/${uid}/username`).once('value');
        const username = userSnapshot.val();

        if (!username) {
            throw new functions.https.HttpsError('not-found', 'User profile or username not found.');
        }

        const topicRef = db.ref(`/topics/${formattedTopicName}`);
        const postsRef = topicRef.child('posts');
        const uploadCountRef = topicRef.child('uploadCount');

        // 4. Increment topic upload count using a transaction
        await uploadCountRef.transaction((currentCount) => {
            return (currentCount || 0) + 1;
        });

        // 5. Add post content
        const newPostRef = postsRef.push(); // Generate a unique ID for the post
        await newPostRef.set({
            username: username,
            content: postContent,
            timestamp: admin.database.ServerValue.TIMESTAMP // Firebase server timestamp
        });

        return { success: true, message: 'Post created successfully!', topic: formattedTopicName, postId: newPostRef.key };

    } catch (error) {
        console.error("Error creating topic/post:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw Firebase HttpsErrors
        }
        throw new functions.https.HttpsError('unknown', 'Failed to create topic and post.', error.message);
    }
});