// DOM elements
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const errorMessage = document.getElementById('error-message');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show loading state
function showLoading() {
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    loginForm.classList.add('loading');
}

// Hide loading state
function hideLoading() {
    loginBtn.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
    loginForm.classList.remove('loading');
}

// Clear form
function clearForm() {
    loginForm.reset();
    errorMessage.style.display = 'none';
}

// Handle login
async function handleLogin(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Store session ID in localStorage
            localStorage.setItem('sessionId', result.sessionId);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            // Show success animation
            loginBtn.classList.add('login-success');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 800);
        } else {
            showError(result.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
    }
}

// Form submission handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Basic validation
    if (!username || !password) {
        showError('Please enter both username and password');
        return;
    }
    
    showLoading();
    
    try {
        await handleLogin(username, password);
    } finally {
        hideLoading();
    }
});

// Clear error when user starts typing
usernameInput.addEventListener('input', () => {
    if (errorMessage.style.display === 'block') {
        errorMessage.style.display = 'none';
    }
});

passwordInput.addEventListener('input', () => {
    if (errorMessage.style.display === 'block') {
        errorMessage.style.display = 'none';
    }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const sessionId = localStorage.getItem('sessionId');
    
    if (sessionId) {
        // Verify session is still valid
        fetch('/api/auth/check', {
            headers: {
                'Authorization': sessionId
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Already logged in, redirect to dashboard
                window.location.href = '/dashboard';
            } else {
                // Session expired, clear storage
                localStorage.removeItem('sessionId');
                localStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.error('Auth check error:', error);
            localStorage.removeItem('sessionId');
            localStorage.removeItem('user');
        });
    }
});

// Auto-fill demo credentials on double-click
usernameInput.addEventListener('dblclick', () => {
    usernameInput.value = 'admin';
    passwordInput.value = 'admin123';
});

passwordInput.addEventListener('dblclick', () => {
    usernameInput.value = 'manager';
    passwordInput.value = 'manager123';
});
