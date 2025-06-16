// Posts Management

class Posts {
    constructor() {
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.currentFilter = 'all';
        this.currentCategory = '';
        this.posts = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPosts();
    }

    setupEventListeners() {
        // Create post button
        Utils.$('#create-post-btn')?.addEventListener('click', () => this.showCreatePostModal());

        // Create post form
        Utils.$('#create-post-form')?.addEventListener('submit', (e) => this.handleCreatePost(e));

        // Filter buttons
        Utils.$('#all-posts-filter')?.addEventListener('click', () => this.setFilter('all'));
        Utils.$('#my-posts-filter')?.addEventListener('click', () => this.setFilter('my'));
        Utils.$('#liked-posts-filter')?.addEventListener('click', () => this.setFilter('liked'));

        // Category filter
        Utils.$('#category-filter')?.addEventListener('change', (e) => this.setCategoryFilter(e.target.value));

        // Pagination
        Utils.$('#prev-page')?.addEventListener('click', () => this.previousPage());
        Utils.$('#next-page')?.addEventListener('click', () => this.nextPage());
    }

    // Show create post modal
    async showCreatePostModal() {
        if (!AuthHelpers.requireAuth()) return;

        // Load categories for the form
        await this.loadCategoriesForForm();
        Utils.openModal('#create-post-modal');
    }

    // Load categories for create post form
    async loadCategoriesForForm() {
        try {
            const categories = await api.getCategories();
            const container = Utils.$('#categories-container');
            
            if (container) {
                container.innerHTML = categories.map(category => `
                    <label class="category-checkbox">
                        <input type="checkbox" name="categories" value="${Utils.escapeHtml(category.name)}">
                        <span>${Utils.escapeHtml(category.name)}</span>
                    </label>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Handle create post form submission
    async handleCreatePost(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = Utils.getFormData(form);

        // Validate form data
        if (!formData.title || formData.title.trim().length < 3) {
            Utils.showError('Title must be at least 3 characters long');
            return;
        }

        if (!formData.content || formData.content.trim().length < 10) {
            Utils.showError('Content must be at least 10 characters long');
            return;
        }

        // Get selected categories
        const selectedCategories = Array.from(form.querySelectorAll('input[name="categories"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedCategories.length === 0) {
            Utils.showError('Please select at least one category');
            return;
        }

        // Validate image file if provided
        const imageFile = form.querySelector('#post-image').files[0];
        if (imageFile) {
            const validation = ApiHelpers.validateFile(imageFile);
            if (!validation.valid) {
                Utils.showError(validation.error);
                return;
            }
        }

        try {
            Utils.showLoading();
            
            await api.createPost({
                title: formData.title.trim(),
                content: formData.content.trim(),
                categories: selectedCategories,
                image: imageFile
            });

            Utils.showSuccess('Post created successfully!');
            Utils.closeModal('#create-post-modal');
            Utils.clearForm(form);
            
            // Reload posts
            this.loadPosts();

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Load posts with current filters
    async loadPosts() {
        try {
            Utils.showLoading();
            
            const params = ApiHelpers.getPaginationParams(this.currentPage, this.postsPerPage);
            
            // Add filter parameters
            if (this.currentCategory) {
                params.category = this.currentCategory;
            }
            
            if (this.currentFilter === 'my' && AuthHelpers.isLoggedIn()) {
                params.user_id = AuthHelpers.getCurrentUser().id;
            } else if (this.currentFilter === 'liked' && AuthHelpers.isLoggedIn()) {
                params.liked_by = AuthHelpers.getCurrentUser().id;
            }

            this.posts = await api.getPosts(params);
            this.renderPosts();
            this.updatePagination();

        } catch (error) {
            ApiHelpers.handleError(error);
            this.renderEmptyState();
        } finally {
            Utils.hideLoading();
        }
    }

    // Render posts list
    renderPosts() {
        const container = Utils.$('#posts-list');
        if (!container) return;

        if (this.posts.length === 0) {
            this.renderEmptyState();
            return;
        }

        container.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
        
        // Add click handlers for post cards
        container.querySelectorAll('.post-card').forEach((card, index) => {
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking on action buttons
                if (!e.target.closest('.post-actions')) {
                    this.showPostDetail(this.posts[index]);
                }
            });
        });
    }

    // Render individual post card
    renderPostCard(post) {
        const formattedPost = ApiHelpers.formatPost(post);
        const isOwner = AuthHelpers.isOwner(post.user_id);
        
        return `
            <article class="post-card" data-post-id="${post.id}">
                <header class="post-header">
                    <img src="${formattedPost.avatar_url}" alt="${Utils.escapeHtml(post.username)}" class="post-avatar">
                    <div class="post-meta">
                        <div class="post-author">${Utils.escapeHtml(post.username)}</div>
                        <div class="post-date">${formattedPost.created_at}</div>
                    </div>
                    ${isOwner ? `
                        <div class="action-buttons">
                            <button class="btn btn-small btn-danger" onclick="Posts.deletePost(${post.id})">Delete</button>
                        </div>
                    ` : ''}
                </header>
                
                <h2 class="post-title">${Utils.escapeHtml(post.title)}</h2>
                <div class="post-content">${Utils.escapeHtml(formattedPost.content_preview)}</div>
                
                ${post.image_url ? `
                    <img src="${formattedPost.image_url}" alt="Post image" class="post-image">
                ` : ''}
                
                ${post.category_ids && post.category_ids.length > 0 ? `
                    <div class="post-categories">
                        ${post.category_ids.map(categoryId => `
                            <span class="category-tag">Category ${categoryId}</span>
                        `).join('')}
                    </div>
                ` : ''}
                
                <footer class="post-actions">
                    <div class="post-stats">
                        <span class="stat-item">
                            <span>💬</span>
                            <span id="comments-count-${post.id}">0</span>
                        </span>
                    </div>
                    
                    <div class="like-buttons" data-post-id="${post.id}">
                        <!-- Like buttons will be loaded by likes.js -->
                    </div>
                </footer>
            </article>
        `;
    }

    // Show post detail modal
    async showPostDetail(post) {
        try {
            Utils.showLoading();
            
            // Load full post details and comments
            const [comments] = await Promise.all([
                api.getComments(post.id)
            ]);

            const modalContent = Utils.$('#post-detail-content');
            if (modalContent) {
                modalContent.innerHTML = this.renderPostDetail(post, comments);
                Utils.openModal('#post-detail-modal');
                
                // Initialize comments and likes for this post
                if (window.Comments) {
                    window.Comments.initPostComments(post.id);
                }
                if (window.Likes) {
                    window.Likes.initPostLikes(post.id);
                }
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Render post detail view
    renderPostDetail(post, comments) {
        const formattedPost = ApiHelpers.formatPost(post);
        const isOwner = AuthHelpers.isOwner(post.user_id);
        
        return `
            <article class="post-detail">
                <header class="post-header">
                    <img src="${formattedPost.avatar_url}" alt="${Utils.escapeHtml(post.username)}" class="post-avatar">
                    <div class="post-meta">
                        <div class="post-author">${Utils.escapeHtml(post.username)}</div>
                        <div class="post-date">${formattedPost.created_at}</div>
                    </div>
                    ${isOwner ? `
                        <div class="action-buttons">
                            <button class="btn btn-small btn-danger" onclick="Posts.deletePost(${post.id})">Delete</button>
                        </div>
                    ` : ''}
                </header>
                
                <h1 class="post-title">${Utils.escapeHtml(post.title)}</h1>
                <div class="post-content">${Utils.escapeHtml(post.content)}</div>
                
                ${post.image_url ? `
                    <img src="${formattedPost.image_url}" alt="Post image" class="post-image">
                ` : ''}
                
                <footer class="post-actions">
                    <div class="like-buttons" data-post-id="${post.id}">
                        <!-- Like buttons will be loaded by likes.js -->
                    </div>
                </footer>
                
                <section class="comments-section" data-post-id="${post.id}">
                    <!-- Comments will be loaded by comments.js -->
                </section>
            </article>
        `;
    }

    // Delete post
    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            Utils.showLoading();
            await api.deletePost(postId);
            Utils.showSuccess('Post deleted successfully');
            this.loadPosts();
        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        
        // Update filter button states
        Utils.$$('#user-filters button').forEach(btn => btn.classList.remove('active'));
        Utils.$(`#${filter}-posts-filter`)?.classList.add('active');
        
        this.loadPosts();
    }

    // Set category filter
    setCategoryFilter(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.loadPosts();
    }

    // Pagination
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadPosts();
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadPosts();
    }

    updatePagination() {
        const pageInfo = Utils.$('#page-info');
        const prevBtn = Utils.$('#prev-page');
        const nextBtn = Utils.$('#next-page');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.posts.length < this.postsPerPage;
        }
    }

    // Render empty state
    renderEmptyState() {
        const container = Utils.$('#posts-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts found</h3>
                    <p>There are no posts matching your current filters.</p>
                    ${AuthHelpers.isLoggedIn() ? `
                        <button class="btn btn-primary" onclick="Posts.showCreatePostModal()">Create First Post</button>
                    ` : ''}
                </div>
            `;
        }
    }

    // Refresh posts
    refresh() {
        this.loadPosts();
    }
}

// Initialize posts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Posts = new Posts();
});
