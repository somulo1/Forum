// Main application file for the forum

class ForumApp {
    constructor() {
        this.currentPage = 'home';
        this.categories = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadInitialData();
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                }
            });
        });

        // Create category button
        const createCategoryBtn = document.getElementById('createCategoryBtn');
        if (createCategoryBtn) {
            createCategoryBtn.addEventListener('click', () => {
                auth.requireAuth(() => this.showCreateCategoryModal());
            });
        }

        // Create category form
        const createCategoryForm = document.getElementById('createCategoryForm');
        if (createCategoryForm) {
            createCategoryForm.addEventListener('submit', (e) => this.handleCreateCategory(e));
        }

        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    setupNavigation() {
        // Handle initial hash
        this.handleHashChange();
    }

    async loadInitialData() {
        try {
            // Load categories first
            await this.loadCategories();
            
            // Load posts
            await this.loadPosts();
            
            // Update stats
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }

    async loadCategories() {
        try {
            const categories = await apiWrapper.getCategories();
            this.categories = categories || [];
            this.renderCategoriesPage();
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = [];
        }
    }

    async loadPosts() {
        if (window.posts && window.posts.loadPosts) {
            await window.posts.loadPosts();
        }
    }

    navigateToPage(page) {
        // Update navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.classList.remove('active'));

        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
        }

        // Load page-specific data
        this.loadPageData(page);

        // Update URL hash
        window.location.hash = page;
    }

    async loadPageData(page) {
        switch (page) {
            case 'home':
                await this.loadPosts();
                break;
            case 'categories':
                await this.loadCategories();
                break;
            case 'trending':
                await this.loadTrendingPosts();
                break;
        }
    }

    async loadTrendingPosts() {
        // For now, just load regular posts
        // In a real implementation, this would load posts sorted by trending score
        const container = document.getElementById('trendingPosts');
        if (container) {
            container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading trending posts...</div>';
            
            try {
                // Simulate trending posts by using regular posts
                const posts = await apiWrapper.getPosts(1, 20);
                if (posts && posts.length > 0) {
                    container.innerHTML = posts.map(post => window.posts.createPostCard(post)).join('');
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-fire fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                            <h3>No trending posts</h3>
                            <p>Check back later for trending content!</p>
                        </div>
                    `;
                }
            } catch (error) {
                container.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle fa-3x" style="color: #dc3545; margin-bottom: 20px;"></i>
                        <h3>Failed to load trending posts</h3>
                        <p>Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    renderCategoriesPage() {
        const container = document.getElementById('categoriesGrid');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tags fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                    <h3>No categories yet</h3>
                    <p>Create the first category to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.categories.map(category => `
            <div class="category-card" data-category-id="${category.id}">
                <h3>${utils.escapeHtml(category.name)}</h3>
                <div class="category-stats">
                    <span>${category.posts_count || 0} posts</span>
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                this.filterPostsByCategory(categoryId);
            });
        });
    }

    filterPostsByCategory(categoryId) {
        // Navigate to home page and filter by category
        this.navigateToPage('home');
        
        // TODO: Implement category filtering in posts
        const category = this.categories.find(c => c.id == categoryId);
        if (category) {
            toast.info(`Showing posts in: ${category.name}`);
        }
    }

    async handleCreateCategory(event) {
        event.preventDefault();
        
        const name = document.getElementById('categoryName').value.trim();
        
        if (!name) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            await apiWrapper.createCategory({ name });
            modal.close();
            this.clearCreateCategoryForm();
            await this.loadCategories();
            
            // Also reload categories in posts module
            if (window.posts && window.posts.loadCategories) {
                await window.posts.loadCategories();
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    showCreateCategoryModal() {
        modal.open('createCategoryModal');
        // Focus on name field
        setTimeout(() => {
            const nameField = document.getElementById('categoryName');
            if (nameField) nameField.focus();
        }, 100);
    }

    clearCreateCategoryForm() {
        const form = document.getElementById('createCategoryForm');
        if (form) form.reset();
    }

    updateStats() {
        // Update total posts count
        const totalPostsElement = document.getElementById('totalPosts');
        if (totalPostsElement && window.posts && window.posts.posts) {
            totalPostsElement.textContent = window.posts.posts.length;
        }

        // Update total users count (placeholder)
        const totalUsersElement = document.getElementById('totalUsers');
        if (totalUsersElement) {
            totalUsersElement.textContent = '1'; // Placeholder
        }
    }

    handleResize() {
        // Handle responsive behavior if needed
        const isMobile = window.innerWidth <= 768;
        
        // You can add mobile-specific behavior here
        if (isMobile) {
            // Mobile-specific adjustments
        }
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1); // Remove #
        
        if (hash && hash !== this.currentPage) {
            // Check if it's a valid page
            const validPages = ['home', 'categories', 'trending'];
            if (validPages.includes(hash)) {
                this.navigateToPage(hash);
            } else if (hash.startsWith('post-')) {
                // Handle direct post links
                const postId = hash.replace('post-', '');
                this.navigateToPage('home');
                setTimeout(() => {
                    if (window.comments && window.comments.showPostDetail) {
                        window.comments.showPostDetail(postId);
                    }
                }, 500);
            }
        }
    }

    // Public methods for other modules
    refreshPosts() {
        return this.loadPosts();
    }

    refreshCategories() {
        return this.loadCategories();
    }

    getCurrentPage() {
        return this.currentPage;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ForumApp();
});

// Handle service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // You can register a service worker here for offline capabilities
        // navigator.serviceWorker.register('/sw.js');
    });
}
