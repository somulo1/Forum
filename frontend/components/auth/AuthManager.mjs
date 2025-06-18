/**
 * Authentication Manager - Handles user authentication state and operations
 */

import { ApiUtils } from '../utils/ApiUtils.mjs';

export class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    /**
     * Check if user is currently authenticated
     * @returns {Promise<boolean>} - Authentication status
     */
    async checkAuthStatus() {
        try {
            const user = await ApiUtils.get('/api/user', true);
            this.currentUser = user;
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            this.currentUser = null;
            this.isAuthenticated = false;
            return false;
        }
    }

    /**
     * Login user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Login result
     */
    async login(email, password) {
        try {
            const result = await ApiUtils.post('/api/login', { email, password }, true);
            
            // Fetch user data after successful login
            const user = await ApiUtils.get('/api/user', true);
            this.currentUser = user;
            this.isAuthenticated = true;
            
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Register new user
     * @param {FormData} formData - Registration form data
     * @returns {Promise<Object>} - Registration result
     */
    async register(formData) {
        try {
            await ApiUtils.post('/api/register', formData, true, true);
            
            // Auto-login after registration
            const email = formData.get('email');
            const password = formData.get('password');
            
            const loginResult = await this.login(email, password);
            return loginResult;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout current user
     * @returns {Promise<boolean>} - Logout success status
     */
    async logout() {
        try {
            await ApiUtils.post('/api/logout', {}, true);
            this.currentUser = null;
            this.isAuthenticated = false;
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    /**
     * Get current user data
     * @returns {Object|null} - Current user or null
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    getIsAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * Validate registration form data
     * @param {Object} formData - Form data to validate
     * @returns {Object} - Validation result
     */
    validateRegistrationData(formData) {
        const { username, email, password, confirmPassword } = formData;
        
        // Regex patterns
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{6,}$/;

        if (!username || !email || !password || !confirmPassword) {
            return { valid: false, error: 'All fields are required.' };
        }

        if (!usernameRegex.test(username)) {
            return { valid: false, error: 'Username must be 3–20 characters, no spaces or special characters.' };
        }

        if (!emailRegex.test(email)) {
            return { valid: false, error: 'Invalid email format.' };
        }

        if (!passwordRegex.test(password)) {
            return { valid: false, error: 'Password must be at least 6 characters and safe.' };
        }

        if (password !== confirmPassword) {
            return { valid: false, error: 'Passwords do not match!' };
        }

        return { valid: true };
    }

    /**
     * Validate avatar file
     * @param {File} file - Avatar file
     * @returns {Object} - Validation result
     */
    validateAvatarFile(file) {
        if (!file) return { valid: true };

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Avatar must be JPG, PNG, or GIF format.' };
        }

        if (file.size > 5 * 1024 * 1024) {
            return { valid: false, error: 'Avatar size must be under 5MB.' };
        }

        return { valid: true };
    }
}
