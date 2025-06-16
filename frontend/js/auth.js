// Authentication module for the forum application

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAvatarUpload();
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

    setupAvatarUpload() {
        const avatarInput = document.getElementById('registerAvatar');
        const avatarPreview = document.getElementById('avatarPreview');
        const removeAvatarBtn = document.getElementById('removeAvatarBtn');

        if (avatarInput && avatarPreview) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleAvatarSelection(file, avatarPreview, removeAvatarBtn);
                }
            });
        }

        if (removeAvatarBtn) {
            removeAvatarBtn.addEventListener('click', () => {
                this.removeAvatar(avatarInput, avatarPreview, removeAvatarBtn);
            });
        }
    }

    handleAvatarSelection(file, previewElement, removeBtn) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPG, PNG, or GIF)');
            return;
        }

        // Validate file size (2MB max)
        const maxSize = 2 * 1024 * 1024; // 2MB in bytes
        if (file.size > maxSize) {
            toast.error('Image size must be less than 2MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Avatar preview">`;
            if (removeBtn) {
                removeBtn.style.display = 'inline-flex';
            }
        };
        reader.readAsDataURL(file);
    }

    removeAvatar(inputElement, previewElement, removeBtn) {
        if (inputElement) inputElement.value = '';
        if (previewElement) {
            previewElement.innerHTML = `
                <i class="fas fa-user"></i>
                <span class="avatar-text">No image selected</span>
            `;
        }
        if (removeBtn) removeBtn.style.display = 'none';
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
        const avatarFile = document.getElementById('registerAvatar').files[0];

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
            // Step 1: Register user (backend only accepts username, email, password)
            const registrationData = { username, email, password };

            console.log('Registering user:', { username, email });
            const response = await apiWrapper.register(registrationData);

            if (response) {
                // Step 2: If avatar is selected, login and upload avatar
                if (avatarFile) {
                    console.log('Avatar file selected, will upload after auto-login:', avatarFile.name);

                    // Auto-login the user
                    const loginResponse = await apiWrapper.login({ email, password });
                    if (loginResponse) {
                        // Get user info after login
                        const user = await apiWrapper.getCurrentUser();
                        if (user) {
                            this.setAuthenticatedState(user);

                            // Upload avatar using existing backend implementation
                            console.log('Uploading avatar using existing backend handler...');
                            const avatarUploadResult = await this.uploadAvatarFile(avatarFile);
                            if (avatarUploadResult) {
                                toast.success('Registration successful! Avatar uploaded.');
                                // Refresh user data to get updated avatar_url
                                const updatedUser = await apiWrapper.getCurrentUser();
                                if (updatedUser) {
                                    this.setAuthenticatedState(updatedUser);
                                }
                            } else {
                                toast.warning('Registration successful! Avatar upload route not available yet. You can add an avatar later.');
                                console.log('Avatar upload failed - backend route needs to be added to routes.go');
                            }
                        }
                    }
                } else {
                    toast.success('Registration successful! Please log in.');
                    // Show login modal after successful registration
                    setTimeout(() => {
                        this.showLoginModal();
                    }, 1000);
                }

                modal.close();
                this.clearRegisterForm();
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async uploadAvatarFile(file) {
        try {
            // Create FormData for file upload (backend expects multipart/form-data)
            const formData = new FormData();
            formData.append('avatar', file);

            console.log('Uploading avatar file:', file.name, file.type, file.size);
            console.log('Note: Avatar upload requires the route to be added to backend routes.go');
            console.log('Required route: mux.Handle("/api/user/avatar", middleware.CORS(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.UploadAvatar))))');

            // Use the expected endpoint pattern based on existing backend implementation
            const response = await fetch('http://localhost:8081/api/user/avatar', {
                method: 'POST',
                body: formData,
                credentials: 'include' // Include cookies for authentication
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Avatar upload successful:', result);

                // Update current user with new avatar URL
                if (result.avatar_url && this.currentUser) {
                    this.currentUser.avatar_url = result.avatar_url;
                    utils.setLocalStorage('currentUser', this.currentUser);
                }

                return true;
            } else {
                console.error('Avatar upload failed:', response.status, response.statusText);
                if (response.status === 404) {
                    console.error('Avatar upload route not found. Please add the route to backend routes.go');
                }
                return false;
            }

        } catch (error) {
            console.error('Avatar upload error:', error);
            if (error.message.includes('ERR_CONNECTION_RESET')) {
                console.error('Connection reset - avatar upload route is not registered in backend');
            }
            return false;
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

        // Trigger navigation update
        if (window.navigation && window.navigation.updateAuthenticatedNavigation) {
            window.navigation.updateAuthenticatedNavigation();
        }

        // Dispatch auth state change event
        document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true, user } }));
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

        // Trigger navigation update
        if (window.navigation && window.navigation.updateAuthenticatedNavigation) {
            window.navigation.updateAuthenticatedNavigation();
        }

        // Dispatch auth state change event
        document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: false, user: null } }));
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

        // Clear avatar preview
        const avatarInput = document.getElementById('registerAvatar');
        const avatarPreview = document.getElementById('avatarPreview');
        const removeAvatarBtn = document.getElementById('removeAvatarBtn');

        this.removeAvatar(avatarInput, avatarPreview, removeAvatarBtn);
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
