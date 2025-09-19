// Global variables
let users = [];
let editingUserId = null;
let filteredUsers = [];
let sessionId = null;
let currentUser = null;

// DOM elements
const userForm = document.getElementById('user-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const searchInput = document.getElementById('search-input');
const usersContainer = document.getElementById('users-container');
const messageContainer = document.getElementById('message-container');
const loading = document.getElementById('loading');
const userNameSpan = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// Filter elements
const dobFilter = document.getElementById('dob-filter');
const anniversaryFilter = document.getElementById('anniversary-filter');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const filterStatus = document.getElementById('filter-status');

// Form inputs
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const dobInput = document.getElementById('dob');
const anniversaryDateInput = document.getElementById('anniversaryDate');
const mobileNumberInput = document.getElementById('mobileNumber');

// Error elements
const firstNameError = document.getElementById('firstName-error');
const lastNameError = document.getElementById('lastName-error');
const dobError = document.getElementById('dob-error');
const anniversaryDateError = document.getElementById('anniversaryDate-error');
const mobileNumberError = document.getElementById('mobileNumber-error');

// API base URL
const API_BASE_URL = '/api/users';

// Authentication functions
function getAuthHeaders() {
    return {
        'Authorization': sessionId,
        'Content-Type': 'application/json'
    };
}

async function checkAuthentication() {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('user');
    
    if (!storedSessionId || !storedUser) {
        redirectToLogin();
        return false;
    }
    
    sessionId = storedSessionId;
    currentUser = JSON.parse(storedUser);
    
    // Verify session is still valid
    try {
        const response = await fetch('/api/auth/check', {
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (!result.success) {
            // Session expired
            localStorage.removeItem('sessionId');
            localStorage.removeItem('user');
            redirectToLogin();
            return false;
        }
        
        // Update user info display
        userNameSpan.textContent = `Welcome, ${currentUser.username}`;
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    localStorage.removeItem('sessionId');
    localStorage.removeItem('user');
    window.location.href = '/';
}

async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('user');
        redirectToLogin();
    }
}

// Utility functions
function showMessage(message, type = 'success') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageContainer.appendChild(messageEl);
    
    // Trigger animation
    setTimeout(() => messageEl.classList.add('show'), 100);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => messageContainer.removeChild(messageEl), 300);
    }, 5000);
}

function clearErrors() {
    const errorElements = [firstNameError, lastNameError, dobError, anniversaryDateError, mobileNumberError];
    errorElements.forEach(errorEl => {
        errorEl.textContent = '';
        errorEl.classList.remove('show');
    });
    
    const inputElements = [firstNameInput, lastNameInput, dobInput, anniversaryDateInput, mobileNumberInput];
    inputElements.forEach(inputEl => {
        inputEl.classList.remove('error');
    });
}

function showError(field, message) {
    const errorMap = {
        'firstName': firstNameError,
        'lastName': lastNameError,
        'dob': dobError,
        'anniversaryDate': anniversaryDateError,
        'mobileNumber': mobileNumberError
    };
    
    const inputMap = {
        'firstName': firstNameInput,
        'lastName': lastNameInput,
        'dob': dobInput,
        'anniversaryDate': anniversaryDateInput,
        'mobileNumber': mobileNumberInput
    };
    
    if (errorMap[field]) {
        errorMap[field].textContent = message;
        errorMap[field].classList.add('show');
        inputMap[field].classList.add('error');
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatMobileNumber(mobileNumber) {
    if (!mobileNumber) return '';
    // Remove any non-digit characters except +
    const cleaned = mobileNumber.replace(/[^\d+]/g, '');
    return cleaned;
}

function createWhatsAppLink(mobileNumber) {
    if (!mobileNumber) return '';
    const cleaned = formatMobileNumber(mobileNumber);
    return `https://wa.me/${cleaned}`;
}

// API functions
async function fetchUsers() {
    try {
        loading.style.display = 'block';
        const response = await fetch(API_BASE_URL, {
            headers: getAuthHeaders()
        });
        const result = await response.json();
        
        if (result.success) {
            users = result.data;
            filteredUsers = [...users];
            // Don't render users here - let setDefaultFilterDates handle it
        } else {
            showMessage('Failed to fetch users', 'error');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        showMessage('Error connecting to server', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

async function createUser(userData) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('User created successfully!');
            resetForm();
            await fetchUsers();
        } else {
            if (result.errors) {
                result.errors.forEach(error => {
                    if (error.includes('First name')) {
                        showError('firstName', error);
                    } else if (error.includes('Last name')) {
                        showError('lastName', error);
                    } else if (error.includes('DOB')) {
                        showError('dob', error);
                    } else if (error.includes('Anniversary Date')) {
                        showError('anniversaryDate', error);
                    } else if (error.includes('Either DOB or Anniversary Date')) {
                        showError('dob', error);
                        showError('anniversaryDate', error);
                    }
                });
            } else {
                showMessage(result.message || 'Failed to create user', 'error');
            }
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showMessage('Error connecting to server', 'error');
    }
}

async function updateUser(userId, userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('User updated successfully!');
            resetForm();
            await fetchUsers();
        } else {
            if (result.errors) {
                result.errors.forEach(error => {
                    if (error.includes('First name')) {
                        showError('firstName', error);
                    } else if (error.includes('Last name')) {
                        showError('lastName', error);
                    } else if (error.includes('DOB')) {
                        showError('dob', error);
                    } else if (error.includes('Anniversary Date')) {
                        showError('anniversaryDate', error);
                    } else if (error.includes('Either DOB or Anniversary Date')) {
                        showError('dob', error);
                        showError('anniversaryDate', error);
                    }
                });
            } else {
                showMessage(result.message || 'Failed to update user', 'error');
            }
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showMessage('Error connecting to server', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('User deleted successfully!');
            await fetchUsers();
        } else {
            showMessage(result.message || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error connecting to server', 'error');
    }
}

// Form functions
function resetForm() {
    userForm.reset();
    clearErrors();
    editingUserId = null;
    formTitle.textContent = 'Add New User';
    submitBtn.textContent = 'Add User';
    cancelBtn.style.display = 'none';
}

function populateForm(user) {
    firstNameInput.value = user.firstName || '';
    lastNameInput.value = user.lastName || '';
    dobInput.value = user.dob || '';
    anniversaryDateInput.value = user.anniversaryDate || '';
    mobileNumberInput.value = user.mobileNumber || '';
    
    editingUserId = user.id;
    formTitle.textContent = 'Edit User';
    submitBtn.textContent = 'Update User';
    cancelBtn.style.display = 'inline-block';
}

function validateForm() {
    clearErrors();
    let isValid = true;
    
    if (!firstNameInput.value.trim()) {
        showError('firstName', 'First name is required');
        isValid = false;
    }
    
    if (!lastNameInput.value.trim()) {
        showError('lastName', 'Last name is required');
        isValid = false;
    }
    
    if (!dobInput.value && !anniversaryDateInput.value) {
        showError('dob', 'Either DOB or Anniversary Date must be provided');
        showError('anniversaryDate', 'Either DOB or Anniversary Date must be provided');
        isValid = false;
    }
    
    return isValid;
}

// Render functions
function renderUsers() {
    if (filteredUsers.length === 0) {
        usersContainer.innerHTML = `
            <div class="empty-state">
                <h3>No users found</h3>
                <p>Start by adding your first user!</p>
            </div>
        `;
        return;
    }
    
    usersContainer.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-header">
                <div class="user-name">${user.firstName} ${user.lastName}</div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser(${user.id})">Edit</button>
                    <button class="btn-delete" onclick="deleteUser(${user.id})">Delete</button>
                </div>
            </div>
            <div class="user-details">
                <div class="user-detail">
                    <div class="user-detail-label">First Name</div>
                    <div class="user-detail-value">${user.firstName}</div>
                </div>
                <div class="user-detail">
                    <div class="user-detail-label">Last Name</div>
                    <div class="user-detail-value">${user.lastName}</div>
                </div>
                <div class="user-detail">
                    <div class="user-detail-label">Date of Birth</div>
                    <div class="user-detail-value">${formatDate(user.dob)}</div>
                </div>
                <div class="user-detail">
                    <div class="user-detail-label">Anniversary Date</div>
                    <div class="user-detail-value">${formatDate(user.anniversaryDate)}</div>
                </div>
                <div class="user-detail">
                    <div class="user-detail-label">Mobile Number</div>
                    <div class="user-detail-value">
                        ${user.mobileNumber ? 
                            `<a href="${createWhatsAppLink(user.mobileNumber)}" target="_blank" class="whatsapp-link" title="Open WhatsApp">${user.mobileNumber}</a>` : 
                            '<span class="no-data">Not provided</span>'
                        }
                    </div>
                </div>
            </div>
            <div class="user-meta">
                Created: ${formatDateTime(user.createdAt)}
                ${user.updatedAt ? ` | Updated: ${formatDateTime(user.updatedAt)}` : ''}
            </div>
        </div>
    `).join('');
}

function filterUsers(searchTerm) {
    // This function is called when search input changes
    // The actual filtering logic is now handled in applyDateFilters()
    applyDateFilters();
}

function applyDateFilters() {
    const dobFilterValue = dobFilter.value.trim();
    const anniversaryFilterValue = anniversaryFilter.value.trim();
    
    // Start with all users, then apply search filter first
    let tempUsers = [...users];
    
    // Apply search filter if there's a search term
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        tempUsers = tempUsers.filter(user => 
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    // If no date filters are applied, show search results
    if (!dobFilterValue && !anniversaryFilterValue) {
        filteredUsers = tempUsers;
        renderUsers();
        return;
    }
    
    // Apply date filters
    filteredUsers = tempUsers.filter(user => {
        let dobMatch = false;
        let anniversaryMatch = false;
        
        // Check DOB filter (DD/MM format)
        if (dobFilterValue) {
            if (user.dob) {
                const userDob = new Date(user.dob);
                const userDay = String(userDob.getDate()).padStart(2, '0');
                const userMonth = String(userDob.getMonth() + 1).padStart(2, '0');
                const userDDMM = `${userDay}/${userMonth}`;
                
                dobMatch = userDDMM === dobFilterValue;
            }
        }
        
        // Check Anniversary filter (DD/MM format)
        if (anniversaryFilterValue) {
            if (user.anniversaryDate) {
                const userAnniversary = new Date(user.anniversaryDate);
                const userDay = String(userAnniversary.getDate()).padStart(2, '0');
                const userMonth = String(userAnniversary.getMonth() + 1).padStart(2, '0');
                const userDDMM = `${userDay}/${userMonth}`;
                
                anniversaryMatch = userDDMM === anniversaryFilterValue;
            }
        }
        
        // If both filters are active, return true if ANY match
        if (dobFilterValue && anniversaryFilterValue) {
            return dobMatch || anniversaryMatch;
        }
        // If only DOB filter is active, return DOB match
        else if (dobFilterValue) {
            return dobMatch;
        }
        // If only Anniversary filter is active, return Anniversary match
        else if (anniversaryFilterValue) {
            return anniversaryMatch;
        }
        
        return true; // This should never reach here due to early return above
    });
    
    renderUsers();
    updateFilterStatus();
}

function updateFilterStatus() {
    const dobFilterValue = dobFilter.value.trim();
    const anniversaryFilterValue = anniversaryFilter.value.trim();
    const searchTerm = searchInput.value.trim();
    
    let statusText = '';
    
    if (searchTerm && (dobFilterValue || anniversaryFilterValue)) {
        statusText = `Search: "${searchTerm}" + Date filters applied (${filteredUsers.length} users)`;
    } else if (searchTerm) {
        statusText = `Search: "${searchTerm}" (${filteredUsers.length} users)`;
    } else if (dobFilterValue || anniversaryFilterValue) {
        statusText = `Date filters applied (${filteredUsers.length} users)`;
    } else {
        statusText = `Showing all users (${filteredUsers.length} users)`;
    }
    
    filterStatus.textContent = statusText;
}

function clearAllFilters() {
    searchInput.value = '';
    
    // Reset to today's date
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const todayDDMM = `${day}/${month}`;
    
    dobFilter.value = todayDDMM;
    anniversaryFilter.value = todayDDMM;
    
    // Apply filters with today's date
    applyDateFilters();
}

function formatDateInput(event) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    event.target.value = value;
}

// Event handlers
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const userData = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        dob: dobInput.value || null,
        anniversaryDate: anniversaryDateInput.value || null,
        mobileNumber: mobileNumberInput.value.trim() || null
    };
    
    if (editingUserId) {
        await updateUser(editingUserId, userData);
    } else {
        await createUser(userData);
    }
});

cancelBtn.addEventListener('click', () => {
    resetForm();
});

searchInput.addEventListener('input', (e) => {
    filterUsers(e.target.value);
});

// Date filter event listeners
dobFilter.addEventListener('input', applyDateFilters);
anniversaryFilter.addEventListener('input', applyDateFilters);

// Add input formatting for DD/MM
dobFilter.addEventListener('input', formatDateInput);
anniversaryFilter.addEventListener('input', formatDateInput);

// Clear filters button event listener
clearFiltersBtn.addEventListener('click', clearAllFilters);

// Logout button event listener
logoutBtn.addEventListener('click', logout);

// Global functions for onclick handlers
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        populateForm(user);
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuthentication();
    
    if (isAuthenticated) {
        // Load users data first
        await fetchUsers();
        
        // Then set today's date as default for filters and apply them
        setDefaultFilterDates();
    }
});

function setDefaultFilterDates() {
    // Small delay to ensure DOM elements are ready
    setTimeout(() => {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const todayDDMM = `${day}/${month}`;
        
        // Set default values
        dobFilter.value = todayDDMM;
        anniversaryFilter.value = todayDDMM;
        
        // Apply filters with default values
        applyDateFilters();
    }, 100);
}
