import firebase from 'firebase/app';
import 'firebase/database';

// Import the Firebase configuration and initialize the app
const firebaseConfig = {
    apiKey: "AIzaSyDHXEMtVPn46b2qS1CPGUIEuQ8ntLyvLVM",
    authDomain: "society-poems-97f4d.firebaseapp.com",
    databaseURL: "https://society-poems-97f4d-default-rtdb.firebaseio.com",
    projectId: "society-poems-97f4d",
    storageBucket: "society-poems-97f4d.firebasestorage.app",
    messagingSenderId: "723670230106",
    appId: "1:723670230106:web:6d6dda4f8c46626c55a463"
  };

firebase.initializeApp(firebaseConfig);



var dbUpload = firebase.database().ref("uploadForm");
document.getElementById("uploadForm").addEventListener("submit", submitForm);

function submitForm(e){
    e.preventDefault(); 
    if (document.getElementById("privacy").value !== "anonymous"){
            var name = (document.getElementById("nameFeild").getElementById("username"));
        }else{
            var name = (document.getElementById("privacy").value);
        }
        // var name = document.getElementById("name").value;
    var category = document.getElementById("genre").value;
    var writing = document.getElementById("content").value;
            
    console.log(name, category, writing);

    // Validate form values
    if (name === "" || category === "" || writing === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Create a new entry in the database
    dbUpload.push({
        name: name,
        category: category,
        writing: writing
    }).then(() => {
        alert("Poem submitted successfully!");
        document.getElementById("uploadForm").reset(); // Reset the form
    }).catch((error) => {
        console.error("Error uploading poem:", error);
        alert("There was an error submitting your poem. Please try again later.");
    });
}


    

const db = getDatabase(app);

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

      const newEntry = { name, genre, content: contentValue, timestamp };
      await push(ref(db, 'uploads'), newEntry);

      localStorage.removeItem("draftContent");
      form.reset();
      nameField.style.display = 'none';
      charCount.textContent = '0 characters';
      previewBox.firstChild.textContent = "Your writing preview will appear here...";
      previewAuthor.textContent = "";
      modal.style.display = 'flex';
});