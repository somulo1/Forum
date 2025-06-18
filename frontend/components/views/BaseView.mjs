/**
 * Base View Class - Common functionality for all views
 */

export class BaseView {
    constructor(app, params = {}, query = {}) {
        this.app = app;
        this.params = params;
        this.query = query;
    }

    /**
     * Render the view - to be implemented by subclasses
     * @param {HTMLElement} container - Container element to render into
     */
    async render(container) {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Cleanup when view is destroyed
     */
    destroy() {
        // Override in subclasses if cleanup is needed
    }

    /**
     * Get the authenticated user
     * @returns {Object|null} - Current user or null
     */
    getCurrentUser() {
        return this.app.getAuthManager().getCurrentUser();
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    async isAuthenticated() {
        return await this.app.getAuthManager().checkAuthStatus();
    }

    /**
     * Show authentication modal
     */
    showAuthModal() {
        this.app.authModal.showLoginModal();
    }

    /**
     * Create a loading element
     * @returns {HTMLElement} - Loading element
     */
    createLoadingElement() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        `;
        return loading;
    }

    /**
     * Create an error element
     * @param {string} message - Error message
     * @param {Function} retryCallback - Optional retry callback
     * @returns {HTMLElement} - Error element
     */
    createErrorElement(message, retryCallback = null) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                ${retryCallback ? '<button class="retry-btn">Try Again</button>' : ''}
            </div>
        `;

        if (retryCallback) {
            const retryBtn = error.querySelector('.retry-btn');
            retryBtn.addEventListener('click', retryCallback);
        }

        return error;
    }

    /**
     * Create an empty state element
     * @param {string} message - Empty state message
     * @param {string} icon - Font Awesome icon class
     * @returns {HTMLElement} - Empty state element
     */
    createEmptyStateElement(message, icon = 'fas fa-inbox') {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = `
            <div class="empty-content">
                <i class="${icon}"></i>
                <h3>Nothing Here</h3>
                <p>${message}</p>
            </div>
        `;
        return empty;
    }
}
