// Forum Application - Main JavaScript File

// Configuration
const API_BASE_URL = 'http://localhost:8080';

class ForumApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.currentFilter = 'all';
        this.currentCategoryFilter = null;
        this.currentSearchQuery = '';
        this.currentSort = 'newest';
        this.selectedCategories = [];
        this.editSelectedCategories = [];
        this.allCategories = [];
        this.posts = [];
        
        this.init();
    }

    async init() {
        // Ensure posts is always an array
        if (!Array.isArray(this.posts)) {
            this.posts = [];
        }

        this.setupEventListeners();
        await this.checkAuthStatus();
        await this.loadCategories();
        await this.loadPosts();
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('login-btn').addEventListener('click', () => this.showModal('login-modal'));
        document.getElementById('register-btn').addEventListener('click', () => this.showModal('register-modal'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        
        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.hideModal(e.target.dataset.modal));
        });
        
        // Switch between login/register
        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showModal('register-modal');
        });
        
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('register-modal');
            this.showModal('login-modal');
        });
        
        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('create-post-form').addEventListener('submit', (e) => this.handleCreatePost(e));
        document.getElementById('edit-post-form').addEventListener('submit', (e) => this.handleEditPost(e));
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Category dropdown
        document.getElementById('category-dropdown').addEventListener('change', (e) => {
            if (e.target.value) {
                this.addCategoryFromDropdown(e.target.value);
                e.target.value = ''; // Reset dropdown
            }
        });

        // Edit category dropdown
        document.getElementById('edit-category-dropdown').addEventListener('change', (e) => {
            if (e.target.value) {
                this.addEditCategoryFromDropdown(e.target.value);
                e.target.value = ''; // Reset dropdown
            }
        });
        
        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.debounce(() => this.searchPosts(e.target.value), 300)();
        });

        // Sort
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortPosts(e.target.value);
        });

        // Mobile sidebar functionality
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.toggleMobileSidebar());
        }
        
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // Authentication Methods
    async checkAuthStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/user`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateAuthUI(true);
            } else {
                this.updateAuthUI(false);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.updateAuthUI(false);
        }
    }

    updateAuthUI(isLoggedIn) {
        const userInfo = document.querySelector('.user-info');
        const authButtons = document.querySelector('.auth-buttons');
        const userOnlyElements = document.querySelectorAll('.user-only');
        
        if (isLoggedIn && this.currentUser) {
            userInfo.classList.remove('hidden');
            authButtons.classList.add('hidden');
            userOnlyElements.forEach(el => el.classList.remove('hidden'));
            
            // Update user info
            document.querySelector('.user-avatar').src = this.getAvatarUrl(this.currentUser.avatar_url, this.currentUser.username);
            document.querySelector('.username').textContent = this.currentUser.username;
        } else {
            userInfo.classList.add('hidden');
            authButtons.classList.remove('hidden');
            userOnlyElements.forEach(el => el.classList.add('hidden'));
            this.currentUser = null;
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        // Basic validation
        if (!username || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, true);
        this.showLoading();

        const loginData = { username, password };

        try {
            const response = await this.makeRequest('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                await this.checkAuthStatus();
                this.hideModal('login-modal');
                this.showNotification('Login successful!', 'success');
                e.target.reset();
                await this.loadPosts(); // Reload posts to show user-specific content
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(submitButton, false);
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        // Validate form
        const errors = this.validateRegistrationForm(formData);
        if (errors.length > 0) {
            this.showNotification(errors.join('. '), 'error');
            return;
        }

        const submitButton = e.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitButton, true);
        this.showLoading();

        // The backend expects multipart/form-data, so we send FormData directly
        // No need to convert to JSON since backend uses r.ParseMultipartForm()

        try {
            const response = await this.makeRequest('/api/register', {
                method: 'POST',
                // Don't set Content-Type header - let browser set it for multipart/form-data
                body: formData
            });

            if (response.ok) {
                this.hideModal('register-modal');
                this.showNotification('Registration successful! Please log in.', 'success');
                e.target.reset();
                this.showModal('login-modal');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(submitButton, false);
            this.hideLoading();
        }
    }

    async logout() {
        this.showLoading();
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.updateAuthUI(false);
                this.showNotification('Logged out successfully', 'success');
                await this.loadPosts(); // Reload posts to hide user-specific content
            } else {
                this.showNotification('Logout failed', 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Logout failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Categories Methods
    async loadCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories`);
            if (response.ok) {
                this.allCategories = await response.json();
                this.renderCategoryFilters();
                this.populateCategoryDropdown();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategoryFilters() {
        const container = document.getElementById('category-list');
        if (!container) return; // Fallback if element doesn't exist

        container.innerHTML = '';

        // Add "All Posts" item
        const allItem = document.createElement('div');
        allItem.className = 'category-item active';
        allItem.dataset.categoryId = 'all';
        allItem.innerHTML = `
            <span class="category-name">All Posts</span>
            <span class="post-count">${this.posts ? this.posts.length : 0}</span>
        `;
        allItem.addEventListener('click', () => this.filterByCategory(null, allItem));
        container.appendChild(allItem);

        // Add category items
        this.allCategories.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.dataset.categoryId = category.id;
            item.innerHTML = `
                <span class="category-name">${category.name}</span>
                <span class="post-count">0</span>
            `;
            item.addEventListener('click', () => this.filterByCategory(category.id, item));
            container.appendChild(item);
        });

        // Update post counts for each category
        this.updateCategoryPostCounts();
    }

    updateCategoryPostCounts() {
        if (!this.posts || !this.allCategories) return;

        // Count posts for each category
        const categoryCounts = {};
        this.allCategories.forEach(cat => categoryCounts[cat.id] = 0);

        this.posts.forEach(post => {
            if (post.category_ids) {
                post.category_ids.forEach(catId => {
                    if (categoryCounts[catId] !== undefined) {
                        categoryCounts[catId]++;
                    }
                });
            }
        });



        // Update the display using data attributes
        this.allCategories.forEach(category => {
            const countElement = document.querySelector(`[data-category-id="${category.id}"] .post-count`);
            if (countElement) {
                countElement.textContent = categoryCounts[category.id] || 0;
            }
        });

        // Update "All Posts" count with null safety
        const allCountElement = document.querySelector('[data-category-id="all"] .post-count');
        if (allCountElement) {
            allCountElement.textContent = this.posts && Array.isArray(this.posts) ? this.posts.length : 0;
        }
    }

    populateCategoryDropdown() {
        const dropdown = document.getElementById('category-dropdown');
        if (!dropdown) return;

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Select a category to add...</option>';

        // Add categories as options, disable already selected ones
        this.allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;

            // Disable if already selected
            const isSelected = this.selectedCategories.some(selected => selected.id == category.id);
            if (isSelected) {
                option.disabled = true;
                option.textContent += ' (already selected)';
            }

            dropdown.appendChild(option);
        });
    }

    addCategoryFromDropdown(categoryId) {
        const category = this.allCategories.find(cat => cat.id == categoryId);
        if (!category) return;

        // Check if category is already selected
        if (!this.selectedCategories.some(selected => selected.id == categoryId)) {
            this.selectedCategories.push({
                id: category.id,
                name: category.name
            });
            this.renderSelectedCategories();
        }
    }

    renderSelectedCategories() {
        const container = document.getElementById('selected-categories');
        container.innerHTML = '';

        this.selectedCategories.forEach(category => {
            const tag = document.createElement('div');
            tag.className = 'category-tag';
            tag.innerHTML = `
                ${category.name}
                <span class="remove" onclick="app.removeCategory(${category.id})">&times;</span>
            `;
            container.appendChild(tag);
        });

        // Refresh dropdown to update disabled states
        this.populateCategoryDropdown();
    }

    removeCategory(categoryId) {
        this.selectedCategories = this.selectedCategories.filter(cat => cat.id != categoryId);
        this.renderSelectedCategories();
    }

    // Posts Methods
    async loadPosts() {
        this.showLoading();

        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.postsPerPage
            });

            // Add category filter
            if (this.currentCategoryFilter) {
                params.append('category', this.currentCategoryFilter);
            }

            // Add search query
            if (this.currentSearchQuery) {
                params.append('search', this.currentSearchQuery);
            }

            // Add sort parameter
            if (this.currentSort) {
                params.append('sort', this.currentSort);
            }

            // Add filter type (my-posts, liked-posts, etc.)
            if (this.currentFilter && this.currentFilter !== 'all') {
                params.append('filter', this.currentFilter);
                console.log(`DEBUG: Adding filter parameter: ${this.currentFilter}`);
            }

            const finalUrl = `${API_BASE_URL}/api/posts?${params.toString()}`;
            console.log(`DEBUG: Making request to: ${finalUrl}`);
            console.log(`DEBUG: Current user authenticated: ${!!this.currentUser}`);

            const response = await fetch(finalUrl, {
                credentials: 'include'
            });

            if (response.ok) {
                const postsData = await response.json();
                this.posts = Array.isArray(postsData) ? postsData : [];
                console.log('Received posts from backend:', this.posts.length, 'posts');
                console.log('Search query was:', this.currentSearchQuery);
                console.log('Posts received:', this.posts.map(p => ({id: p.id, title: p.title})));
                this.renderPosts();
            } else {
                this.showNotification('Failed to load posts', 'error');
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            this.posts = []; // Ensure posts is always an array
            this.showNotification('Failed to load posts', 'error');
        } finally {
            this.hideLoading();
        }
    }

    filterPostsClientSide() {
        // Apply client-side filtering as fallback if backend doesn't support all filters
        let filteredPosts = [...this.posts];

        // Category filter
        if (this.currentCategoryFilter) {
            filteredPosts = filteredPosts.filter(post =>
                post.category_ids && post.category_ids.includes(parseInt(this.currentCategoryFilter))
            );
        }

        // Note: User-specific filtering (my-posts, liked-posts) is now handled by the backend

        // Note: Search filtering is now handled by the backend

        this.posts = filteredPosts;
    }

    renderPosts() {
        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        // Add null safety check for posts array
        if (!this.posts || !Array.isArray(this.posts) || this.posts.length === 0) {
            container.innerHTML = '<p class="no-posts">No posts found.</p>';
            this.updateCategoryPostCounts();
            return;
        }

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });

        // Update category post counts after rendering
        this.updateCategoryPostCounts();

        // Load reaction counts for all posts after DOM is fully rendered
        setTimeout(() => {
            console.log('Loading reaction counts for', this.posts.length, 'posts');
            this.posts.forEach(post => {
                console.log(`Loading reactions for post ${post.id}`);
                // Check if elements exist before loading
                const likesElement = document.getElementById(`likes-count-${post.id}`);
                const dislikesElement = document.getElementById(`dislikes-count-${post.id}`);

                if (likesElement && dislikesElement) {
                    this.loadReactionCounts(post.id, 'post');
                    this.loadCommentCounts(post.id);
                } else {
                    console.warn(`Post ${post.id} reaction elements not found, retrying...`);
                    // Retry after a longer delay
                    setTimeout(() => {
                        this.loadReactionCounts(post.id, 'post');
                        this.loadCommentCounts(post.id);
                    }, 500);
                }
            });
        }, 300);
    }

    createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card';
        postDiv.dataset.postId = post.id;

        // Get categories for this post
        const postCategories = (post.category_ids && Array.isArray(post.category_ids)) ?
            post.category_ids.map(id => this.allCategories.find(cat => cat.id === id)?.name).filter(Boolean) : [];

        postDiv.innerHTML = `
            <div class="post-header">
                <img class="post-avatar" src="${this.getAvatarUrl(post.avatar_url, post.username)}" alt="${post.username}">
                <div class="post-meta">
                    <div class="post-author">${post.username}</div>
                    <div class="post-date">${this.formatDate(post.created_at)}</div>
                </div>
                <div class="post-actions">
                    ${this.currentUser && this.currentUser.id === post.user_id ?
                        `<button class="btn btn-sm btn-secondary" onclick="app.editPost(${post.id})">Edit</button>
                         <button class="btn btn-sm btn-danger" onclick="app.deletePost(${post.id})">Delete</button>` : ''}
                </div>
            </div>

            <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
            <div class="post-content">${this.escapeHtml(post.content)}</div>

            ${post.image_url ? `<img class="post-image" src="${post.image_url}" alt="Post image">` : ''}

            ${postCategories.length > 0 ? `
                <div class="post-categories">
                    ${postCategories.map(cat => `<span class="post-category">${cat}</span>`).join('')}
                </div>
            ` : ''}

            <div class="post-footer">
                <div class="post-stats">
                    <div class="stat">
                        <span>💬</span>
                        <span id="comments-count-${post.id}">0</span>
                    </div>
                </div>
                <div class="reaction-buttons">
                    <button class="reaction-btn like" onclick="app.toggleReaction(${post.id}, 'like', 'post')">
                        <span>👍</span>
                        <span id="likes-count-${post.id}">0</span>
                    </button>
                    <button class="reaction-btn dislike" onclick="app.toggleReaction(${post.id}, 'dislike', 'post')">
                        <span>👎</span>
                        <span id="dislikes-count-${post.id}">0</span>
                    </button>
                </div>
            </div>
        `;

        // Add click handler to open post details
        postDiv.addEventListener('click', (e) => {
            // Don't open if clicking on buttons
            if (!e.target.closest('button')) {
                this.openPostDetails(post.id);
            }
        });

        return postDiv;
    }

    async handleCreatePost(e) {
        e.preventDefault();

        // Validate that at least one category is selected
        if (this.selectedCategories.length === 0) {
            this.showNotification('Please select at least one category', 'warning');
            return;
        }

        this.showLoading();

        const formData = new FormData(e.target);

        // Add selected categories
        this.selectedCategories.forEach(category => {
            formData.append('category_ids[]', category.id);
        });

        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/create`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                this.showNotification('Post created successfully!', 'success');
                e.target.reset();
                this.selectedCategories = [];
                this.renderSelectedCategories();
                await this.loadPosts();
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to create post', 'error');
            }
        } catch (error) {
            console.error('Create post error:', error);
            this.showNotification('Failed to create post', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ post_id: postId })
            });

            if (response.ok) {
                this.showNotification('Post deleted successfully', 'success');
                await this.loadPosts();
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to delete post', 'error');
            }
        } catch (error) {
            console.error('Delete post error:', error);
            this.showNotification('Failed to delete post', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Navigation and Filtering
    handleNavigation(e) {
        const filter = e.target.dataset.filter;

        // Check authentication for user-specific filters
        if ((filter === 'my-posts' || filter === 'liked-posts') && !this.currentUser) {
            this.showNotification('Please log in to view your posts and liked posts', 'warning');
            this.showModal('login-modal');
            return;
        }

        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Reset other filters when changing navigation
        this.currentFilter = filter;
        this.currentCategoryFilter = null;
        this.currentSearchQuery = '';
        this.currentPage = 1;

        // Update category items (remove active state)
        document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
        if (filter === 'all') {
            document.querySelector('.category-item[data-category-id="all"]')?.classList.add('active');
        }

        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        // Update posts title
        const titles = {
            'all': 'All Posts',
            'categories': 'Categories',
            'my-posts': 'My Posts',
            'liked-posts': 'Liked Posts'
        };

        document.getElementById('posts-title').textContent = titles[filter] || 'Posts';

        if (filter === 'categories') {
            this.showCategoriesView();
        } else {
            this.loadPosts();
        }
    }

    filterByCategory(categoryId, itemElement) {
        // Update active category item
        document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
        if (itemElement) {
            itemElement.classList.add('active');
        }

        // Reset other filters when filtering by category
        this.currentCategoryFilter = categoryId;
        this.currentFilter = 'all';
        this.currentSearchQuery = '';
        this.currentPage = 1;

        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-btn[data-filter="all"]')?.classList.add('active');

        // Clear search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        // Update posts title
        const categoryName = categoryId ?
            this.allCategories.find(cat => cat.id === categoryId)?.name :
            'All Posts';
        document.getElementById('posts-title').textContent = categoryName;

        this.loadPosts();
    }

    searchPosts(query) {
        this.currentSearchQuery = query;
        this.currentPage = 1;
        this.loadPosts();
    }

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');

        if (sidebar && overlay) {
            const isOpen = sidebar.classList.contains('show');

            if (isOpen) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            } else {
                sidebar.classList.add('show');
                overlay.classList.add('show');
            }
        }
    }

    sortPosts(sortBy) {
        this.currentSort = sortBy;
        this.loadPosts();
    }

    // Utility Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('show');
        modal.style.display = 'flex';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        modal.style.display = 'none';
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    debounce(func, wait) {
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

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        if (!text) return '';

        let processedText = text.toString();

        // Insert zero-width spaces in very long words to allow line breaking
        // This preserves all content while allowing it to wrap to new lines
        processedText = processedText.replace(/\S{40,}/g, (match) => {
            return match.replace(/(.{40})/g, '$1​'); // Add zero-width space every 40 chars
        });

        const div = document.createElement('div');
        div.textContent = processedText;
        return div.innerHTML;
    }

    getAvatarUrl(avatarUrl, username) {
        // Return a data URL for a simple avatar with the user's initials if avatar is missing
        if (!avatarUrl || avatarUrl === '/static/default.png' || avatarUrl === '') {
            const initials = username ? username.substring(0, 2).toUpperCase() : 'U';
            const canvas = document.createElement('canvas');
            canvas.width = 40;
            canvas.height = 40;
            const ctx = canvas.getContext('2d');

            // Create a simple colored background
            const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
            const colorIndex = username ? username.charCodeAt(0) % colors.length : 0;
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(0, 0, 40, 40);

            // Add initials
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(initials, 20, 20);

            return canvas.toDataURL();
        }

        // If avatar URL starts with /static/, prepend the backend URL
        if (avatarUrl.startsWith('/static/')) {
            return `http://localhost:8080${avatarUrl}`;
        }

        return avatarUrl;
    }

    // Reaction Methods
    async toggleReaction(id, type, target) {
        console.log(`toggleReaction called: id=${id}, type=${type}, target=${target}`);

        if (!this.currentUser) {
            this.showNotification('Please log in to react to posts', 'warning');
            return;
        }

        const payload = { type };
        if (target === 'post') {
            payload.post_id = id;
        } else {
            payload.comment_id = id;
        }

        console.log('Sending payload:', payload);

        try {
            const response = await fetch(`${API_BASE_URL}/api/likes/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Toggle response:', result);
                // Reload reaction counts for the specific item
                await this.loadReactionCounts(id, target);
                // Also refresh all visible reaction counts to ensure consistency
                this.refreshAllVisibleReactionCounts();
                this.showNotification('Reaction updated!', 'success');
            } else {
                const error = await response.text();
                console.error('Toggle error:', error);
                this.showNotification(error || 'Failed to update reaction', 'error');
            }
        } catch (error) {
            console.error('Reaction error:', error);
            this.showNotification('Failed to update reaction', 'error');
        }
    }

    async loadReactionCounts(id, target) {
        try {
            const param = target === 'post' ? `post_id=${id}` : `comment_id=${id}`;
            const response = await fetch(`${API_BASE_URL}/api/likes/reactions?${param}`);

            if (response.ok) {
                const data = await response.json();

                // Update main feed elements
                const likesElement = document.getElementById(`likes-count-${id}`);
                const dislikesElement = document.getElementById(`dislikes-count-${id}`);

                // Update modal elements (if they exist)
                const modalLikesElement = document.getElementById(`modal-likes-count-${id}`);
                const modalDislikesElement = document.getElementById(`modal-dislikes-count-${id}`);

                console.log(`Loading reaction counts for ${target} ${id}:`, data);
                console.log(`Looking for elements: likes-count-${id}, modal-likes-count-${id}`);
                console.log('Main likes element found:', !!likesElement);
                console.log('Modal likes element found:', !!modalLikesElement);

                // Update main feed elements
                if (likesElement) {
                    likesElement.textContent = data.likes || 0;
                    console.log(`Updated main likes count for ${target} ${id}: ${data.likes || 0}`);
                }

                if (dislikesElement) {
                    dislikesElement.textContent = data.dislikes || 0;
                    console.log(`Updated main dislikes count for ${target} ${id}: ${data.dislikes || 0}`);
                }

                // Update modal elements
                if (modalLikesElement) {
                    modalLikesElement.textContent = data.likes || 0;
                    console.log(`Updated modal likes count for ${target} ${id}: ${data.likes || 0}`);
                }

                if (modalDislikesElement) {
                    modalDislikesElement.textContent = data.dislikes || 0;
                    console.log(`Updated modal dislikes count for ${target} ${id}: ${data.dislikes || 0}`);
                }

                if (!likesElement && !modalLikesElement) {
                    console.warn(`No likes elements found for ${target} ${id}`);
                }
            } else {
                console.error(`Failed to load reaction counts: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to load reaction counts:', error);
        }
    }

    refreshAllVisibleReactionCounts() {
        console.log('Refreshing all visible reaction counts...');
        // Find all reaction count elements currently in the DOM and refresh them
        const likeElements = document.querySelectorAll('[id^="likes-count-"]');

        const processedIds = new Set();

        // Process like elements
        likeElements.forEach(element => {
            const id = element.id.replace('likes-count-', '');
            if (!processedIds.has(id)) {
                processedIds.add(id);
                // Determine if it's a post or comment based on context
                const isPost = element.closest('.post-card') || element.closest('.post-detail');
                const isComment = element.closest('.comment') || element.closest('.reply');

                let target = 'post'; // default
                if (isComment && !isPost) {
                    target = 'comment';
                } else if (isPost) {
                    target = 'post';
                }

                console.log(`Refreshing ${target} ${id} reaction counts`);
                this.loadReactionCounts(parseInt(id), target);
            }
        });
    }

    // Manual function to force refresh all reaction counts (for debugging)
    forceRefreshAllReactionCounts() {
        console.log('Force refreshing all reaction counts...');

        // Refresh post reaction counts
        this.posts.forEach(post => {
            console.log(`Force refreshing post ${post.id}`);
            this.loadReactionCounts(post.id, 'post');
        });

        // Refresh any visible comment reaction counts
        const commentElements = document.querySelectorAll('[data-comment-id]');
        commentElements.forEach(element => {
            const commentId = element.getAttribute('data-comment-id');
            if (commentId) {
                console.log(`Force refreshing comment ${commentId}`);
                this.loadReactionCounts(parseInt(commentId), 'comment');
            }
        });

        console.log('Force refresh completed');
    }

    async loadCommentCounts(postId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/comments/get?post_id=${postId}`);

            if (response.ok) {
                const comments = await response.json();
                const totalComments = this.countTotalComments(comments);

                const countElement = document.getElementById(`comments-count-${postId}`);
                if (countElement) {
                    countElement.textContent = totalComments;
                }
            }
        } catch (error) {
            console.error('Failed to load comment counts:', error);
        }
    }

    countTotalComments(comments) {
        if (!Array.isArray(comments)) return 0;

        let total = comments.length; // Count top-level comments

        // Count replies
        comments.forEach(comment => {
            if (comment.replies && Array.isArray(comment.replies)) {
                total += comment.replies.length;
            }
        });

        return total;
    }

    // Comments Methods
    async openPostDetails(postId) {
        this.showLoading();

        try {
            // Load post details and comments
            const post = this.posts.find(p => p.id === postId);
            if (!post) {
                this.showNotification('Post not found', 'error');
                return;
            }

            // Load comments with better error handling
            let comments = [];
            try {
                const commentsResponse = await fetch(`${API_BASE_URL}/api/comments/get?post_id=${postId}`, {
                    credentials: 'include'
                });

                if (commentsResponse.ok) {
                    const commentsData = await commentsResponse.json();
                    // Ensure comments is always an array
                    comments = Array.isArray(commentsData) ? commentsData : [];
                } else {
                    console.warn('Failed to load comments:', commentsResponse.status);
                    comments = [];
                }
            } catch (commentsError) {
                console.error('Error loading comments:', commentsError);
                comments = [];
            }

            this.renderPostModal(post, comments);
            this.showModal('post-modal');

            // Ensure reaction counts are loaded after modal is fully shown
            setTimeout(() => {
                this.refreshAllVisibleReactionCounts();
            }, 500);
        } catch (error) {
            console.error('Failed to load post details:', error);
            this.showNotification('Failed to load post details', 'error');
        } finally {
            this.hideLoading();
        }
    }

    renderPostModal(post, comments) {
        const modalBody = document.getElementById('post-modal-body');

        // Ensure comments is always an array
        comments = Array.isArray(comments) ? comments : [];

        const postCategories = (post.category_ids && Array.isArray(post.category_ids)) ?
            post.category_ids.map(id => this.allCategories.find(cat => cat.id === id)?.name).filter(Boolean) : [];

        modalBody.innerHTML = `
            <div class="post-detail" data-post-id="${post.id}">
                <div class="post-header">
                    <img class="post-avatar" src="${this.getAvatarUrl(post.avatar_url, post.username)}" alt="${post.username}">
                    <div class="post-meta">
                        <div class="post-author">${post.username}</div>
                        <div class="post-date">${this.formatDate(post.created_at)}</div>
                    </div>
                </div>

                <h2 class="post-title">${this.escapeHtml(post.title)}</h2>
                <div class="post-content">${this.escapeHtml(post.content)}</div>

                ${post.image_url ? `<img class="post-image" src="${post.image_url}" alt="Post image">` : ''}

                ${postCategories.length > 0 ? `
                    <div class="post-categories">
                        ${postCategories.map(cat => `<span class="post-category">${cat}</span>`).join('')}
                    </div>
                ` : ''}

                <div class="post-footer">
                    <div class="reaction-buttons">
                        <button class="reaction-btn like" onclick="app.toggleReaction(${post.id}, 'like', 'post')">
                            <span>👍</span>
                            <span id="modal-likes-count-${post.id}">0</span>
                        </button>
                        <button class="reaction-btn dislike" onclick="app.toggleReaction(${post.id}, 'dislike', 'post')">
                            <span>👎</span>
                            <span id="modal-dislikes-count-${post.id}">0</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="comments-section">
                <h3>Comments (${comments.length})</h3>

                ${this.currentUser ? `
                    <form class="comment-form" onsubmit="app.handleCreateComment(event, ${post.id})">
                        <textarea placeholder="Write a comment..." required></textarea>
                        <button type="submit" class="btn btn-primary">Post Comment</button>
                    </form>
                ` : '<p class="login-prompt">Please log in to comment.</p>'}

                <div class="comments-list">
                    ${comments.map(comment => this.createCommentElement(comment)).join('')}
                </div>
            </div>
        `;

        // Load reaction counts after a delay to ensure DOM is ready
        setTimeout(() => {
            this.loadReactionCounts(post.id, 'post');

            // Load reaction counts for comments
            if (Array.isArray(comments)) {
                comments.forEach(comment => {
                    if (comment && comment.id) {
                        // Check if modal element exists before loading
                        const modalLikesElement = document.getElementById(`modal-likes-count-${comment.id}`);
                        if (modalLikesElement) {
                            this.loadReactionCounts(comment.id, 'comment');
                        } else {
                            console.warn(`Comment ${comment.id} modal likes element not found, retrying...`);
                            // Retry after a longer delay
                            setTimeout(() => {
                                this.loadReactionCounts(comment.id, 'comment');
                            }, 500);
                        }

                        if (comment.replies && Array.isArray(comment.replies)) {
                            comment.replies.forEach(reply => {
                                if (reply && reply.id) {
                                    const replyModalLikesElement = document.getElementById(`modal-likes-count-${reply.id}`);
                                    if (replyModalLikesElement) {
                                        this.loadReactionCounts(reply.id, 'comment');
                                    } else {
                                        console.warn(`Reply ${reply.id} modal likes element not found, retrying...`);
                                        setTimeout(() => {
                                            this.loadReactionCounts(reply.id, 'comment');
                                        }, 500);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        }, 300);
    }

    createCommentElement(comment) {
        if (!comment || !comment.id) {
            return '';
        }

        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <img class="comment-avatar" src="${comment.avatar_url || ''}" alt="${comment.username || 'User'}">
                    <div class="comment-meta">
                        <div class="comment-author">${comment.username || 'Unknown User'}</div>
                        <div class="comment-date">${this.formatDate(comment.created_at)}</div>
                    </div>
                    ${this.currentUser && this.currentUser.id === comment.user_id ?
                        `<button class="btn btn-sm btn-danger" onclick="app.deleteComment(${comment.id})">Delete</button>` : ''}
                </div>

                <div class="comment-content">${this.escapeHtml(comment.content)}</div>

                <div class="comment-footer">
                    <div class="reaction-buttons">
                        <button class="reaction-btn like" onclick="app.toggleReaction(${comment.id}, 'like', 'comment')">
                            <span>👍</span>
                            <span id="modal-likes-count-${comment.id}">0</span>
                        </button>
                        <button class="reaction-btn dislike" onclick="app.toggleReaction(${comment.id}, 'dislike', 'comment')">
                            <span>👎</span>
                            <span id="modal-dislikes-count-${comment.id}">0</span>
                        </button>
                        ${this.currentUser && this.currentUser.id !== comment.user_id ? `<button class="btn btn-sm btn-secondary" onclick="app.showReplyForm(${comment.id})">Reply</button>` : ''}
                    </div>
                </div>

                <div class="reply-form-container" id="reply-form-${comment.id}"></div>

                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="replies">
                        ${comment.replies.map(reply => `
                            <div class="reply" data-comment-id="${reply.id}">
                                <div class="comment-header">
                                    <img class="comment-avatar" src="${reply.avatar_url}" alt="${reply.username}">
                                    <div class="comment-meta">
                                        <div class="comment-author">${reply.username}</div>
                                        <div class="comment-date">${this.formatDate(reply.created_at)}</div>
                                    </div>
                                    ${this.currentUser && this.currentUser.id === reply.user_id ?
                                        `<button class="btn btn-sm btn-danger" onclick="app.deleteComment(${reply.id})">Delete</button>` : ''}
                                </div>

                                <div class="comment-content">${this.escapeHtml(reply.content)}</div>

                                <div class="comment-footer">
                                    <div class="reaction-buttons">
                                        <button class="reaction-btn like" onclick="app.toggleReaction(${reply.id}, 'like', 'comment')">
                                            <span>👍</span>
                                            <span id="modal-likes-count-${reply.id}">0</span>
                                        </button>
                                        <button class="reaction-btn dislike" onclick="app.toggleReaction(${reply.id}, 'dislike', 'comment')">
                                            <span>👎</span>
                                            <span id="modal-dislikes-count-${reply.id}">0</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    async handleCreateComment(event, postId) {
        event.preventDefault();

        const form = event.target;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            this.showNotification('Comment cannot be empty', 'warning');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/comments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    post_id: postId,
                    content: content
                })
            });

            if (response.ok) {
                this.showNotification('Comment posted successfully!', 'success');
                textarea.value = '';
                // Reload post details to show new comment
                await this.openPostDetails(postId);
                // Update comment count in the main posts view
                await this.loadCommentCounts(postId);
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to post comment', 'error');
            }
        } catch (error) {
            console.error('Create comment error:', error);
            this.showNotification('Failed to post comment', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/comments/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ comment_id: commentId })
            });

            if (response.ok) {
                this.showNotification('Comment deleted successfully', 'success');
                // Remove comment from DOM
                const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentElement) {
                    commentElement.remove();
                }
                // Update comment count in the main posts view
                const postDetailElement = document.querySelector('.post-detail');
                const postId = postDetailElement ? parseInt(postDetailElement.dataset.postId) :
                             this.posts.find(p => p.id)?.id;
                if (postId) {
                    await this.loadCommentCounts(postId);
                }
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to delete comment', 'error');
            }
        } catch (error) {
            console.error('Delete comment error:', error);
            this.showNotification('Failed to delete comment', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showReplyForm(commentId) {
        const container = document.getElementById(`reply-form-${commentId}`);

        if (container.innerHTML) {
            // Hide form if already shown
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <form class="reply-form" onsubmit="app.handleCreateReply(event, ${commentId})">
                <textarea placeholder="Write a reply..." required></textarea>
                <div class="reply-form-actions">
                    <button type="submit" class="btn btn-primary btn-sm">Post Reply</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="app.hideReplyForm(${commentId})">Cancel</button>
                </div>
            </form>
        `;
    }

    hideReplyForm(commentId) {
        const container = document.getElementById(`reply-form-${commentId}`);
        container.innerHTML = '';
    }

    async handleCreateReply(event, parentCommentId) {
        event.preventDefault();

        const form = event.target;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();

        if (!content) {
            this.showNotification('Reply cannot be empty', 'warning');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${API_BASE_URL}/api/comment/reply/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    parent_comment_id: parentCommentId,
                    content: content
                })
            });

            if (response.ok) {
                this.showNotification('Reply posted successfully!', 'success');
                this.hideReplyForm(parentCommentId);
                // Reload the current post to show new reply
                const postDetailElement = document.querySelector('.post-detail');
                const postId = postDetailElement ? parseInt(postDetailElement.dataset.postId) :
                             this.posts.find(p => p.id)?.id;

                console.log('Reply success - trying to reload post:', postId);

                if (postId) {
                    await this.openPostDetails(postId);
                    // Update comment count in the main posts view
                    await this.loadCommentCounts(postId);
                } else {
                    console.error('Could not find post ID to reload');
                    this.showNotification('Reply posted, but could not refresh view', 'warning');
                }
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to post reply', 'error');
            }
        } catch (error) {
            console.error('Create reply error:', error);
            this.showNotification('Failed to post reply', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Edit Post Methods
    async editPost(postId) {
        try {
            // Find the post in the current posts array
            const post = this.posts.find(p => p.id === postId);
            if (!post) {
                this.showNotification('Post not found', 'error');
                return;
            }

            // Check if user owns this post
            if (!this.currentUser || this.currentUser.id !== post.user_id) {
                this.showNotification('You can only edit your own posts', 'error');
                return;
            }

            // Populate the edit form
            this.populateEditForm(post);

            // Show the edit modal
            this.showModal('edit-post-modal');
        } catch (error) {
            console.error('Edit post error:', error);
            this.showNotification('Failed to load post for editing', 'error');
        }
    }

    populateEditForm(post) {
        // Set form values
        document.getElementById('edit-post-id').value = post.id;
        document.getElementById('edit-post-title').value = post.title;
        document.getElementById('edit-post-content').value = post.content;

        // Reset selected categories for editing
        this.editSelectedCategories = [];

        // Populate selected categories if post has categories
        if (post.category_ids && post.category_ids.length > 0) {
            post.category_ids.forEach(catId => {
                const category = this.allCategories.find(cat => cat.id === catId);
                if (category) {
                    this.editSelectedCategories.push({
                        id: category.id,
                        name: category.name
                    });
                }
            });
        }

        // Render selected categories
        this.renderEditSelectedCategories();

        // Populate category dropdown
        this.populateEditCategoryDropdown();

        // Show current image if exists
        this.showCurrentImagePreview(post.image_url);
    }

    populateEditCategoryDropdown() {
        const dropdown = document.getElementById('edit-category-dropdown');
        if (!dropdown) return;

        // Clear existing options except the first one
        dropdown.innerHTML = '<option value="">Select a category to add...</option>';

        // Add categories as options, disable already selected ones
        this.allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;

            // Disable if already selected
            const isSelected = this.editSelectedCategories.some(selected => selected.id == category.id);
            if (isSelected) {
                option.disabled = true;
                option.textContent += ' (already selected)';
            }

            dropdown.appendChild(option);
        });
    }

    renderEditSelectedCategories() {
        const container = document.getElementById('edit-selected-categories');
        container.innerHTML = '';

        this.editSelectedCategories.forEach(category => {
            const tag = document.createElement('div');
            tag.className = 'category-tag';
            tag.innerHTML = `
                ${category.name}
                <span class="remove" onclick="app.removeEditCategory(${category.id})">&times;</span>
            `;
            container.appendChild(tag);
        });

        // Refresh dropdown to update disabled states
        this.populateEditCategoryDropdown();
    }

    addEditCategoryFromDropdown(categoryId) {
        const category = this.allCategories.find(cat => cat.id == categoryId);
        if (!category) return;

        // Check if category is already selected
        if (!this.editSelectedCategories.some(selected => selected.id == categoryId)) {
            this.editSelectedCategories.push({
                id: category.id,
                name: category.name
            });
            this.renderEditSelectedCategories();
        }
    }

    removeEditCategory(categoryId) {
        this.editSelectedCategories = this.editSelectedCategories.filter(cat => cat.id != categoryId);
        this.renderEditSelectedCategories();
    }

    showCurrentImagePreview(imageUrl) {
        const container = document.getElementById('current-image-preview');
        container.innerHTML = '';

        if (imageUrl) {
            container.innerHTML = `
                <div class="image-info">Current image:</div>
                <img src="${imageUrl}" alt="Current post image">
                <div class="remove-image">
                    <button type="button" class="btn btn-sm btn-danger" onclick="app.removeCurrentImage()">
                        Remove Current Image
                    </button>
                </div>
            `;
        }
    }

    removeCurrentImage() {
        document.getElementById('current-image-preview').innerHTML = '';
        // Add a hidden input to indicate image should be removed
        const form = document.getElementById('edit-post-form');
        let removeInput = form.querySelector('input[name="remove_image"]');
        if (!removeInput) {
            removeInput = document.createElement('input');
            removeInput.type = 'hidden';
            removeInput.name = 'remove_image';
            removeInput.value = 'true';
            form.appendChild(removeInput);
        }
    }

    showCategoriesView() {
        const container = document.getElementById('posts-container');
        container.innerHTML = `
            <div class="categories-view">
                <h3>Forum Categories</h3>
                <div class="categories-grid">
                    ${this.allCategories.map(category => `
                        <div class="category-card" onclick="app.filterByCategory(${category.id})">
                            <h4>${category.name}</h4>
                            <p>Click to view posts in this category</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Enhanced error handling for network requests
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                credentials: 'include',
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Please check your connection');
            }
            throw error;
        }
    }

    // Form validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    validateUsername(username) {
        return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
    }

    // Enhanced form validation
    validateRegistrationForm(formData) {
        const errors = [];

        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const avatar = formData.get('avatar');

        if (!this.validateUsername(username)) {
            errors.push('Username must be at least 3 characters and contain only letters, numbers, and underscores');
        }

        if (!this.validateEmail(email)) {
            errors.push('Please enter a valid email address');
        }

        if (!this.validatePassword(password)) {
            errors.push('Password must be at least 6 characters long');
        }

        if (!avatar || avatar.size === 0) {
            errors.push('Profile picture is required. Please upload an image file');
        } else if (avatar.size > 5 * 1024 * 1024) { // 5MB limit
            errors.push('Profile picture must be smaller than 5MB');
        } else if (!['image/jpeg', 'image/png', 'image/gif'].includes(avatar.type)) {
            errors.push('Profile picture must be a JPG, PNG, or GIF image');
        }

        return errors;
    }

    // Add loading states to buttons
    setButtonLoading(button, loading = true) {
        if (loading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    }

    async handleEditPost(e) {
        e.preventDefault();

        // Validate that at least one category is selected
        if (this.editSelectedCategories.length === 0) {
            this.showNotification('Please select at least one category', 'warning');
            return;
        }

        this.showLoading();

        const formData = new FormData(e.target);

        // Add selected categories
        this.editSelectedCategories.forEach(category => {
            formData.append('category_ids[]', category.id);
        });

        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/update`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                this.showNotification('Post updated successfully!', 'success');
                this.hideModal('edit-post-modal');
                this.editSelectedCategories = [];
                await this.loadPosts();
            } else {
                const error = await response.text();
                this.showNotification(error || 'Failed to update post', 'error');
            }
        } catch (error) {
            console.error('Update post error:', error);
            this.showNotification('Failed to update post', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Enhanced post loading with better error handling
    async loadPostsEnhanced() {
        this.showLoading();

        try {
            let url = `/api/posts?page=${this.currentPage}&limit=${this.postsPerPage}`;

            // Add filters to URL
            if (this.currentCategoryFilter) {
                url += `&category=${this.currentCategoryFilter}`;
            }

            if (this.currentSearchQuery) {
                url += `&search=${encodeURIComponent(this.currentSearchQuery)}`;
            }

            if (this.currentFilter && this.currentFilter !== 'all') {
                url += `&filter=${this.currentFilter}`;
            }

            const response = await this.makeRequest(url);
            const postsData = await response.json();
            this.posts = Array.isArray(postsData) ? postsData : [];
            this.renderPosts();

        } catch (error) {
            console.error('Failed to load posts:', error);
            this.posts = []; // Ensure posts is always an array
            this.showNotification(error.message || 'Failed to load posts', 'error');

            // Show fallback content
            const container = document.getElementById('posts-container');
            container.innerHTML = `
                <div class="error-state">
                    <h3>Unable to load posts</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="app.loadPosts()">Try Again</button>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }

    // Replace the original loadPosts method
    async loadPosts() {
        return this.loadPostsEnhanced();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ForumApp();

    // Add debug functions to window for testing
    window.debugRefreshReactions = () => {
        window.app.forceRefreshAllReactionCounts();
    };

    window.debugLoadReactions = (id, target) => {
        window.app.loadReactionCounts(id, target);
    };

    window.debugTestLike = async (postId) => {
        console.log('=== DEBUGGING LIKE FUNCTIONALITY ===');
        console.log('1. Testing post ID:', postId);

        // Check if user is logged in
        console.log('2. Current user:', window.app.currentUser);

        // Check if DOM elements exist
        const likesElement = document.getElementById(`likes-count-${postId}`);
        const dislikesElement = document.getElementById(`dislikes-count-${postId}`);
        console.log('3. Likes element exists:', !!likesElement);
        console.log('4. Dislikes element exists:', !!dislikesElement);

        // Test API call directly
        try {
            console.log('5. Testing API call...');
            const response = await fetch(`${API_BASE_URL}/api/likes/reactions?post_id=${postId}`);
            console.log('6. API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('7. API response data:', data);

                // Try to update elements
                if (likesElement) {
                    likesElement.textContent = data.likes || 0;
                    console.log('8. Updated likes element to:', data.likes || 0);
                } else {
                    console.log('8. ERROR: Likes element not found!');
                }

                if (dislikesElement) {
                    dislikesElement.textContent = data.dislikes || 0;
                    console.log('9. Updated dislikes element to:', data.dislikes || 0);
                } else {
                    console.log('9. ERROR: Dislikes element not found!');
                }
            } else {
                console.log('7. ERROR: API call failed');
            }
        } catch (error) {
            console.log('5. ERROR: API call exception:', error);
        }

        console.log('=== DEBUG TEST COMPLETE ===');
    };
});
