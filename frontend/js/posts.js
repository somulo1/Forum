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
        
        const formData = Utils.getFormData(event.target);
        
        if (!formData.title || !formData.content) {
            Utils.showError('Please fill in all required fields');
            return;
        }

        try {
            Utils.showLoading();
            
            const postData = {
                title: formData.title,
                content: formData.content,
                categories: formData.categories || []
            };

            // Add image if provided
            const imageFile = event.target.querySelector('input[name="image"]').files[0];
            if (imageFile) {
                postData.image = imageFile;
            }

            await api.createPost(postData);
            
            Utils.showSuccess('Post created successfully!');
            Utils.closeModal('#create-post-modal');
            Utils.clearForm(event.target);
            
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
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-author">
                        <img src="${post.profile_avatar || '/static/profiles/default.png'}" 
                             alt="${Utils.escapeHtml(post.username)}" class="avatar">
                        <div class="author-info">
                            <span class="username">${Utils.escapeHtml(post.username)}</span>
                            <span class="post-date">${formattedPost.formattedDate}</span>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="post-actions">
                            <button class="btn btn-sm btn-outline" onclick="Posts.editPost(${post.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="Posts.deletePost(${post.id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-content">
                    <h3 class="post-title">${Utils.escapeHtml(post.title)}</h3>
                    <p class="post-text">${Utils.escapeHtml(formattedPost.truncatedContent)}</p>
                    
                    ${post.image_url ? `
                        <img src="${post.image_url}" alt="Post image" class="post-image">
                    ` : ''}
                    
                    ${post.category_ids && post.category_ids.length > 0 ? `
                        <div class="post-categories">
                            ${post.category_ids.map(catId => `
                                <span class="category-tag">Category ${catId}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <span class="likes-count">👍 ${post.likes || 0}</span>
                        <span class="dislikes-count">👎 ${post.dislikes || 0}</span>
                        <span class="comments-count">💬 ${post.comments_count || 0}</span>
                    </div>
                    
                    ${AuthHelpers.isLoggedIn() ? `
                        <div class="post-reactions">
                            <button class="btn btn-sm like-btn" data-post-id="${post.id}" data-type="like">
                                👍 Like
                            </button>
                            <button class="btn btn-sm dislike-btn" data-post-id="${post.id}" data-type="dislike">
                                👎 Dislike
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
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
            <div class="post-detail">
                <div class="post-header">
                    <div class="post-author">
                        <img src="${post.profile_avatar || '/static/profiles/default.png'}" 
                             alt="${Utils.escapeHtml(post.username)}" class="avatar">
                        <div class="author-info">
                            <span class="username">${Utils.escapeHtml(post.username)}</span>
                            <span class="post-date">${formattedPost.formattedDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="post-content">
                    <h2 class="post-title">${Utils.escapeHtml(post.title)}</h2>
                    <div class="post-text">${Utils.escapeHtml(post.content)}</div>
                    
                    ${post.image_url ? `
                        <img src="${post.image_url}" alt="Post image" class="post-image">
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-reactions" data-post-id="${post.id}">
                        <!-- Likes will be initialized here -->
                    </div>
                </div>
                
                <div class="comments-section">
                    <h3>Comments (${comments.length})</h3>
                    
                    ${AuthHelpers.isLoggedIn() ? `
                        <form class="comment-form" data-post-id="${post.id}">
                            <textarea name="content" placeholder="Write a comment..." required></textarea>
                            <button type="submit" class="btn btn-primary">Post Comment</button>
                        </form>
                    ` : ''}
                    
                    <div class="comments-list" data-post-id="${post.id}">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            </div>
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
