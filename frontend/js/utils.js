// Utility Functions
class Utils {
    // DOM Helpers
    static $(selector) {
        return document.querySelector(selector);
    }

    static $$(selector) {
        return document.querySelectorAll(selector);
    }

    static createElement(tag, className = '', content = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) element.innerHTML = content;
        return element;
    }

    // Show/Hide Elements
    static show(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) element.style.display = 'block';
    }

    static hide(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) element.style.display = 'none';
    }

    static toggle(selector) {
        const element = typeof selector === 'string' ? this.$(selector) : selector;
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }

    // Loading States
    static showLoading() {
        this.show('#loading');
    }

    static hideLoading() {
        this.hide('#loading');
    }

    // Notifications
    static showNotification(message, type = 'info') {
        const notification = this.$('#notification');
        const messageEl = this.$('#notification-message');
        
        if (notification && messageEl) {
            messageEl.textContent = message;
            notification.className = `notification ${type}`;
            this.show(notification);
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                this.hide(notification);
            }, 5000);
        }
    }

    static showSuccess(message) {
        this.showNotification(message, 'success');
    }

    static showError(message) {
        this.showNotification(message, 'error');
    }

    static showWarning(message) {
        this.showNotification(message, 'warning');
    }

    // Modal Helpers
    static openModal(selector) {
        const modal = this.$(selector);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(selector) {
        const modal = this.$(selector);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Form Helpers
    static getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (like checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }

    static clearForm(form) {
        if (typeof form === 'string') {
            form = this.$(form);
        }
        if (form) {
            form.reset();
        }
    }

    // String Helpers
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Date Helpers
    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Array Helpers
    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // Local Storage Helpers
    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    // Validation Helpers
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        // At least 6 characters
        return password.length >= 6;
    }

    // Debounce Helper
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // URL Helpers
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    static setQueryParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }
}

// API Helper Functions
class ApiHelpers {
    static handleError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            Utils.showError('Please log in to continue');
            if (window.Auth) {
                window.Auth.showLoginForm();
            }
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            Utils.showError('You do not have permission to perform this action');
        } else if (error.message.includes('404')) {
            Utils.showError('The requested resource was not found');
        } else if (error.message.includes('500')) {
            Utils.showError('Server error. Please try again later');
        } else {
            Utils.showError(error.message || 'An unexpected error occurred');
        }
    }

    static getPaginationParams(page = 1, limit = 10) {
        return { page, limit };
    }

    static formatPost(post) {
        return {
            ...post,
            formattedDate: Utils.formatDate(post.created_at),
            truncatedContent: Utils.truncateText(post.content, 200)
        };
    }
}

// Authentication Helper Functions
class AuthHelpers {
    static isLoggedIn() {
        return window.currentUser !== null && window.currentUser !== undefined;
    }

    static getCurrentUser() {
        return window.currentUser;
    }

    static isOwner(userId) {
        return this.isLoggedIn() && this.getCurrentUser().id === userId;
    }

    static requireAuth() {
        if (!this.isLoggedIn()) {
            Utils.showError('Please log in to continue');
            if (window.Auth) {
                window.Auth.showLoginForm();
            }
            return false;
        }
        return true;
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
