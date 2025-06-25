// database.js - Handles interactions with Firebase Realtime Database

import { ref, push, onValue, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';
import { db, auth } from './firebase-config.js';

const messageContainer = document.getElementById('message-container');

function showMessage(type, text) {
    if (!messageContainer) return;
    messageContainer.className = `message-container ${type}-message`;
    messageContainer.textContent = text;
    messageContainer.style.display = 'block';
}

// --- Read Page Logic ---
if (window.location.pathname.includes('read.html')) {
    const entriesContainer = document.getElementById('entriesContainer');
    const entriesRef = ref(db, 'uploads');

    onValue(entriesRef, (snapshot) => {
        entriesContainer.innerHTML = '';
        const data = snapshot.val();
        if (!data) {
            entriesContainer.innerHTML = '<p>No entries yet. Be the first!</p>';
            return;
        }

        const entries = Object.values(data).reverse(); // Show newest first
        entries.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'entry';
            
            // Sanitize content to prevent HTML injection
            const content = document.createElement('p');
            content.className = 'entry-content';
            content.innerText = entry.content; // Use innerText, not innerHTML

            const meta = document.createElement('div');
            meta.className = 'entry-meta';
            const date = new Date(entry.timestamp).toLocaleString();
            meta.innerHTML = `&mdash; <strong>${entry.name || 'Anonymous'}</strong>, <em>${date}</em>`;
            
            div.appendChild(content);
            div.appendChild(meta);
            entriesContainer.appendChild(div);
        });
    });
}

// --- Upload Page Logic ---
if (window.location.pathname.includes('upload.html')) {
    const uploadForm = document.getElementById('uploadForm');
    const privacySelect = document.getElementById('privacy');
    const nameField = document.getElementById('nameField');

    privacySelect.addEventListener('change', () => {
        nameField.style.display = privacySelect.value === 'named' ? 'block' : 'none';
    });

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showMessage('error', 'You must be logged in to upload.');
            return;
        }

        const content = document.getElementById('content').value;
        const name = privacySelect.value === 'named' ? document.getElementById('username').value : 'Anonymous';
        
        const uploadsRef = ref(db, 'uploads');
        push(uploadsRef, {
            uid: user.uid,
            content: content,
            name: name,
            timestamp: serverTimestamp()
        }).then(() => {
            showMessage('success', 'Your writing has been submitted!');
            uploadForm.reset();
            nameField.style.display = 'none';
        }).catch(error => {
            showMessage('error', `Submission failed: ${error.message}`);
        });
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