// updateDB.js
import { db } from './firebase-config.js'; // Import db from centralized config
import { ref, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const form = document.getElementById('uploadForm');
const privacy = document.getElementById('privacy');
const nameField = document.getElementById('nameField');
const username = document.getElementById('username');
const nameLimit = document.getElementById('nameLimit');
const content = document.getElementById('content');
const charCount = document.getElementById('charCount');
const previewBox = document.getElementById('previewBox');
const previewAuthor = document.getElementById('previewAuthor');
const modal = document.getElementById('successModal');
const clearBtn = document.getElementById('clearDraft');

privacy.addEventListener('change', () => {
    nameField.style.display = privacy.value === 'named' ? 'block' : 'none';
    updatePreviewAuthor();
});

username.addEventListener('input', () => {
    nameLimit.textContent = `(${username.value.length}/15)`;
    updatePreviewAuthor();
});

content.addEventListener('input', () => {
    charCount.textContent = `${content.value.length} characters`;
    previewBox.firstChild.textContent = content.value.trim() || "Your writing preview will appear here...";
    localStorage.setItem("draftContent", content.value);
});

function updatePreviewAuthor() {
    if (privacy.value === 'anonymous') {
        previewAuthor.textContent = "- Anonymous";
    } else if (privacy.value === 'named') {
        previewAuthor.textContent = username.value.trim() ? `- ${username.value.trim()}` : "";
    } else {
        previewAuthor.textContent = "";
    }
}

// Load draft
window.addEventListener('load', () => {
    const savedDraft = localStorage.getItem("draftContent");
    if (savedDraft) {
        content.value = savedDraft;
        charCount.textContent = `${savedDraft.length} characters`;
        previewBox.firstChild.textContent = savedDraft;
    }
    updatePreviewAuthor();
});

clearBtn.addEventListener('click', () => {
    content.value = "";
    localStorage.removeItem("draftContent");
    charCount.textContent = "0 characters";
    previewBox.firstChild.textContent = "Your writing preview will appear here...";
    previewAuthor.textContent = "";
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isAnonymous = privacy.value === 'anonymous';
    const name = isAnonymous ? "Anonymous" : username.value.trim();
    const genre = document.getElementById('genre').value;
    const contentValue = content.value.trim();
    const timestamp = new Date().toLocaleString('en-US', { hour12: false });

    if (contentValue === '' || (!isAnonymous && name === '')) {
        alert("Please fill out all required fields.");
        return;
    }

    try {
        await push(ref(db, 'uploads'), { name, genre, content: contentValue, timestamp }); // Use imported push and ref
        localStorage.removeItem("draftContent");
        form.reset();
        nameField.style.display = 'none';
        charCount.textContent = '0 characters';
        previewBox.firstChild.textContent = "Your writing preview will appear here...";
        previewAuthor.textContent = "";
        modal.style.display = 'flex';
    } catch (error) {
        console.error("Error uploading poem:", error);
        alert("There was an error submitting your poem. Please try again later.");
    }
});