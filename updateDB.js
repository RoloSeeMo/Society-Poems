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
    if (name === "" || email === "" || poem === "") {
        alert("Please fill in all fields.");
        return;
    }

    // Create a new entry in the database
    dbUpload.push({
        name: name,
        email: email,
        poem: poem
    }).then(() => {
        alert("Poem submitted successfully!");
        document.getElementById("uploadForm").reset(); // Reset the form
    }).catch((error) => {
        console.error("Error uploading poem:", error);
        alert("There was an error submitting your poem. Please try again later.");
    });
}

