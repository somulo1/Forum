import { API_BASE_URL } from '../config.mjs';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.navAuth = document.getElementById('navAuth');
        this.authModal = document.getElementById('authModal');
        this.authForms = document.getElementById('authForms');
    }

    async init() {
        await this.checkAuth();
        this.renderAuthButtons();
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.setUserCookie(this.currentUser);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            this.logout();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) throw new Error('Login failed');

            const data = await response.json();
            this.currentUser = data.user;
            localStorage.setItem('token', data.token);
            this.setUserCookie(data.user);
            this.authModal.classList.add('hidden'); // Hide the modal after successful login
            this.renderAuthButtons();
            window.location.reload();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            avatar: document.getElementById('avatar').value || '/assets/default-avatar.png'
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (!response.ok) throw new Error('Registration failed');

            const data = await response.json();
            this.currentUser = data.user;
            localStorage.setItem('token', data.token);
            this.setUserCookie(data.user);
            this.authModal.classList.add('hidden'); // Hide the modal after successful registration
            this.renderAuthButtons();
            window.location.reload();
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('token');
        document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        this.renderAuthButtons();
        window.location.reload();
    }

    setUserCookie(userData) {
        const expires = new Date(Date.now() + 86400000).toUTCString();
        document.cookie = `user=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires}; path=/`;
    }

    renderAuthButtons() {
        if (this.currentUser) {
            this.navAuth.innerHTML = `
                <span>Welcome, ${this.currentUser.username}</span>
                <button id="logoutBtn">Logout</button>
            `;
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        } else {
            this.navAuth.innerHTML = `
                <button id="loginBtn">Login</button>
                <button id="registerBtn">Register</button>
            `;
            document.getElementById('loginBtn').addEventListener('click', () => this.showLoginForm());
            document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterForm());
        }
    }

    showLoginForm() {
        this.authModal.classList.remove('hidden');
        this.authForms.innerHTML = `
            <form id="loginForm">
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        `;
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    }

    showRegisterForm() {
        this.authModal.classList.remove('hidden');
        this.authForms.innerHTML = `
            <form id="registerForm">
                <input type="text" id="username" placeholder="Username" required>
                <input type="email" id="email" placeholder="Email" required>
                <input type="password" id="password" placeholder="Password" required>
                <input type="url" id="avatar" placeholder="Avatar URL (optional)">
                <button type="submit">Register</button>
            </form>
        `;
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
    }
}