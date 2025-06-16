// Authentication Management
class Auth {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = Utils.$('#login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = Utils.$('#register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Auth buttons
        Utils.$('#login-btn')?.addEventListener('click', () => this.showLoginForm());
        Utils.$('#register-btn')?.addEventListener('click', () => this.showRegisterForm());
        Utils.$('#logout-btn')?.addEventListener('click', () => this.handleLogout());

        // Modal close buttons
        Utils.$$('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    Utils.closeModal(`#${modalId}`);
                }
            });
        });

        // Close modal when clicking outside
        Utils.$$('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.closeModal(modal);
                }
            });
        });
    }

    // Check current authentication status
    async checkAuthStatus() {
        try {
            const user = await api.getCurrentUser();
            this.currentUser = user;
            window.currentUser = user;
            this.updateUI();
        } catch (error) {
            // User not logged in
            this.currentUser = null;
            window.currentUser = null;
            this.updateUI();
        }
    }

    // Update UI based on authentication status
    updateUI() {
        const authButtons = Utils.$('#auth-buttons');
        const userMenu = Utils.$('#user-menu');
        const usernameDisplay = Utils.$('#username-display');
        const createPostBtn = Utils.$('#create-post-btn');
        const userFilters = Utils.$('#user-filters');

        if (this.currentUser) {
            // User is logged in
            Utils.hide(authButtons);
            Utils.show(userMenu);
            Utils.show(createPostBtn);
            Utils.show(userFilters);
            
            if (usernameDisplay) {
                usernameDisplay.textContent = this.currentUser.username;
            }
        } else {
            // User is not logged in
            Utils.show(authButtons);
            Utils.hide(userMenu);
            Utils.hide(createPostBtn);
            Utils.hide(userFilters);
        }
    }

    // Show login form
    showLoginForm() {
        Utils.closeModal('#register-modal');
        Utils.openModal('#login-modal');
    }

    // Show register form
    showRegisterForm() {
        Utils.closeModal('#login-modal');
        Utils.openModal('#register-modal');
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = Utils.getFormData(event.target);
        
        if (!Utils.validateEmail(formData.email)) {
            Utils.showError('Please enter a valid email address');
            return;
        }

        if (!Utils.validatePassword(formData.password)) {
            Utils.showError('Password must be at least 6 characters long');
            return;
        }

        try {
            Utils.showLoading();
            
            const response = await api.login({
                email: formData.email,
                password: formData.password
            });

            Utils.showSuccess('Login successful!');
            Utils.closeModal('#login-modal');
            Utils.clearForm(event.target);
            
            // Refresh auth status and reload content
            await this.checkAuthStatus();
            if (window.App) {
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
        
        const formData = Utils.getFormData(event.target);
        
        if (!formData.username || formData.username.length < 3) {
            Utils.showError('Username must be at least 3 characters long');
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

        try {
            Utils.showLoading();
            
            const userData = {
                username: formData.username,
                email: formData.email,
                password: formData.password
            };

            // Add avatar if provided
            const avatarFile = event.target.querySelector('input[name="avatar"]').files[0];
            if (avatarFile) {
                userData.avatar = avatarFile;
            }

            const response = await api.register(userData);

            Utils.showSuccess('Registration successful! Please log in.');
            Utils.closeModal('#register-modal');
            Utils.clearForm(event.target);
            
            // Show login form
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
            Utils.showLoading();
            
            await api.logout();
            
            this.currentUser = null;
            window.currentUser = null;
            
            Utils.showSuccess('Logged out successfully');
            this.updateUI();
            
            // Refresh content
            if (window.App) {
                window.App.refresh();
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Global functions for modal switching
function showLoginModal() {
    if (window.Auth) {
        window.Auth.showLoginForm();
    }
}

function showRegisterModal() {
    if (window.Auth) {
        window.Auth.showRegisterForm();
    }
}

function closeModal(modalId) {
    Utils.closeModal(`#${modalId}`);
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Auth = new Auth();
});
