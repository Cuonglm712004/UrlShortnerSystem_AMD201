const API_BASE = '/api/url';
const AUTH_API_BASE = '/api/auth';

// Global variables
let currentUser = null;
let authToken = null;

// DOM Elements - sẽ được khởi tạo sau khi DOM load
let urlForm, loginForm, registerForm, resultSection, shortUrlResult, originalUrlResult, urlsList, authButtons, userInfo, userFullName;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing elements...');
    
    // Initialize DOM elements
    urlForm = document.getElementById('urlForm');
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    resultSection = document.getElementById('resultSection');
    shortUrlResult = document.getElementById('shortUrlResult');
    originalUrlResult = document.getElementById('originalUrlResult');
    urlsList = document.getElementById('urlsList');
    authButtons = document.getElementById('authButtons');
    userInfo = document.getElementById('userInfo');
    userFullName = document.getElementById('userFullName');
    
    // Debug logging
    console.log('Current location info:', {
        origin: window.location.origin,
        port: window.location.port,
        hostname: window.location.hostname,
        protocol: window.location.protocol
    });
    
    console.log('Elements found:', {
        urlForm: !!urlForm,
        resultSection: !!resultSection,
        shortUrlResult: !!shortUrlResult,
        originalUrlResult: !!originalUrlResult,
        urlsList: !!urlsList
    });
    
    // Add event listeners
    if (urlForm) {
        urlForm.addEventListener('submit', handleFormSubmit);
        console.log('URL form event listener added');
    } else {
        console.error('urlForm not found!');
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Check if user is already logged in
    checkAuthStatus();
    loadUrls();
});

// Authentication functions
function checkAuthStatus() {
    authToken = localStorage.getItem('authToken');
    if (authToken) {
        // Verify token with server
        fetch(`${AUTH_API_BASE}/check`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Token invalid');
            }
        })
        .then(data => {
            currentUser = data;
            updateUIForAuthenticatedUser();
        })
        .catch(() => {
            logout();
        });
    }
}

function updateUIForAuthenticatedUser() {
    if (currentUser && authButtons && userInfo && userFullName) {
        authButtons.style.display = 'none';
        userInfo.style.display = 'block';
        userFullName.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    } else if (authButtons && userInfo) {
        authButtons.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showLoading(true, 'loginForm');
        const response = await fetch(`${AUTH_API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                if (responseText.trim()) {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } else {
                    errorMessage = `Server error: ${response.status}`;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorMessage = `Server error: ${response.status} - ${responseText}`;
            }
            throw new Error(errorMessage);
        }
        
        // Parse success response
        let result;
        if (responseText.trim()) {
            result = JSON.parse(responseText);
        } else {
            throw new Error('Empty response from server');
        }
        authToken = result.token;
        localStorage.setItem('authToken', authToken);
        
        currentUser = {
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName
        };
        
        updateUIForAuthenticatedUser();
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            const modal = bootstrap.Modal.getInstance(loginModal);
            if (modal) modal.hide();
        }
        loginForm.reset();
        showSuccess('Login successful!');
        loadUrls(); // Refresh URLs to show user's URLs
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    } finally {
        showLoading(false, 'loginForm');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    try {
        showLoading(true, 'registerForm');
        
        const requestBody = {
            firstName,
            lastName,
            email,
            password,
            confirmPassword
        };
        
        const response = await fetch(`${AUTH_API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
            let errorMessage = 'Registration failed';
            try {
                if (responseText) {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } else {
                    errorMessage = `Server error: ${response.status}`;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorMessage = `Server error: ${response.status} - ${responseText}`;
            }
            throw new Error(errorMessage);
        }
        
        // Parse success response
        let result;
        if (responseText.trim()) {
            result = JSON.parse(responseText);
        } else {
            throw new Error('Empty response from server');
        }
        console.log('Registration successful:', result);
        
        authToken = result.token;
        localStorage.setItem('authToken', authToken);
        
        currentUser = {
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName
        };
        
        updateUIForAuthenticatedUser();
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            const modal = bootstrap.Modal.getInstance(registerModal);
            if (modal) modal.hide();
        }
        registerForm.reset();
        showSuccess('Registration successful!');
        loadUrls(); // Refresh URLs
        
    } catch (error) {
        console.error('Registration error:', error);
        showError(error.message);
    } finally {
        showLoading(false, 'registerForm');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    updateUIForAuthenticatedUser();
    
    // Clear URLs list when logging out
    if (urlsList) {
        urlsList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-link fa-2x mb-3"></i>
                <p>Please login to view and manage your URLs</p>
            </div>
        `;
    }
    
    showSuccess('Logged out successfully');
}

function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        new bootstrap.Modal(loginModal).show();
    }
}

function showRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    if (registerModal) {
        new bootstrap.Modal(registerModal).show();
    }
}

function showProfile() {
    if (currentUser) {
        fetch(`${AUTH_API_BASE}/profile`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(profile => {
            const profileHtml = `
                <div class="modal fade" id="profileModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">User Profile</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-12 mb-3">
                                        <h6>Name:</h6>
                                        <p>${profile.firstName} ${profile.lastName}</p>
                                    </div>
                                    <div class="col-12 mb-3">
                                        <h6>Email:</h6>
                                        <p>${profile.email}</p>
                                    </div>
                                    <div class="col-12 mb-3">
                                        <h6>Member Since:</h6>
                                        <p>${formatDate(profile.createdAt)}</p>
                                    </div>
                                    ${profile.lastLoginAt ? `
                                    <div class="col-12 mb-3">
                                        <h6>Last Login:</h6>
                                        <p>${formatDate(profile.lastLoginAt)}</p>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Remove existing modal if any
            const existingModal = document.getElementById('profileModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Add new modal
            document.body.insertAdjacentHTML('beforeend', profileHtml);
            new bootstrap.Modal(document.getElementById('profileModal')).show();
        })
        .catch(error => {
            showError('Failed to load profile');
        });
    }
}

// URL management functions
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const originalUrl = document.getElementById('originalUrl').value;
    const expiresAt = document.getElementById('expiresAt').value;
    
    // Check if user is authenticated
    if (!authToken) {
        showError('Please login to create URLs');
        showLoginModal();
        return;
    }
    
    try {
        showLoading(true, 'urlForm');
        
        const requestData = {
            originalUrl: originalUrl.trim()
        };
        
        if (expiresAt) {
            requestData.expiresAt = expiresAt;
        }
        
        const response = await fetch(`${API_BASE}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to create short URL';
            try {
                const errorText = await response.text();
                if (errorText.trim()) {
                    const error = JSON.parse(errorText);
                    errorMessage = error.error || error.message || errorMessage;
                }
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                errorMessage = `Server error: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        const resultText = await response.text();
        console.log('Response text from server:', resultText);
        const result = JSON.parse(resultText);
        console.log('Parsed result:', result);
        displayResult(result);
        urlForm.reset();
        loadUrls(); // Refresh the URLs list
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false, 'urlForm');
    }
}

function displayResult(data) {
    console.log('=== displayResult called ===');
    console.log('Input data:', data);
    console.log('Current origin:', window.location.origin);
    console.log('Current port:', window.location.port);
    
    const shortUrl = `${window.location.origin}/r/${data.shortCode}`;
    console.log('Generated shortUrl:', shortUrl);
    
    console.log('Element availability check:');
    console.log('- shortUrlResult:', !!shortUrlResult, shortUrlResult);
    console.log('- originalUrlResult:', !!originalUrlResult, originalUrlResult);
    console.log('- resultSection:', !!resultSection, resultSection);
    
    if (shortUrlResult) {
        shortUrlResult.value = shortUrl;
        console.log('✓ Set shortUrlResult.value to:', shortUrl);
        console.log('✓ Current shortUrlResult.value:', shortUrlResult.value);
    } else {
        console.error('✗ shortUrlResult element not found');
    }
    
    if (originalUrlResult) {
        originalUrlResult.textContent = data.originalUrl;
        console.log('✓ Set originalUrlResult.textContent to:', data.originalUrl);
    } else {
        console.error('✗ originalUrlResult element not found');
    }
    
    if (resultSection) {
        resultSection.style.display = 'block';
        console.log('✓ Made resultSection visible');
        console.log('✓ ResultSection display style:', resultSection.style.display);
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        console.error('✗ resultSection element not found');
    }
    
    console.log('=== displayResult completed ===');
}

async function loadUrls() {
    try {
        let url = `${API_BASE}/all`;
        let headers = {};
        
        // If authenticated, include authorization header
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        console.log('Making request to:', url);
        console.log('Headers:', headers);
        
        const response = await fetch(url, { headers });
        
        console.log('Response received:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            if (response.status === 401) {
                // Token expired or invalid
                logout();
                return;
            }
            throw new Error(`Failed to load URLs: ${response.status} - ${errorText}`);
        }
        
        const urls = await response.json();
        displayUrls(urls);
        
    } catch (error) {
        console.error('Detailed error in loadUrls:', error);
        if (urlsList) {
            urlsList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>Failed to load URLs</p>
                    <small class="text-danger">${error.message}</small>
                </div>
            `;
        }
    }
}

function displayUrls(urls) {
    if (!urlsList) return;
    
    if (urls.length === 0) {
        urlsList.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-link fa-2x mb-3"></i>
                <p>${authToken ? 'You haven\'t created any URLs yet' : 'No URLs available'}</p>
                ${!authToken ? '<p class="small">Login to create and manage your URLs</p>' : ''}
            </div>
        `;
        return;
    }
    
    const urlsHtml = urls.map(url => {
        const shortUrl = `${window.location.origin}/r/${url.shortCode}`;
        const isExpired = url.expiresAt && new Date(url.expiresAt) < new Date();
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 ${isExpired ? 'border-danger' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-truncate">
                                <a href="${shortUrl}" target="_blank" class="text-decoration-none">
                                    ${url.shortCode}
                                </a>
                            </h6>
                            ${authToken ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteUrl('${url.shortCode}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </a></li>
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                        
                        <p class="card-text small text-muted mb-2">
                            ${truncateUrl(url.originalUrl, 50)}
                        </p>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-mouse-pointer"></i> ${url.clickCount} clicks
                            </small>
                            <button class="btn btn-sm btn-outline-primary" onclick="copyToClipboard('${shortUrl}')">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                        
                        ${isExpired ? 
                            '<div class="mt-2"><span class="badge bg-danger">Expired</span></div>' : 
                            url.expiresAt ? 
                                `<div class="mt-2"><small class="text-muted">Expires: ${formatDate(url.expiresAt)}</small></div>` : 
                                ''
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    urlsList.innerHTML = urlsHtml;
}

async function deleteUrl(shortCode) {
    if (!confirm('Are you sure you want to delete this URL?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/${shortCode}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete URL');
        }
        
        showSuccess('URL deleted successfully');
        loadUrls();
        
    } catch (error) {
        showError(error.message);
    }
}

// Utility functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showSuccess('Copied to clipboard!');
        } catch (err) {
            showError('Failed to copy to clipboard');
        }
        document.body.removeChild(textArea);
    });
}

function showLoading(show, formId = null) {
    const form = formId ? document.getElementById(formId) : urlForm;
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    if (show) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            Processing...
        `;
    } else {
        submitBtn.disabled = false;
        if (formId === 'loginForm') {
            submitBtn.innerHTML = 'Login';
        } else if (formId === 'registerForm') {
            submitBtn.innerHTML = 'Register';
        } else {
            submitBtn.innerHTML = 'Shorten URL';
        }
    }
}

function showError(message) {
    showToast(message, 'danger');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0 position-fixed" 
             style="top: 20px; right: 20px; z-index: 1050;" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.querySelector('.toast:last-child');
    if (toastElement && window.bootstrap) {
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Debug function - can be called from browser console
function testDisplayResult() {
    console.log('Testing displayResult function...');
    const testData = {
        shortCode: 'abc123',
        originalUrl: 'https://www.google.com'
    };
    displayResult(testData);
}

// Make it globally available for testing
window.testDisplayResult = testDisplayResult;

function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}

// Global functions for onclick handlers
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showProfile = showProfile;
window.logout = logout;
window.copyToClipboard = copyToClipboard;
window.deleteUrl = deleteUrl;
