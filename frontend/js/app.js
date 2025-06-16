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
        // Old navigation removed - using left sidebar navigation instead

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

    // Old navigation method removed - using left sidebar navigation instead

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

// Navigation Manager for left sidebar
class NavigationManager {
    constructor() {
        this.currentView = 'home';
        this.init();
    }

    init() {
        this.setupNavigationListeners();
        // Delay initial update to ensure auth is initialized
        setTimeout(() => {
            this.updateAuthenticatedNavigation();
        }, 100);
    }

    setupNavigationListeners() {
        // Left sidebar navigation buttons
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view);
            });
        });

        // Listen for auth state changes
        document.addEventListener('authStateChanged', () => {
            this.updateAuthenticatedNavigation();
        });
    }

    showView(view) {
        console.log('Showing view:', view);

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Hide all sections
        document.getElementById('postsSection')?.classList.remove('active');
        document.getElementById('profileSection')?.classList.remove('active');

        // Update feed header title and filters
        const feedHeader = document.querySelector('.feed-header h2');
        const feedFilters = document.querySelector('.feed-filters');

        // Show appropriate section and load content
        switch(view) {
            case 'home':
                document.getElementById('postsSection')?.classList.add('active');
                if (feedHeader) feedHeader.textContent = 'Latest Posts';
                if (feedFilters) feedFilters.style.display = 'flex';
                window.posts?.loadPosts('all');
                break;
            case 'my-posts':
                document.getElementById('postsSection')?.classList.add('active');
                if (feedHeader) feedHeader.textContent = 'My Posts';
                if (feedFilters) feedFilters.style.display = 'none';
                window.posts?.loadPosts('my-posts');
                break;
            case 'liked-posts':
                document.getElementById('postsSection')?.classList.add('active');
                if (feedHeader) feedHeader.textContent = 'Liked Posts';
                if (feedFilters) feedFilters.style.display = 'none';
                window.posts?.loadPosts('liked');
                break;
            case 'trending':
                document.getElementById('postsSection')?.classList.add('active');
                if (feedHeader) feedHeader.textContent = 'Trending Posts';
                if (feedFilters) feedFilters.style.display = 'none';
                window.posts?.loadPosts('all'); // TODO: Implement trending
                break;
            case 'profile':
                document.getElementById('profileSection')?.classList.add('active');
                this.loadProfile();
                break;
        }

        this.currentView = view;
    }

    updateAuthenticatedNavigation() {
        const isAuthenticated = window.auth?.isUserAuthenticated();

        console.log('Updating navigation, authenticated:', isAuthenticated);

        // Show/hide authenticated navigation buttons
        const myPostsBtn = document.getElementById('myPostsNavBtn');
        const likedPostsBtn = document.getElementById('likedPostsNavBtn');
        const profileBtn = document.getElementById('profileNavBtn');

        if (myPostsBtn) {
            myPostsBtn.style.display = isAuthenticated ? 'flex' : 'none';
            console.log('My Posts button display:', myPostsBtn.style.display);
        }
        if (likedPostsBtn) {
            likedPostsBtn.style.display = isAuthenticated ? 'flex' : 'none';
            console.log('Liked Posts button display:', likedPostsBtn.style.display);
        }
        if (profileBtn) {
            profileBtn.style.display = isAuthenticated ? 'flex' : 'none';
            console.log('Profile button display:', profileBtn.style.display);
        }

        // Also update the old filter buttons for consistency
        const myPostsFilter = document.getElementById('myPostsFilter');
        const likedPostsFilter = document.getElementById('likedPostsFilter');

        if (myPostsFilter) myPostsFilter.style.display = isAuthenticated ? 'flex' : 'none';
        if (likedPostsFilter) likedPostsFilter.style.display = isAuthenticated ? 'flex' : 'none';

        // If user logged out and was viewing authenticated content, redirect to home
        if (!isAuthenticated && ['my-posts', 'liked-posts', 'profile'].includes(this.currentView)) {
            this.showView('home');
        }
    }

    async loadProfile() {
        if (!window.auth?.isUserAuthenticated()) {
            this.showView('home');
            return;
        }

        const user = window.auth.getCurrentUser();
        if (!user) return;

        // Update profile information
        document.getElementById('profileUsername').textContent = user.username || 'Unknown User';
        document.getElementById('profileEmail').textContent = user.email || 'No email';

        // Format join date
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
        document.getElementById('profileJoined').textContent = `Member since: ${joinDate}`;

        // Update avatar
        const avatarElement = document.getElementById('profileAvatar');
        if (avatarElement) {
            const avatarColor = window.utils?.generateAvatarColor(user.username || 'User');
            const avatarInitials = window.utils?.getAvatarInitials(user.username || 'User');
            avatarElement.style.background = `linear-gradient(135deg, ${avatarColor}, #0056b3)`;
            avatarElement.textContent = avatarInitials;
        }

        // Load user statistics
        await this.loadUserStats(user.id);
    }

    async loadUserStats(userId) {
        try {
            // Get user's posts
            const userPosts = await window.apiWrapper?.getPosts(1, 100, { user_id: userId });
            const postsCount = userPosts ? userPosts.length : 0;
            document.getElementById('userPostsCount').textContent = postsCount;

            // Calculate total likes received on user's posts
            let totalLikes = 0;
            if (userPosts) {
                totalLikes = userPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
            }
            document.getElementById('userLikesCount').textContent = totalLikes;

            // TODO: Implement comments count when comment API is available
            document.getElementById('userCommentsCount').textContent = '0';

        } catch (error) {
            console.error('Failed to load user stats:', error);
            document.getElementById('userPostsCount').textContent = '0';
            document.getElementById('userLikesCount').textContent = '0';
            document.getElementById('userCommentsCount').textContent = '0';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ForumApp();
    window.navigation = new NavigationManager();

    // Debug function for testing navigation
    window.testNavigation = function() {
        console.log('Testing navigation...');
        console.log('Navigation manager:', window.navigation);
        console.log('Auth manager:', window.auth);
        console.log('Is authenticated:', window.auth?.isUserAuthenticated());

        // Test showing profile if authenticated
        if (window.auth?.isUserAuthenticated()) {
            console.log('Testing profile view...');
            window.navigation.showView('profile');
        } else {
            console.log('User not authenticated, testing home view...');
            window.navigation.showView('home');
        }
    };

    console.log('Forum application initialized with navigation');
    console.log('Use window.testNavigation() to test navigation manually');
});

// Handle service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // You can register a service worker here for offline capabilities
        // navigator.serviceWorker.register('/sw.js');
    });
}
