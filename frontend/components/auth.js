export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.navAuth = document.getElementById('navAuth');
        this.authModal = document.getElementById('authModal');
        this.authForms = document.getElementById('authForms');
    }

    init() {
        this.checkAuth();
        this.renderAuthButtons();
    }

    checkAuth() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        
        if (userCookie) {
            this.currentUser = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
        }
    }

    renderAuthButtons() {
        if (this.currentUser) {
            this.navAuth.innerHTML = `
                <div class="user-menu">
                    <img src="${this.currentUser.avatar || 'https://via.placeholder.com/32'}" 
                         alt="${this.currentUser.username}" 
                         class="user-avatar">
                    <span>${this.currentUser.username}</span>
                    <button class="btn btn-secondary" id="logoutBtn">Logout</button>
                </div>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        } else {
            this.navAuth.innerHTML = `
                <button class="btn btn-primary" id="loginBtn">Login</button>
                <button class="btn btn-secondary" id="registerBtn">Register</button>
            `;
            this.setupAuthButtonListeners();
        }
    }

    setupAuthButtonListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterForm());
    }

    showLoginForm() {
        this.authForms.innerHTML = `
            <h2>Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
        `;
        
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        this.authModal.classList.remove('hidden');
    }

    showRegisterForm() {
        this.authForms.innerHTML = `
            <h2>Register</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" required>
                </div>
                <div class="form-group">
                    <label for="avatar">Profile Picture URL</label>
                    <input type="url" id="avatar" placeholder="https://example.com/avatar.jpg">
                </div>
                <button type="submit" class="btn btn-primary">Register</button>
            </form>
        `;
        
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        this.authModal.classList.remove('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Simulate login
        this.currentUser = {
            email,
            username: email.split('@')[0],
            avatar: 'https://via.placeholder.com/32',
            bio: 'Welcome to my profile!'
        };
        this.setUserCookie();
        this.authModal.classList.add('hidden');
        this.renderAuthButtons();
        window.location.reload();
    }

    async handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const avatar = document.getElementById('avatar').value || 'https://via.placeholder.com/32';

        // Simulate registration
        this.currentUser = {
            email,
            username,
            avatar,
            bio: 'Welcome to my profile!'
        };
        this.setUserCookie();
        this.authModal.classList.add('hidden');
        this.renderAuthButtons();
        window.location.reload();
    }

    setUserCookie() {
        const expires = new Date(Date.now() + 86400000).toUTCString();
        document.cookie = `user=${encodeURIComponent(JSON.stringify(this.currentUser))}; expires=${expires}; path=/`;
    }

    logout() {
        this.currentUser = null;
        document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.renderAuthButtons();
        window.location.reload();
    }
}