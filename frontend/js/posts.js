// Posts module for the forum application

class PostsManager {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    setupEventListeners() {
        // Create post button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => {
                auth.requireAuth(() => this.showCreatePostModal());
            });
        }

        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Posts container for event delegation
        const postsContainer = document.getElementById('postsContainer');
        if (postsContainer) {
            utils.delegate(postsContainer, '.post-title', 'click', (e) => {
                const postId = e.target.closest('.post-card').dataset.postId;
                this.showPostDetail(postId);
            });

            utils.delegate(postsContainer, '.like-btn', 'click', (e) => {
                e.stopPropagation();
                const postId = e.target.closest('.post-card').dataset.postId;
                auth.requireAuth(() => this.togglePostLike(postId));
            });

            utils.delegate(postsContainer, '.comment-btn', 'click', (e) => {
                e.stopPropagation();
                const postId = e.target.closest('.post-card').dataset.postId;
                this.showPostDetail(postId);
            });

            utils.delegate(postsContainer, '.delete-post-btn', 'click', (e) => {
                e.stopPropagation();
                const postId = e.target.closest('.post-card').dataset.postId;
                this.deletePost(postId);
            });
        }
    }

    async loadCategories() {
        try {
            const categories = await apiWrapper.getCategories();
            this.categories = categories || [];
            this.renderCategoriesInSidebar();
            this.renderCategoriesInForm();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadPosts(filter = this.currentFilter, page = 1) {
        this.currentFilter = filter;
        this.currentPage = page;
        
        utils.showLoading('loadingPosts');
        
        try {
            const filters = {};
            
            // Apply filters based on current filter
            if (filter === 'my-posts' && auth.isUserAuthenticated()) {
                filters.user_id = auth.getCurrentUser().id;
            } else if (filter === 'liked' && auth.isUserAuthenticated()) {
                filters.liked_by = auth.getCurrentUser().id;
            }
            
            const posts = await apiWrapper.getPosts(page, this.postsPerPage, filters);
            this.posts = posts || [];
            this.renderPosts();
        } catch (error) {
            console.error('Failed to load posts:', error);
            this.posts = [];
            this.renderPosts();
        } finally {
            utils.hideLoading('loadingPosts');
        }
    }

    renderPosts() {
        const container = document.getElementById('postsContainer');
        if (!container) return;

        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments fa-3x" style="color: #ddd; margin-bottom: 20px;"></i>
                    <h3>No posts found</h3>
                    <p>Be the first to create a post!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => this.createPostCard(post)).join('');
    }

    createPostCard(post) {
        const avatarColor = utils.generateAvatarColor(post.username || 'Anonymous');
        const avatarInitials = utils.getAvatarInitials(post.username || 'Anonymous');
        const isOwner = auth.isUserAuthenticated() && auth.getCurrentUser().id === post.user_id;
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-avatar" style="background-color: ${avatarColor}">
                        ${avatarInitials}
                    </div>
                    <div class="post-meta">
                        <div class="post-author">${utils.escapeHtml(post.username || 'Anonymous')}</div>
                        <div class="post-time">${utils.formatDate(post.created_at)}</div>
                    </div>
                    ${post.category_name ? `<span class="post-category">${utils.escapeHtml(post.category_name)}</span>` : ''}
                    ${isOwner ? `
                        <button class="action-btn delete-post-btn" title="Delete post">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="post-content">
                    <h3 class="post-title">${utils.escapeHtml(post.title)}</h3>
                    <p class="post-text">${utils.escapeHtml(utils.truncateText(post.content, 200))}</p>
                </div>
                <div class="post-actions">
                    <button class="action-btn like-btn ${post.user_liked ? 'liked' : ''}" data-post-id="${post.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${post.likes_count || 0}</span>
                    </button>
                    <button class="action-btn comment-btn">
                        <i class="fas fa-comment"></i>
                        <span>${post.comments_count || 0}</span>
                    </button>
                    <button class="action-btn share-btn" onclick="utils.copyToClipboard('${window.location.origin}#post-${post.id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                </div>
            </div>
        `;
    }

    renderCategoriesInSidebar() {
        const container = document.getElementById('categoriesList');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = '<p style="color: #666; font-size: 0.9rem;">No categories yet</p>';
            return;
        }

        container.innerHTML = this.categories.map(category => `
            <div class="category-item" data-category-id="${category.id}">
                <span>${utils.escapeHtml(category.name)}</span>
                <span class="category-count">${category.posts_count || 0}</span>
            </div>
        `).join('');

        // Add click handlers for category filtering
        container.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.dataset.categoryId;
                this.filterByCategory(categoryId);
            });
        });
    }

    renderCategoriesInForm() {
        const select = document.getElementById('postCategory');
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select a category (optional)</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    async handleCreatePost(event) {
        event.preventDefault();
        
        const title = document.getElementById('postTitle').value.trim();
        const content = document.getElementById('postContent').value.trim();
        const categoryId = document.getElementById('postCategory').value;

        if (!title || !content) {
            toast.error('Please fill in all required fields');
            return;
        }

        const postData = {
            title,
            content,
            category_id: categoryId ? parseInt(categoryId) : null
        };

        try {
            await apiWrapper.createPost(postData);
            modal.close();
            this.clearCreatePostForm();
            this.loadPosts(); // Reload posts to show the new one
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    handleFilterChange(event) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        event.target.classList.add('active');
        const filter = event.target.dataset.filter;
        this.loadPosts(filter);
    }

    async togglePostLike(postId) {
        try {
            await apiWrapper.toggleLike({ post_id: parseInt(postId) });
            
            // Update the UI optimistically
            const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
            if (likeBtn) {
                const isLiked = likeBtn.classList.contains('liked');
                const countSpan = likeBtn.querySelector('span');
                let count = parseInt(countSpan.textContent) || 0;
                
                if (isLiked) {
                    likeBtn.classList.remove('liked');
                    count = Math.max(0, count - 1);
                } else {
                    likeBtn.classList.add('liked');
                    count += 1;
                }
                
                countSpan.textContent = count;
            }
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            await apiWrapper.deletePost(parseInt(postId));
            this.loadPosts(); // Reload posts
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async showPostDetail(postId) {
        // This will be implemented in the comments module
        if (window.comments && window.comments.showPostDetail) {
            window.comments.showPostDetail(postId);
        }
    }

    showCreatePostModal() {
        modal.open('createPostModal');
        // Focus on title field
        setTimeout(() => {
            const titleField = document.getElementById('postTitle');
            if (titleField) titleField.focus();
        }, 100);
    }

    clearCreatePostForm() {
        const form = document.getElementById('createPostForm');
        if (form) form.reset();
    }

    async filterByCategory(categoryId) {
        const category = this.categories.find(c => c.id == categoryId);
        if (category) {
            // Use toast.success instead of toast.info for compatibility
            toast.success(`Filtering by category: ${category.name}`);

            // Update current filter to track category filtering
            this.currentFilter = `category-${categoryId}`;

            // Load posts with category filter
            await this.loadPostsByCategory(categoryId);
        }
    }

    async loadPostsByCategory(categoryId) {
        utils.showLoading('loadingPosts');

        try {
            const filters = { category_id: categoryId };
            const posts = await apiWrapper.getPosts(1, this.postsPerPage, filters);
            this.posts = posts || [];
            this.renderPosts();
        } catch (error) {
            console.error('Failed to load posts by category:', error);
            this.posts = [];
            this.renderPosts();
        } finally {
            utils.hideLoading('loadingPosts');
        }
    }
}

// Create global posts instance
window.posts = new PostsManager();
