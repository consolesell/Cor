// Main application functionality
document.addEventListener('DOMContentLoaded', function() {
    // Show splash screen for 3 seconds
    setTimeout(() => {
        const splashScreen = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        if (splashScreen && app) {
            splashScreen.classList.add('fade-out');
            
            setTimeout(() => {
                splashScreen.style.display = 'none';
                app.classList.remove('hidden');
                app.classList.add('fade-in');
                
                // Load matches after splash screen
                loadMatches();
            }, 500);
        } else {
            // We're on the match details page
            loadMatchDetails();
        }
    }, 3000);
    
    // Theme toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter matches based on selected tab
            const filter = button.getAttribute('data-filter');
            filterMatches(filter);
        });
    });
});

// Toggle between light and dark theme
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon.classList.contains('fa-moon')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
    
    // Save theme preference to localStorage
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Apply saved theme on page load
function applyTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }
}

// Check if user prefers dark mode
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}

// Apply saved theme
applyTheme();
