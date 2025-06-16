// Utility Functions

// DOM Helper Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Show/Hide Elements
const show = (element) => {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.remove('hidden');
};

const hide = (element) => {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.add('hidden');
};

const toggle = (element) => {
    if (typeof element === 'string') element = $(element);
    if (element) element.classList.toggle('hidden');
};

// Loading Spinner
const showLoading = () => show('#loading-spinner');
const hideLoading = () => hide('#loading-spinner');

// Message Display
const showMessage = (message, type = 'success') => {
    const messageEl = $(`#${type}-message`);
    const textEl = $(`#${type}-text`);
    
    if (messageEl && textEl) {
        textEl.textContent = message;
        show(messageEl);
        
        // Auto-hide after 5 seconds
        setTimeout(() => hide(messageEl), 5000);
    }
};

const showError = (message) => showMessage(message, 'error');
const showSuccess = (message) => showMessage(message, 'success');

// Close message handlers
const initMessageHandlers = () => {
    $('#close-error')?.addEventListener('click', () => hide('#error-message'));
    $('#close-success')?.addEventListener('click', () => hide('#success-message'));
};

// Date Formatting
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Text Truncation
const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// HTML Escaping
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// URL Helpers
const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    return `/${imagePath}`;
};

const getAvatarUrl = (avatarPath) => {
    if (!avatarPath || avatarPath === '') {
        return '/static/profiles/default.png';
    }
    return getImageUrl(avatarPath);
};

// Form Helpers
const getFormData = (formElement) => {
    const formData = new FormData(formElement);
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
};

const clearForm = (formElement) => {
    if (typeof formElement === 'string') formElement = $(formElement);
    if (formElement) formElement.reset();
};

// Validation Helpers
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    return password.length >= 6;
};

const validateUsername = (username) => {
    return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

// Modal Helpers
const openModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
        show(modal);
        document.body.style.overflow = 'hidden';
    }
};

const closeModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
        hide(modal);
        document.body.style.overflow = 'auto';
    }
};

const initModalHandlers = () => {
    // Close modal when clicking outside or on close button
    $$('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(`#${modal.id}`);
            }
        });
        
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeModal(`#${modal.id}`);
            });
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            $$('.modal:not(.hidden)').forEach(modal => {
                closeModal(`#${modal.id}`);
            });
        }
    });
};

// Local Storage Helpers
const setLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
};

const getLocalStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
};

const removeLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing from localStorage:', error);
    }
};

// Debounce Function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle Function
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Array Helpers
const unique = (array) => [...new Set(array)];

const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

// Initialize utility functions
document.addEventListener('DOMContentLoaded', () => {
    initMessageHandlers();
    initModalHandlers();
});

// Export for use in other modules
window.Utils = {
    $, $$, show, hide, toggle,
    showLoading, hideLoading,
    showMessage, showError, showSuccess,
    formatDate, formatDateTime,
    truncateText, escapeHtml,
    getImageUrl, getAvatarUrl,
    getFormData, clearForm,
    validateEmail, validatePassword, validateUsername,
    openModal, closeModal,
    setLocalStorage, getLocalStorage, removeLocalStorage,
    debounce, throttle,
    unique, groupBy
};
