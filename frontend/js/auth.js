// Authentication Management

class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.updateUI();
    }

    // Check if user is currently authenticated
    async checkAuthStatus() {
        try {
            const user = await api.getCurrentUser();
            this.currentUser = user;
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            // 401 errors are expected when not logged in - don't log them
            if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                console.error('Auth check error:', error);
            }
            this.currentUser = null;
            this.isAuthenticated = false;
            return false;
        }
    }

    // Setup event listeners for auth forms
    setupEventListeners() {
        // Auth tab switching
        Utils.$('#login-tab')?.addEventListener('click', () => this.showLoginForm());
        Utils.$('#register-tab')?.addEventListener('click', () => this.showRegisterForm());

        // Form submissions
        Utils.$('#login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        Utils.$('#register-form')?.addEventListener('submit', (e) => this.handleRegister(e));

        // Navigation auth buttons
        this.setupNavButtons();
    }

    // Setup navigation authentication buttons
    setupNavButtons() {
        const authSection = Utils.$('#auth-section');
        if (!authSection) return;

        if (this.isAuthenticated) {
            authSection.innerHTML = `
                <li><button id="logout-btn" class="nav-link">Logout</button></li>
            `;
            Utils.$('#logout-btn')?.addEventListener('click', () => this.handleLogout());
        } else {
            authSection.innerHTML = `
                <li><button id="login-btn" class="nav-link">Login</button></li>
                <li><button id="register-btn" class="nav-link">Register</button></li>
            `;
            Utils.$('#login-btn')?.addEventListener('click', () => this.showAuthModal('login'));
            Utils.$('#register-btn')?.addEventListener('click', () => this.showAuthModal('register'));
        }
    }

    // Show authentication modal
    showAuthModal(type = 'login') {
        Utils.openModal('#auth-modal');
        if (type === 'login') {
            this.showLoginForm();
        } else {
            this.showRegisterForm();
        }
    }

    // Switch to login form
    showLoginForm() {
        Utils.$('#login-tab')?.classList.add('active');
        Utils.$('#register-tab')?.classList.remove('active');
        Utils.show('#login-form');
        Utils.hide('#register-form');
    }

    // Switch to register form
    showRegisterForm() {
        Utils.$('#register-tab')?.classList.add('active');
        Utils.$('#login-tab')?.classList.remove('active');
        Utils.show('#register-form');
        Utils.hide('#login-form');
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = Utils.getFormData(form);

        // Validate form data
        if (!Utils.validateEmail(formData.email)) {
            Utils.showError('Please enter a valid email address');
            return;
        }

        if (!formData.password) {
            Utils.showError('Please enter your password');
            return;
        }

        try {
            Utils.showLoading();
            
            await api.login({
                email: formData.email,
                password: formData.password
            });

            // Update auth status
            await this.checkAuthStatus();
            this.updateUI();

            Utils.showSuccess('Successfully logged in!');
            Utils.closeModal('#auth-modal');
            Utils.clearForm(form);

            // Refresh the page content
            if (window.App && window.App.refresh) {
                window.App.refresh();
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Handle register form submission
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = Utils.getFormData(form);

        // Validate form data
        if (!Utils.validateUsername(formData.username)) {
            Utils.showError('Username must be at least 3 characters and contain only letters, numbers, and underscores');
            return;
        }

        if (!Utils.validateEmail(formData.email)) {
            Utils.showError('Please enter a valid email address');
            return;
        }

        if (!Utils.validatePassword(formData.password)) {
            Utils.showError('Password must be at least 6 characters long');
            return;
        }

        // Validate avatar file if provided
        const avatarFile = form.querySelector('#register-avatar').files[0];
        if (avatarFile) {
            const validation = ApiHelpers.validateFile(avatarFile);
            if (!validation.valid) {
                Utils.showError(validation.error);
                return;
            }
        }

        try {
            Utils.showLoading();
            
            await api.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                avatar: avatarFile
            });

            Utils.showSuccess('Registration successful! Please log in.');
            Utils.clearForm(form);
            this.showLoginForm();

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            await api.logout();
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
            Utils.showSuccess('Successfully logged out');

            // Refresh the page content
            if (window.App && window.App.refresh) {
                window.App.refresh();
            }

        } catch (error) {
            // Even if logout fails on server, clear local state
            this.currentUser = null;
            this.isAuthenticated = false;
            this.updateUI();
            console.error('Logout error:', error);
        }
    }

    // Update UI based on authentication status
    updateUI() {
        this.setupNavButtons();
        this.updateUserInfo();
        this.updateAuthRequiredElements();
    }

    // Update user info in sidebar
    updateUserInfo() {
        const userInfoSection = Utils.$('#user-info');
        const userFilters = Utils.$('#user-filters');
        const createPostBtn = Utils.$('#create-post-btn');

        if (this.isAuthenticated && this.currentUser) {
            // Show user info
            if (userInfoSection) {
                Utils.show(userInfoSection);
                Utils.$('#user-avatar').src = Utils.getAvatarUrl(this.currentUser.avatar_url);
                Utils.$('#user-username').textContent = this.currentUser.username;
                Utils.$('#user-email').textContent = this.currentUser.email;
            }

            // Show user-specific filters
            Utils.show(userFilters);

            // Show create post button
            Utils.show(createPostBtn);

        } else {
            // Hide user-specific elements
            Utils.hide(userInfoSection);
            Utils.hide(userFilters);
            Utils.hide(createPostBtn);
        }
    }

    // Update elements that require authentication
    updateAuthRequiredElements() {
        const authRequiredElements = Utils.$$('[data-auth-required]');
        
        authRequiredElements.forEach(element => {
            if (this.isAuthenticated) {
                Utils.show(element);
            } else {
                Utils.hide(element);
            }
        });
    }

    // Get current user info
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isLoggedIn() {
        return this.isAuthenticated;
    }

    // Check if current user owns a resource
    isOwner(userId) {
        return this.isAuthenticated && this.currentUser && this.currentUser.id === userId;
    }

    // Require authentication for an action
    requireAuth(action) {
        if (!this.isAuthenticated) {
            Utils.showError('Please log in to perform this action');
            this.showAuthModal('login');
            return false;
        }
        return true;
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Auth = new Auth();
});

// Export for use in other modules
window.AuthHelpers = {
    requireAuth: (action) => {
        if (window.Auth) {
            return window.Auth.requireAuth(action);
        }
        return false;
    },
    
    isLoggedIn: () => {
        return window.Auth ? window.Auth.isLoggedIn() : false;
    },
    
    getCurrentUser: () => {
        return window.Auth ? window.Auth.getCurrentUser() : null;
    },
    
    isOwner: (userId) => {
        return window.Auth ? window.Auth.isOwner(userId) : false;
    }
};
