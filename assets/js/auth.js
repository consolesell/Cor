// Authentication functions for admin panel

// Check if user is logged in
function checkAuthState() {
    auth.onAuthStateChanged(user => {
        const loginForm = document.getElementById('admin-login');
        const dashboard = document.getElementById('admin-dashboard');
        
        if (user) {
            // User is signed in
            loginForm.classList.add('hidden');
            dashboard.classList.remove('hidden');
            
            // Load matches for admin
            loadAdminMatches();
        } else {
            // User is signed out
            loginForm.classList.remove('hidden');
            dashboard.classList.add('hidden');
        }
    });
}

// Handle login form submission
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // Sign in with Firebase Auth
            auth.signInWithEmailAndPassword(email, password)
                .catch(error => {
                    alert(`Login failed: ${error.message}`);
                });
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }
    
    // Initialize auth state check
    checkAuthState();
});
