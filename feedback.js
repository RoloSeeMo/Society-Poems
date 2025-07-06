// public/js/feedback.js

document.addEventListener('DOMContentLoaded', () => {
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
});
