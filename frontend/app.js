// Define base URL for API calls
const API_BASE = "http://localhost:8080/api";

// Centralized error handler for API requests
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            credentials: 'include' // Always include credentials
        });
        
        // Handle session expiry
        if (response.status === 401) {
            alert("Session expired. Please log in again.");
            document.getElementById('authModal').classList.remove('hidden');
            return null;
        }
        
        // For non-JSON responses (like file uploads)
        if (options.parseJson === false) {
            return { success: response.ok, response };
        }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Something went wrong');
        return data;
    } catch (err) {
        console.error('API request error:', err);
        throw err;
    }
}

// Examples of API calls using the new helper
async function fetchForumPosts() {
    try {
        const posts = await apiRequest('/posts');
        // Process posts...
    } catch (error) {
        console.error('Failed to fetch posts:', error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Get auth buttons in navigation
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('[data-action="login"]');
    const registerBtn = document.getElementById('registerBtn') || document.querySelector('[data-action="register"]');
    
    // Simplified function to toggle auth modal
    function toggleAuthModal(show) {
        const authModal = document.getElementById('authModal');
        const mainContainer = document.querySelector('.main-container');
        
        if (show) {
            // Make sure the form is visible
            document.querySelector('.form.sign-in').style.display = 'block';
            
            // Show the modal
            authModal.classList.remove('hidden');
            mainContainer.classList.add('blur');
            
            // Log to console for debugging
            console.log('Opening auth modal');
        } else {
            authModal.classList.add('hidden');
            mainContainer.classList.remove('blur');
        }
    }
    
    // Event listeners for login/register buttons
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Login button clicked');
            toggleAuthModal(true);
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            console.log('Register button clicked');
            toggleAuthModal(true);
            // Switch to signup form if needed
            document.querySelector('.cont').classList.add('s-signup');
        });
    }
    
    // Close modal when close button is clicked
    const closeBtn = document.querySelector('.auth-modal .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            toggleAuthModal(false);
        });
    }
    
    // Add keyboard accessibility - close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !document.getElementById('authModal').classList.contains('hidden')) {
            toggleAuthModal(false);
        }
    });
    
    // Add mobile toggle for switching between login and signup
    const mobileToggleHTML = `
        <div class="mobile-toggle">
            <button id="toggleAuthForm">Don't have an account? Sign up</button>
        </div>
    `;
    
    // Add mobile toggle to forms
    const signInForm = document.querySelector('.form.sign-in');
    const signUpForm = document.querySelector('.form.sign-up');
    
    if (signInForm && !signInForm.querySelector('.mobile-toggle')) {
        signInForm.insertAdjacentHTML('beforeend', mobileToggleHTML);
        document.getElementById('toggleAuthForm').addEventListener('click', function() {
            document.querySelector('.cont').classList.add('s-signup');
            this.textContent = "Already have an account? Sign in";
        });
    }
    
    if (signUpForm && !signUpForm.querySelector('.mobile-toggle')) {
        signUpForm.insertAdjacentHTML('beforeend', mobileToggleHTML.replace("Don't have an account? Sign up", "Already have an account? Sign in"));
        document.getElementById('toggleAuthForm').addEventListener('click', function() {
            document.querySelector('.cont').classList.remove('s-signup');
            this.textContent = "Don't have an account? Sign up";
        });
    }
    
    // Toggle between sign-in and sign-up forms
    if (imgBtn) {
        imgBtn.addEventListener('click', function() {
            document.querySelector('.cont').classList.toggle('s-signup');
        });
    }
    
    // Handle sign-in submission
    if (signInBtn) {
        signInBtn.addEventListener('click', async function() {
            const email = document.querySelector('.sign-in input[name="email"]').value;
            const password = document.querySelector('.sign-in input[name="password"]').value;
            
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                // Show loading state
                signInBtn.disabled = true;
                signInBtn.textContent = "Signing in...";
                
                const data = await apiRequest('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                if (data) {
                    authModal.classList.add('hidden');
                    alert('Logged in successfully!');
                    location.reload();
                }
            } catch (error) {
                alert(error.message || 'Login failed');
            } finally {
                // Reset button state
                signInBtn.disabled = false;
                signInBtn.textContent = "Sign In";
            }
        });
    }
    
    // Handle sign-up submission
    if (signUpBtn) {
        signUpBtn.addEventListener('click', async function() {
            const username = document.querySelector('.sign-up input[name="username"]').value;
            const email = document.querySelector('.sign-up input[name="email"]').value;
            const password = document.querySelector('.sign-up input[name="password"]').value;
            const confirmPassword = document.querySelector('.sign-up input[name="confirmPassword"]').value;
            const avatarInput = document.querySelector('.sign-up input[name="avatar"]');
            
            if (!username || !email || !password || !confirmPassword) {
                alert('Please fill in all required fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            const formData = new FormData();
            formData.append('username', username);
            formData.append('email', email);
            formData.append('password', password);
            
            if (avatarInput.files[0]) {
                formData.append('avatar', avatarInput.files[0]);
            }
            
            try {
                // Show loading state
                signUpBtn.disabled = true;
                signUpBtn.textContent = "Creating account...";
                
                const data = await apiRequest('/register', {
                    method: 'POST',
                    body: formData,
                    parseJson: false // Special case for FormData
                });
                
                if (data && data.success) {
                    authModal.classList.add('hidden');
                    alert('Registered successfully!');
                    location.reload();
                } else {
                    const errorData = await data.response.json();
                    throw new Error(errorData.error || 'Registration failed');
                }
            } catch (error) {
                alert(error.message);
            } finally {
                // Reset button state
                signUpBtn.disabled = false;
                signUpBtn.textContent = "Sign Up";
            }
        });
    }
    
    // Example of post creation using the improved API helper
    async function createPost(formData) {
        try {
            const data = await apiRequest('/posts/create', {
                method: "POST",
                body: formData,
                parseJson: false
            });
            
            if (data && data.success) {
                alert('Post created successfully!');
                // Refresh posts or redirect
            }
        } catch (error) {
            alert(`Failed to create post: ${error.message}`);
        }
    }
    
    // Example of likes/reactions using the improved API helper
    async function toggleLike(postID, type) {
        try {
            const data = await apiRequest('/likes/toggle', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ post_id: parseInt(postID), type })
            });
            
            // Update UI based on response
            return data;
        } catch (error) {
            console.error('Like error:', error.message);
            return null;
        }
    }
});
