// Main Application Controller
class App {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Forum Application...');
            await this.initialize();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Utils.showError('Failed to load application. Please refresh the page.');
        }
    }

    async initialize() {
        try {
            Utils.showLoading();

            // Initialize authentication first
            if (window.Auth) {
                await window.Auth.checkAuthStatus();
                window.Auth.updateUI();
            }

            // Initialize categories
            if (window.Categories) {
                await window.Categories.loadCategories();
                window.Categories.renderCategoryFilter();
            }

            // Setup navigation
            this.setupNavigation();

            // Load initial content
            await this.loadInitialContent();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            this.isInitialized = true;
            console.log('Forum application initialized successfully');

        } catch (error) {
            console.error('Initialization error:', error);
            Utils.showError('Failed to load application. Please refresh the page.');
        } finally {
            Utils.hideLoading();
        }
    }

    setupNavigation() {
        // Navigation links
        Utils.$('#home-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToHome();
        });

        Utils.$('#categories-nav')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToCategories();
        });

        // Update active navigation
        this.updateActiveNavigation();
    }

    setupGlobalEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl/Cmd + Enter to submit forms
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement && activeElement.form) {
                    const submitButton = activeElement.form.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.click();
                    }
                }
            }
        });

        // Handle notification close
        Utils.$('#notification-close')?.addEventListener('click', () => {
            Utils.hide('#notification');
        });

        // Auto-hide notifications
        document.addEventListener('click', (e) => {
            if (e.target.matches('#notification') || e.target.closest('#notification')) {
                Utils.hide('#notification');
            }
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Handle online/offline status
        window.addEventListener('online', () => {
            Utils.showSuccess('Connection restored');
            this.refresh();
        });

        window.addEventListener('offline', () => {
            Utils.showWarning('You are offline. Some features may not work.');
        });
    }

    async loadInitialContent() {
        // Load posts on home page
        if (window.Posts) {
            await window.Posts.loadPosts();
        }

        // Initialize likes for visible posts
        if (window.Likes) {
            setTimeout(() => {
                window.Likes.initVisiblePosts();
            }, 500);
        }
    }

    // Navigation methods
    navigateToHome() {
        this.currentPage = 'home';
        this.updateActiveNavigation();
        
        // Show posts container, hide other content
        Utils.show('.posts-container');
        Utils.show('.sidebar');
        
        // Refresh posts
        if (window.Posts) {
            window.Posts.refresh();
        }
    }

    navigateToCategories() {
        this.currentPage = 'categories';
        this.updateActiveNavigation();
        
        // For now, just show a message
        Utils.showWarning('Categories page not implemented yet');
    }

    updateActiveNavigation() {
        // Remove active class from all nav links
        Utils.$$('.nav-link').forEach(link => link.classList.remove('active'));
        
        // Add active class to current page
        const activeLink = Utils.$(`#${this.currentPage}-nav`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Modal management
    closeAllModals() {
        Utils.$$('.modal').forEach(modal => {
            Utils.closeModal(modal);
        });
    }

    // Handle window resize
    handleResize() {
        // Add responsive behavior here if needed
        const width = window.innerWidth;
        
        if (width < 768) {
            // Mobile view adjustments
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }

    // Refresh application data
    async refresh() {
        try {
            Utils.showLoading();

            // Refresh authentication status
            if (window.Auth) {
                await window.Auth.checkAuthStatus();
                window.Auth.updateUI();
            }

            // Refresh categories
            if (window.Categories) {
                await window.Categories.refresh();
            }

            // Refresh posts
            if (window.Posts) {
                await window.Posts.refresh();
            }

            // Refresh likes for visible content
            if (window.Likes) {
                setTimeout(() => {
                    window.Likes.initVisiblePosts();
                    window.Likes.initVisibleComments();
                }, 500);
            }

        } catch (error) {
            console.error('Refresh error:', error);
            Utils.showError('Failed to refresh content');
        } finally {
            Utils.hideLoading();
        }
    }

    // Error handling
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        
        if (error.message && error.message.includes('NetworkError')) {
            Utils.showError('Network error. Please check your connection.');
        } else if (error.message && error.message.includes('401')) {
            Utils.showError('Session expired. Please log in again.');
            if (window.Auth) {
                window.Auth.showLoginForm();
            }
        } else {
            Utils.showError(error.message || 'An unexpected error occurred');
        }
    }

    // Get application state
    getState() {
        return {
            currentPage: this.currentPage,
            isInitialized: this.isInitialized,
            currentUser: window.currentUser,
            isOnline: navigator.onLine
        };
    }

    // Check if application is ready
    isReady() {
        return this.isInitialized;
    }

    // Cleanup (for page unload)
    cleanup() {
        // Clear any intervals or timeouts
        // Remove event listeners if needed
        console.log('Application cleanup completed');
    }
}

// Global error handlers
window.addEventListener('error', (event) => {
    console.error('Global JavaScript Error:', event.error);
    if (window.App) {
        window.App.handleError(event.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    if (window.App) {
        window.App.handleError(event.reason, 'Promise');
    }
});

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.App = new App();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.App) {
        window.App.cleanup();
    }
});
