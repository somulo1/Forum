// Authentication module for the forum application

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Modal switches
        const switchToRegister = document.getElementById('switchToRegister');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Auth buttons
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async checkAuthStatus() {
        try {
            const user = await apiWrapper.getCurrentUser();
            if (user) {
                this.setAuthenticatedState(user);
            } else {
                this.setUnauthenticatedState();
            }
        } catch (error) {
            this.setUnauthenticatedState();
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validation
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!utils.validateEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        try {
            const response = await apiWrapper.login({ email, password });
            
            if (response) {
                // Get user info after successful login
                const user = await apiWrapper.getCurrentUser();
                this.setAuthenticatedState(user);
                modal.close();
                this.clearLoginForm();
                
                // Refresh the page content
                if (window.app && window.app.loadPosts) {
                    window.app.loadPosts();
                }
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;

        // Validation
        if (!username || !email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (!utils.validateUsername(username)) {
            toast.error('Username must be at least 3 characters and contain only letters, numbers, and underscores');
            return;
        }

        if (!utils.validateEmail(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!utils.validatePassword(password)) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        try {
            const response = await apiWrapper.register({ username, email, password });
            
            if (response) {
                modal.close();
                this.clearRegisterForm();
                toast.success('Registration successful! Please log in.');
                
                // Show login modal after successful registration
                setTimeout(() => {
                    this.showLoginModal();
                }, 1000);
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async handleLogout() {
        try {
            await apiWrapper.logout();
            this.setUnauthenticatedState();
            
            // Refresh the page content
            if (window.app && window.app.loadPosts) {
                window.app.loadPosts();
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    setAuthenticatedState(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Update UI
        const userMenu = document.getElementById('userMenu');
        const authMenu = document.getElementById('authMenu');
        const usernameDisplay = document.getElementById('usernameDisplay');
        
        if (userMenu) userMenu.style.display = 'flex';
        if (authMenu) authMenu.style.display = 'none';
        if (usernameDisplay) usernameDisplay.textContent = user.username;

        // Show authenticated-only elements
        const myPostsFilter = document.getElementById('myPostsFilter');
        const likedPostsFilter = document.getElementById('likedPostsFilter');
        const createCategoryBtn = document.getElementById('createCategoryBtn');
        
        if (myPostsFilter) myPostsFilter.style.display = 'block';
        if (likedPostsFilter) likedPostsFilter.style.display = 'block';
        if (createCategoryBtn) createCategoryBtn.style.display = 'block';

        // Store user info in localStorage for persistence
        utils.setLocalStorage('currentUser', user);
    }

    setUnauthenticatedState() {
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Update UI
        const userMenu = document.getElementById('userMenu');
        const authMenu = document.getElementById('authMenu');
        
        if (userMenu) userMenu.style.display = 'none';
        if (authMenu) authMenu.style.display = 'flex';

        // Hide authenticated-only elements
        const myPostsFilter = document.getElementById('myPostsFilter');
        const likedPostsFilter = document.getElementById('likedPostsFilter');
        const createCategoryBtn = document.getElementById('createCategoryBtn');
        
        if (myPostsFilter) myPostsFilter.style.display = 'none';
        if (likedPostsFilter) likedPostsFilter.style.display = 'none';
        if (createCategoryBtn) createCategoryBtn.style.display = 'none';

        // Clear stored user info
        utils.removeLocalStorage('currentUser');
    }

    showLoginModal() {
        modal.open('loginModal');
        // Focus on email field
        setTimeout(() => {
            const emailField = document.getElementById('loginEmail');
            if (emailField) emailField.focus();
        }, 100);
    }

    showRegisterModal() {
        modal.open('registerModal');
        // Focus on username field
        setTimeout(() => {
            const usernameField = document.getElementById('registerUsername');
            if (usernameField) usernameField.focus();
        }, 100);
    }

    clearLoginForm() {
        const form = document.getElementById('loginForm');
        if (form) form.reset();
    }

    clearRegisterForm() {
        const form = document.getElementById('registerForm');
        if (form) form.reset();
    }

    handleUnauthorized() {
        this.setUnauthenticatedState();
        toast.warning('Your session has expired. Please log in again.');
        setTimeout(() => {
            this.showLoginModal();
        }, 1000);
    }

    // Utility methods for other modules
    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
        } else {
            toast.warning('Please log in to perform this action');
            this.showLoginModal();
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Create global auth instance
window.auth = new AuthManager();
