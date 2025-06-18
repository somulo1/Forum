/**
 * Navigation Manager - Handles navigation bar functionality
 */

export class NavManager {
    constructor(authManager, authModal) {
        this.authManager = authManager;
        this.authModal = authModal;
        this.navAuth = document.getElementById("navAuth");
        
        this.init();
    }

    /**
     * Initialize navigation components
     */
    init() {
        this.renderNavLogo();
        this.setupMenuHandlers();
    }

    /**
     * Render navigation logo
     */
    renderNavLogo() {
        const navLogoContainer = document.getElementById("navLogoContainer");

        if (!navLogoContainer) {
            console.error("Missing #navLogoContainer in index.html");
            return;
        }

        navLogoContainer.innerHTML = `
            <img src="http://localhost:8080/static/pictures/forum-logo.png" alt="Forum" class="nav-logo">
        `;
    }

    /**
     * Setup authentication buttons based on user status
     */
    async setupAuthButtons() {
        try {
            const isAuthenticated = await this.authManager.checkAuthStatus();
            
            if (isAuthenticated) {
                const user = this.authManager.getCurrentUser();
                this.renderAuthenticatedNav(user);
            } else {
                this.renderUnauthenticatedNav();
            }
        } catch (error) {
            console.error("Error checking authentication:", error);
            this.renderUnauthenticatedNav();
        }
    }

    /**
     * Render navigation for authenticated users
     * @param {Object} user - Current user data
     */
    renderAuthenticatedNav(user) {
        this.navAuth.innerHTML = `
            <img src="http://localhost:8080${user.avatar_url || '/static/pictures/default-avatar.png'}"
                 alt="User Avatar"
                 style="width:32px; height:32px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px;"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzLjk5IDcuMDEgMTUuNjIgNiAxOEMxMC4wMSAyMCAxMy45OSAyMCAxOCAxOEMxNi45OSAxNS42MiAxNC42NyAxMy45OSAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4K'">
            <span>${user.username}</span>
            <button class="logout-btn" style="margin-left:10px;">Logout</button>
        `;

        // Setup logout handler
        const logoutBtn = document.querySelector(".logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => this.handleLogout());
        }
    }

    /**
     * Render navigation for unauthenticated users
     */
    renderUnauthenticatedNav() {
        this.navAuth.innerHTML = `
            <button class="login-btn">Login</button>
            <button class="signup-btn">Sign Up</button>
        `;
        
        // Setup auth button handlers
        const loginBtn = document.querySelector(".login-btn");
        const signupBtn = document.querySelector(".signup-btn");
        
        if (loginBtn) {
            loginBtn.addEventListener("click", () => {
                this.authModal.showLoginModal();
            });
        }
        
        if (signupBtn) {
            signupBtn.addEventListener("click", () => {
                this.authModal.showSignupModal();
            });
        }
    }

    /**
     * Handle user logout
     */
    async handleLogout() {
        const success = await this.authManager.logout();
        
        if (success) {
            this.renderUnauthenticatedNav();
        } else {
            console.error("Logout failed");
        }
    }

    /**
     * Setup menu handlers for sidebar navigation
     */
    setupMenuHandlers() {
        const menuItems = document.querySelectorAll('.menu-item[data-view]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                menuItems.forEach(mi => mi.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                // Handle view switching
                const view = item.getAttribute('data-view');
                this.handleViewChange(view);
            });
        });
    }

    /**
     * Handle view changes from sidebar menu
     * @param {string} view - View name to switch to
     */
    handleViewChange(view) {
        console.log(`Switching to view: ${view}`);
        
        // This can be extended to handle different views
        switch (view) {
            case 'home':
                // Already on home view
                break;
            case 'profile':
                // Handle profile view
                break;
            case 'trending':
                // Handle trending view
                break;
            case 'saved':
                // Handle saved posts view
                break;
            default:
                console.warn(`Unknown view: ${view}`);
        }
    }

    /**
     * Update navigation after successful authentication
     * @param {Object} user - User data
     */
    onAuthSuccess(user) {
        this.renderAuthenticatedNav(user);
    }
}
