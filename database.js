// database.js - Handles interactions with Firebase Realtime Database and Cloud Functions

import { onValue, push, ref, remove, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js'; // NEW: Import Firebase Functions
import { app, auth, db } from './firebase-config.js'; // Ensure 'app' is exported from firebase-config.js for functions

const messageContainer = document.getElementById('message-container');
const functions = getFunctions(app); // Initialize Firebase Functions instance

// --- ** IMPORTANT: ADMIN CONFIGURATION ** ---
const ADMIN_UID = "SAD2VGjLrtVA80Cg0ay71rDiijQ2"; // Replace with your actual admin UID.

function showMessage(type, text) {
    if (!messageContainer) return;
    messageContainer.className = `message-container ${type}-message`;
    messageContainer.textContent = text;
    messageContainer.style.display = 'block';
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000); // Hide message after 5 seconds
}

// --- NEW: Helper function to format topic names for consistency (client-side) ---
function formatTopicNameForDisplay(topic) {
    // Convert from stored lowercase/no-space format to a more readable title case
    // This is a basic example, might need more robust handling for complex names
    return topic.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}
function formatTopicNameForStorage(topic) {
    return topic.toLowerCase().replace(/\s/g, ''); // Convert to lowercase and remove all whitespace
}


// --- NEW: Function to get all topics with their upload counts ---
async function getTopicsWithCounts() {
    return new Promise((resolve, reject) => {
        const topicsRef = ref(db, 'topics');
        onValue(topicsRef, (snapshot) => {
            const topicsData = snapshot.val();
            const topics = [];
            if (topicsData) {
                for (const key in topicsData) {
                    if (topicsData.hasOwnProperty(key)) {
                        topics.push({
                            name: key, // The formatted topic name from DB key
                            display_name: formatTopicNameForDisplay(key), // A more readable name for display
                            uploadCount: topicsData[key].uploadCount || 0
                        });
                    }
                }
            }
            resolve(topics.sort((a, b) => b.uploadCount - a.uploadCount)); // Sort by upload count descending
        }, {
            onlyOnce: true // Fetch once, update periodically if needed or re-fetch on new uploads
        }, (error) => {
            console.error("Error fetching topics:", error);
            reject(error);
        });
    });
}

// --- NEW: Function to call the Cloud Function for topic and post creation ---
const createTopicAndPostCloudFunction = httpsCallable(functions, 'createTopicAndPost');
async function createPostWithTopic(topicName, postContent) {
    try {
        const result = await createTopicAndPostCloudFunction({ topicName, postContent });
        return result.data; // { success: true, message: '...', topic: '...', postId: '...' }
    } catch (error) {
        console.error("Error calling createTopicAndPost Cloud Function:", error);
        throw error;
    }
}

// --- Read Page Logic (UPDATED) ---
if (window.location.pathname.includes('read.html')) {
    const genreSelectionView = document.getElementById('genre-selection-view');
    const entriesView = document.getElementById('entries-view');
    const entriesContainer = document.getElementById('entriesContainer');
    const genreButtonsContainer = document.getElementById('genre-buttons-container'); // Now for topics
    const backToGenresBtn = document.getElementById('back-to-genres-btn');
    const entriesViewTitle = document.getElementById('entries-view-title');

    let allTopics = []; // Stores all fetched topics
    let currentOpenTopic = null; // Tracks the currently viewed topic

    // Function to populate topics on read.html
    const setupLiveTopicsListener = () => {
        const topicsRef = ref(db, 'topics');
        onValue(topicsRef, (snapshot) => {
            const topicsData = snapshot.val();
            allTopics = [];
            if (topicsData) {
                for (const key in topicsData) {
                    if (topicsData.hasOwnProperty(key)) {
                        allTopics.push({
                            name: key,
                            display_name: formatTopicNameForDisplay(key),
                            uploadCount: topicsData[key].uploadCount || 0
                        });
                    }
                }
            }

            allTopics.sort((a, b) => b.uploadCount - a.uploadCount); // Sort by upload count

            genreButtonsContainer.innerHTML = ''; // Clear previous buttons
            if (allTopics.length > 0) {
                allTopics.forEach(topic => {
                    const button = document.createElement('button');
                    button.className = 'genre-button'; // Reusing existing class for styling
                    button.dataset.topic = topic.name; // Use the formatted topic name as data attribute
                    button.innerHTML = `${topic.display_name} <span class="genre-count">Posts: ${topic.uploadCount}</span>`;
                    genreButtonsContainer.appendChild(button);
                });
            } else {
                genreButtonsContainer.innerHTML = '<p>No topics created yet. Be the first to upload!</p>';
            }

            // If a topic is currently open, refresh its view
            if (currentOpenTopic) {
                loadPostsByTopic(currentOpenTopic, true); // `true` indicates a refresh
            }
        }, (error) => {
            console.error("Error setting up live topics listener:", error);
            genreButtonsContainer.innerHTML = '<p>Error loading topics.</p>';
        });
    };

    // Function to load and display posts for a selected topic
    const loadPostsByTopic = (selectedTopicName, isRefresh = false) => {
        if (!isRefresh) {
            genreSelectionView.style.display = 'none';
            entriesView.style.display = 'block';
        }
        currentOpenTopic = selectedTopicName;
        const topicDisplayName = allTopics.find(t => t.name === selectedTopicName)?.display_name || formatTopicNameForDisplay(selectedTopicName);
        entriesViewTitle.textContent = topicDisplayName;
        entriesContainer.innerHTML = '<p>Loading posts...</p>';

        const postsRef = ref(db, `topics/${selectedTopicName}/posts`);
        onValue(postsRef, (snapshot) => {
            entriesContainer.innerHTML = ''; // Clear existing posts
            const postsData = snapshot.val();
            const postsForTopic = [];

            if (postsData) {
                for (const key in postsData) {
                    if (postsData.hasOwnProperty(key)) {
                        const post = postsData[key];
                        post.dbKey = key; // Store the RTDB key for deletion if needed
                        postsForTopic.push(post);
                    }
                }
            }

            postsForTopic.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending

            if (postsForTopic.length === 0) {
                entriesContainer.innerHTML = `<p>No posts found for the topic "${topicDisplayName}".</p>`;
                return;
            }

            postsForTopic.forEach(post => {
                const div = document.createElement('div');
                div.className = 'entry'; // Reusing existing class for styling
                
                const content = document.createElement('p');
                content.className = 'entry-content';
                content.innerText = post.content;

                const meta = document.createElement('div');
                meta.className = 'entry-meta';
                const date = new Date(post.timestamp).toLocaleString();
                meta.innerHTML = `&mdash; <strong>${post.username || 'Anonymous'}</strong>, <em>${date}</em>`; // Use post.username

                // Admin Delete Button Logic (for individual posts within a topic)
                if (auth.currentUser && auth.currentUser.uid === ADMIN_UID) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.title = 'Delete this post';
                    deleteBtn.dataset.topic = selectedTopicName;
                    deleteBtn.dataset.postKey = post.dbKey;
                    div.appendChild(deleteBtn);
                }

                div.appendChild(content);
                div.appendChild(meta);
                entriesContainer.appendChild(div);
            });
        }, (error) => {
            console.error("Error loading posts by topic:", error);
            entriesContainer.innerHTML = `<p>Error loading posts for "${topicDisplayName}".</p>`;
        });
    };

    // Event listener for topic buttons
    genreButtonsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.genre-button');
        if (button && button.dataset.topic) {
            loadPostsByTopic(button.dataset.topic);
        }
    });

    backToGenresBtn.addEventListener('click', () => {
        currentOpenTopic = null; // Clear the current topic
        entriesView.style.display = 'none';
        genreSelectionView.style.display = 'block';
    });

    // Event listener for deleting posts from read.html
    entriesContainer.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('delete-btn')) {
            const topicName = e.target.dataset.topic;
            const postKey = e.target.dataset.postKey;
            if (topicName && postKey && confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) {
                // Call delete function for a post within a topic
                deletePostInTopic(topicName, postKey);
            }
        }
    });

    // --- NEW: Function to delete a post within a topic ---
    async function deletePostInTopic(topicName, postKey) {
        const postRef = ref(db, `topics/${topicName}/posts/${postKey}`);
        const topicUploadCountRef = ref(db, `topics/${topicName}/uploadCount`);

        try {
            await remove(postRef); // Delete the post
            
            // Decrement topic upload count using a transaction
            await new Promise(resolve => {
                onValue(topicUploadCountRef, (snapshot) => {
                    const currentCount = snapshot.val();
                    if (currentCount > 0) {
                        snapshot.ref.transaction(count => (count || 0) - 1);
                    }
                    resolve();
                }, { onlyOnce: true });
            });

            console.log(`Post ${postKey} deleted successfully from topic ${topicName}.`);
            showMessage('success', 'Post deleted successfully.');
            // The live listener will automatically refresh the display.
        } catch (error) {
            console.error('Error deleting post in topic:', error);
            showMessage('error', `Error deleting post: ${error.message}`);
        }
    }

    // Initialize state on read.html (this is typically called after auth state check)
    // The checkAuthState_impl from auth.js should call setupLiveTopicsListener or equivalent.
    // For now, call directly to ensure topics load.
    setupLiveTopicsListener();
}


// --- Upload Page Logic (UPDATED and moved from upload.html) ---
if (window.location.pathname.includes('upload.html')) {
    const uploadForm = document.getElementById('uploadForm');
    const authorNameEl = document.getElementById('author-name');
    const messageContainer = document.getElementById('message-container');

    // NEW Topic UI elements
    const topicSelectionSection = document.getElementById('topic-selection-section');
    const chooseExistingRadio = document.getElementById('chooseExisting');
    const createNewRadio = document.getElementById('createNew');
    const existingTopicGroup = document.getElementById('existingTopicGroup');
    const newTopicGroup = document.getElementById('newTopicGroup');
    const topicSelect = document.getElementById('topicSelect');
    const topicInput = document.getElementById('topicInput');
    const topicError = document.getElementById('topicError');
    const proceedToPostBtn = document.getElementById('proceedToPostBtn');
    const postContentSection = document.getElementById('postContentSection');
    const contentTextarea = document.getElementById('content');
    const submitBtn = document.getElementById('submit-btn');

    let currentUsername = null; // Variable to hold the fetched username
    let allTopicsRaw = []; // Store raw topics for case-insensitive check

    // Function to fetch username (moved from upload.html inline script)
    const fetchUsername = (uid) => {
        const userRef = ref(db, 'users/' + uid + '/username');
        onValue(userRef, (snapshot) => { // Use onValue for live updates if username can change
            const username = snapshot.val();
            if (username) {
                currentUsername = username;
                authorNameEl.textContent = username;
                // No longer enabling submit button here, it's enabled after topic selection
            } else {
                authorNameEl.textContent = "No username set. Please contact support.";
                // Keep the submit button disabled
            }
        }, { onlyOnce: true }); // Only fetch once for initial load
    };

    // Populate existing topics dropdown
    const populateTopicsDropdown = async () => {
        topicSelect.innerHTML = '<option value="" disabled selected>-- Loading Topics --</option>';
        try {
            const topics = await getTopicsWithCounts();
            allTopicsRaw = topics.map(t => t.name); // Store raw names for validation
            if (topics.length > 0) {
                topicSelect.innerHTML = '<option value="" disabled selected>-- Select an existing topic --</option>';
                topics.forEach(topic => {
                    const option = document.createElement('option');
                    option.value = topic.name; // Use formatted name as value
                    option.textContent = `${topic.display_name} (${topic.uploadCount} posts)`;
                    topicSelect.appendChild(option);
                });
                chooseExistingRadio.checked = true; // Default to existing
                existingTopicGroup.style.display = 'block';
                newTopicGroup.style.display = 'none';
                topicSelect.removeAttribute('disabled');
            } else {
                topicSelect.innerHTML = '<option value="" disabled selected>-- No existing topics --</option>';
                topicSelect.setAttribute('disabled', 'true');
                createNewRadio.checked = true; // Force new if no existing
                existingTopicGroup.style.display = 'none';
                newTopicGroup.style.display = 'block';
            }
            validateTopicSelection(); // Validate initial state
        } catch (error) {
            console.error("Error populating topics:", error);
            topicSelect.innerHTML = '<option value="" disabled selected>-- Error loading topics --</option>';
            showMessage('error', 'Error loading topics for selection.');
        }
    };

    // --- Topic Validation Logic ---
    const validateTopicName = (name) => {
        const trimmedName = name.trim();
        if (trimmedName === '') {
            topicError.textContent = 'Topic name cannot be blank.';
            topicError.style.display = 'block';
            return false;
        }
        if (trimmedName.length > 100) {
            topicError.textContent = 'Topic name cannot exceed 100 characters.';
            topicError.style.display = 'block';
            return false;
        }
        // Case-insensitive duplication check against existing topics
        const formattedNewTopic = formatTopicNameForStorage(trimmedName);
        if (allTopicsRaw.includes(formattedNewTopic)) {
            topicError.textContent = `Topic "${trimmedName}" (or similar) already exists. Please select it from the dropdown.`;
            topicError.style.display = 'block';
            return false;
        }
        topicError.style.display = 'none';
        return true;
    };

    const validateTopicSelection = () => {
        let topicIsValid = false;
        if (chooseExistingRadio.checked) {
            topicIsValid = topicSelect.value !== '';
        } else if (createNewRadio.checked) {
            topicIsValid = validateTopicName(topicInput.value);
        }
        proceedToPostBtn.disabled = !topicIsValid;
        return topicIsValid;
    };


    // Event Listeners for topic selection UI
    chooseExistingRadio.addEventListener('change', () => {
        existingTopicGroup.style.display = 'block';
        newTopicGroup.style.display = 'none';
        topicInput.value = ''; // Clear new topic input
        validateTopicSelection();
    });

    createNewRadio.addEventListener('change', () => {
        existingTopicGroup.style.display = 'none';
        newTopicGroup.style.display = 'block';
        topicSelect.value = ''; // Clear selected topic
        validateTopicSelection();
    });

    topicSelect.addEventListener('change', validateTopicSelection);
    topicInput.addEventListener('input', validateTopicSelection);


    proceedToPostBtn.addEventListener('click', () => {
        if (validateTopicSelection()) {
            topicSelectionSection.style.display = 'none';
            postContentSection.style.display = 'block';
            submitBtn.disabled = false; // Enable submit button once post section is visible
        }
    });

    // Form submission logic (UPDATED)
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !currentUsername) {
            showMessage('error', 'Cannot submit without a valid user and username.');
            return;
        }

        const postContent = contentTextarea.value.trim();
        let selectedTopic = null;

        if (chooseExistingRadio.checked) {
            selectedTopic = topicSelect.value;
        } else if (createNewRadio.checked) {
            selectedTopic = topicInput.value.trim();
        }

        if (!selectedTopic || !postContent) {
            showMessage('error', 'Please select/create a topic and enter your writing.');
            return;
        }
        
        submitBtn.disabled = true; // Disable submit button during submission
        showMessage('info', 'Submitting your post...');

        try {
            const result = await createPostWithTopic(selectedTopic, postContent);
            if (result.success) {
                showMessage('success', result.message);
                uploadForm.reset();
                // Reset UI state for next upload
                postContentSection.style.display = 'none';
                topicSelectionSection.style.display = 'block';
                chooseExistingRadio.checked = true;
                topicInput.value = '';
                await populateTopicsDropdown(); // Re-populate to show new topic if created
            } else {
                showMessage('error', `Submission failed: ${result.message}`);
            }
        } catch (error) {
            console.error("Submission error:", error);
            let errorMessage = "An unexpected error occurred.";
            if (error.code && error.message) {
                // Firebase Cloud Function HttpsError
                errorMessage = `Submission failed: ${error.message}`;
            } else if (error.message) {
                errorMessage = `Submission failed: ${error.message}`;
            }
            showMessage('error', errorMessage);
        } finally {
            submitBtn.disabled = false; // Re-enable submit button
        }
    });

    // Initialize shared functions and upload specific setup
    // These functions need to be imported or handled by a central app.js
    // For now, assuming they are set up by the module loader or a global 'checkAuthState'
    // This part assumes that `checkAuthState_impl` (from common/auth.js or similar)
    // will call `fetchUsername(user.uid)` and ultimately `populateTopicsDropdown()`
    // once the user is authenticated.
    // Ensure `checkAuthState_impl` calls `fetchUsername(user.uid); populateTopicsDropdown();`
    // after successful auth in the common module.

    // Awaiting a user auth check before populating dropdown and fetching username
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html'; // Redirect if not logged in
        } else {
            // Fetch username and populate topics once authenticated
            fetchUsername(user.uid);
            populateTopicsDropdown();
            document.body.style.visibility = 'visible'; // Show body after content loads
        }
    });
}


// --- Feedback Page Logic ---
if (window.location.pathname.includes('feedback.html')) {
    const feedbackForm = document.getElementById('feedbackForm');
    feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        const feedbackRef = ref(db, 'feedback');
        push(feedbackRef, {
            name, email, message, timestamp: serverTimestamp()
        }).then(() => {
            showMessage('success', 'Thank you for your feedback!');
            feedbackForm.reset();
        }).catch(error => {
            showMessage('error', `Submission failed: ${error.message}`);
        });
    });
}

// Global functions for shared UI (assuming these are called once in a central script like app.js or index.html)
// They are kept here for completeness but ideally would be in a shared utility file or app.js
export const setupMobileMenu = () => { // Exported for use in app.js
    const openBtn = document.getElementById('menu-open-button');
    const closeBtn = document.getElementById('menu-close-button');
    const navMenu = document.querySelector('.nav-menu');
    if (openBtn && closeBtn && navMenu) {
        openBtn.addEventListener('click', () => navMenu.classList.add('active'));
        closeBtn.addEventListener('click', () => navMenu.classList.remove('active'));
    }
};

export const handleLogout = () => { // Exported for use in app.js
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().catch(error => console.error('Sign out error', error));
        });
    }
};

// Assuming common auth check in app.js or index.html that uses 'auth' from firebase-config.js
// and then calls page-specific initializations.
// If this `database.js` is imported by `app.js`, then `checkAuthState` might be better centralized.
// For now, I've added `auth.onAuthStateChanged` directly in `if(window.location.pathname.includes('upload.html'))`
// and `if(window.location.pathname.includes('read.html'))` for direct initialization.