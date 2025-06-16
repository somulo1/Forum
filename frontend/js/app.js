// Main Application Controller

class App {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                await this.initialize();
            }
        } catch (error) {
            console.error('App initialization error:', error);
            Utils.showError('Failed to initialize application');
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
        // Home link
        const homeLink = Utils.$('#home-link');
        if (homeLink) {
            homeLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToHome();
            });
        }

        // Categories link
        const categoriesLink = Utils.$('#categories-link');
        if (categoriesLink) {
            categoriesLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToCategories();
            });
        }

        // Update active navigation
        this.updateActiveNavigation();
    }

    setupGlobalEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });

        // Handle global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            Utils.showSuccess('Connection restored');
            this.refresh();
        });

        window.addEventListener('offline', () => {
            Utils.showError('Connection lost. Some features may not work.');
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                // Refresh data when user returns to tab
                this.refreshIfStale();
            }
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
        
        // For now, just show a message about categories
        // In a full implementation, you might have a dedicated categories page
        Utils.showMessage('Categories feature - use the filter dropdown to browse by category');
    }

    updateActiveNavigation() {
        // Remove active class from all nav links
        Utils.$$('.nav-link').forEach(link => link.classList.remove('active'));
        
        // Add active class to current page link
        const activeLink = Utils.$(`#${this.currentPage}-link`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Handle browser navigation
    handlePopState(event) {
        // Handle browser back/forward buttons
        // For now, just navigate to home
        this.navigateToHome();
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in inputs
        if (event.target.matches('input, textarea')) return;

        switch (event.key) {
            case 'n':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    if (AuthHelpers.isLoggedIn() && window.Posts) {
                        window.Posts.showCreatePostModal();
                    }
                }
                break;
            case 'r':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.refresh();
                }
                break;
            case '/':
                event.preventDefault();
                // Focus on search if we had one
                break;
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

    // Refresh data if it's stale (when user returns to tab)
    refreshIfStale() {
        const lastRefresh = this.lastRefreshTime || 0;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - lastRefresh > fiveMinutes) {
            this.refresh();
            this.lastRefreshTime = now;
        }
    }

    // Get application state
    getState() {
        return {
            currentPage: this.currentPage,
            isInitialized: this.isInitialized,
            isAuthenticated: AuthHelpers.isLoggedIn(),
            currentUser: AuthHelpers.getCurrentUser()
        };
    }

    // Handle application errors
    handleError(error, context = 'Unknown') {
        console.error(`App Error [${context}]:`, error);
        
        if (error.message && error.message.includes('Network')) {
            Utils.showError('Network error. Please check your connection.');
        } else if (error.message && error.message.includes('Unauthorized')) {
            Utils.showError('Session expired. Please log in again.');
            if (window.Auth) {
                window.Auth.handleLogout();
            }
        } else {
            Utils.showError(`An error occurred: ${error.message || 'Unknown error'}`);
        }
    }

    // Cleanup method
    destroy() {
        // Remove event listeners and cleanup
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('online', this.refresh);
        window.removeEventListener('offline', () => {});
        document.removeEventListener('visibilitychange', this.refreshIfStale);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.App = new App();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.App) {
        window.App.handleError(event.error, 'Global');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.App) {
        window.App.handleError(event.reason, 'Promise');
    }
});

// Export app helpers
window.AppHelpers = {
    refresh: () => {
        if (window.App) {
            return window.App.refresh();
        }
    },
    
    getState: () => {
        if (window.App) {
            return window.App.getState();
        }
        return null;
    },
    
    navigateToHome: () => {
        if (window.App) {
            window.App.navigateToHome();
        }
    }
};
