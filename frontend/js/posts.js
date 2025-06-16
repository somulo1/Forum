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
        this.loadPosts(); // Load posts on initialization
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
                e.preventDefault();
                console.log('Like button clicked'); // Debug log
                const postCard = e.target.closest('.post-card');
                if (!postCard) {
                    console.log('Post card not found'); // Debug log
                    return;
                }
                const postId = postCard.dataset.postId;
                console.log('Post ID:', postId); // Debug log
                auth.requireAuth(() => this.togglePostLike(postId));
            });

            utils.delegate(postsContainer, '.delete-post-btn', 'click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const postCard = e.target.closest('.post-card');
                if (!postCard) return;
                const postId = postCard.dataset.postId;
                this.deletePost(postId);
            });

            utils.delegate(postsContainer, '.comment-btn', 'click', (e) => {
                e.stopPropagation();
                const postId = e.target.closest('.post-card').dataset.postId;
                this.toggleInlineComments(postId);
            });

            utils.delegate(postsContainer, '.btn-close-comments', 'click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const button = e.target.closest('.btn-close-comments');
                const postId = button.dataset.postId;
                this.hideInlineComments(postId);
            });
        }

        // Global click handler to close comment sections when clicking outside
        document.addEventListener('click', (e) => {
            // Don't close if clicking inside a comment section or on a comment button
            if (e.target.closest('.inline-comments-section') ||
                e.target.closest('.comment-btn') ||
                e.target.closest('.btn-close-comments')) {
                return;
            }

            // Close all open comment sections
            this.hideAllInlineComments();
        });

        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllInlineComments();
            }
        });
    }

    hideAllInlineComments() {
        document.querySelectorAll('.inline-comments-section').forEach(section => {
            section.style.display = 'none';
        });
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
        console.log('loadPosts called with filter:', filter, 'page:', page); // Debug log
        this.currentFilter = filter;
        this.currentPage = page;

        utils.showLoading('loadingPosts');

        try {
            const filters = {};

            // Apply filters based on current filter
            if (filter === 'my-posts' && auth.isUserAuthenticated()) {
                filters.user_id = auth.getCurrentUser().id;
                console.log('Applying my-posts filter with user_id:', filters.user_id); // Debug log
            } else if (filter === 'liked' && auth.isUserAuthenticated()) {
                filters.liked_by = auth.getCurrentUser().id;
                console.log('Applying liked filter with liked_by:', filters.liked_by); // Debug log
            }

            console.log('Final filters object:', filters); // Debug log
            console.log('Calling API with filters...'); // Debug log

            const posts = await apiWrapper.getPosts(page, this.postsPerPage, filters);
            console.log('API returned posts:', posts ? posts.length : 0, 'posts'); // Debug log

            // Debug: Log post details to see what we're getting
            if (posts && posts.length > 0) {
                console.log('First 3 posts details:');
                posts.slice(0, 3).forEach((post, index) => {
                    console.log(`Post ${index + 1}:`, {
                        id: post.id,
                        title: post.title,
                        author: post.username,
                        user_id: post.user_id,
                        user_liked: post.user_liked,
                        like_count: post.like_count
                    });
                });
            }

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
                        <span>${post.like_count || 0}</span>
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}">
                        <i class="fas fa-comment"></i>
                        <span>${post.comment_count || 0}</span>
                    </button>
                    <button class="action-btn share-btn" onclick="utils.copyToClipboard('${window.location.origin}#post-${post.id}')">
                        <i class="fas fa-share"></i>
                        Share
                    </button>
                </div>

                <!-- Inline Comments Section (initially hidden) -->
                <div class="inline-comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="comments-header">
                        <h4>Comments (${post.comment_count || 0})</h4>
                        <button class="btn-close-comments" data-post-id="${post.id}" onclick="window.posts.hideInlineComments(${post.id}); event.stopPropagation();">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Comment Form -->
                    <div class="comment-form-section">
                        <div class="comment-form" id="commentForm-${post.id}">
                            <textarea
                                id="commentContent-${post.id}"
                                placeholder="Write a comment..."
                                rows="3"
                                class="comment-textarea"
                            ></textarea>
                            <div class="comment-form-actions">
                                <button class="btn btn-primary" onclick="window.posts.submitComment(${post.id})">
                                    <i class="fas fa-paper-plane"></i> Post Comment
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Comments List -->
                    <div class="comments-list" id="commentsList-${post.id}">
                        <div class="loading-comments">
                            <i class="fas fa-spinner fa-spin"></i> Loading comments...
                        </div>
                    </div>
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
            this.loadCategories(); // Refresh categories to update counts
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    handleFilterChange(event) {
        console.log('Filter button clicked:', event.target.textContent); // Debug log
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));

        event.target.classList.add('active');
        const filter = event.target.dataset.filter;
        console.log('Filter value:', filter); // Debug log
        console.log('User authenticated:', auth.isUserAuthenticated()); // Debug log
        if (auth.isUserAuthenticated()) {
            console.log('Current user:', auth.getCurrentUser()); // Debug log
        }
        this.loadPosts(filter);
    }

    async togglePostLike(postId) {
        console.log('togglePostLike called with postId:', postId); // Debug log
        try {
            console.log('Calling API to toggle like...'); // Debug log
            await apiWrapper.toggleLike({ post_id: parseInt(postId) });
            console.log('API call successful'); // Debug log

            // Update the UI optimistically
            const likeBtn = document.querySelector(`[data-post-id="${postId}"] .like-btn`);
            console.log('Like button found:', !!likeBtn); // Debug log
            if (likeBtn) {
                const isLiked = likeBtn.classList.contains('liked');
                const countSpan = likeBtn.querySelector('span');
                let count = parseInt(countSpan.textContent) || 0;

                console.log('Current like status:', isLiked, 'Count:', count); // Debug log

                if (isLiked) {
                    likeBtn.classList.remove('liked');
                    count = Math.max(0, count - 1);
                } else {
                    likeBtn.classList.add('liked');
                    count += 1;
                }

                countSpan.textContent = count;
                console.log('UI updated, new count:', count); // Debug log
            }
        } catch (error) {
            console.error('Error in togglePostLike:', error); // Debug log
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
            this.loadCategories(); // Refresh categories to update counts
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async toggleInlineComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        const isVisible = commentsSection.style.display !== 'none';

        if (isVisible) {
            this.hideInlineComments(postId);
        } else {
            this.showInlineComments(postId);
        }
    }

    async showInlineComments(postId) {
        // Hide any other open comment sections
        document.querySelectorAll('.inline-comments-section').forEach(section => {
            section.style.display = 'none';
        });

        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        // Show the comments section
        commentsSection.style.display = 'block';

        // Load comments for this post
        await this.loadInlineComments(postId);

        // Focus on comment textarea
        const textarea = document.getElementById(`commentContent-${postId}`);
        if (textarea) {
            textarea.focus();
        }
    }

    hideInlineComments(postId) {
        console.log('Hiding comments for post:', postId); // Debug log
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (commentsSection) {
            commentsSection.style.display = 'none';
            console.log('Comments section hidden successfully'); // Debug log
        } else {
            console.log('Comments section not found for post:', postId); // Debug log
        }
    }

    async loadInlineComments(postId) {
        const commentsList = document.getElementById(`commentsList-${postId}`);
        if (!commentsList) return;

        try {
            // Show loading
            commentsList.innerHTML = `
                <div class="loading-comments">
                    <i class="fas fa-spinner fa-spin"></i> Loading comments...
                </div>
            `;



            // Load comments from API
            const comments = await apiWrapper.getPostComments(postId);

            // Render comments
            if (comments && comments.length > 0) {
                commentsList.innerHTML = this.renderInlineComments(comments);
                this.attachCommentEventListeners(postId);
            } else {
                commentsList.innerHTML = `
                    <div class="empty-comments">
                        <i class="fas fa-comments fa-2x" style="color: #ddd; margin-bottom: 15px;"></i>
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                `;
            }

            // Update comment count in header
            const commentsHeader = document.querySelector(`#comments-${postId} .comments-header h4`);
            if (commentsHeader) {
                const totalCount = this.getTotalCommentCount(comments || []);
                commentsHeader.textContent = `Comments (${totalCount})`;
            }

        } catch (error) {
            console.error('Failed to load comments:', error);
            commentsList.innerHTML = `
                <div class="error-comments">
                    <i class="fas fa-exclamation-triangle" style="color: #dc3545; margin-bottom: 10px;"></i>
                    <p>Failed to load comments. Please try again.</p>
                </div>
            `;
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

    renderInlineComments(comments) {
        return comments.map(comment => this.createInlineCommentThread(comment)).join('');
    }

    createInlineCommentThread(comment, depth = 0) {
        const commentHtml = this.createInlineCommentElement(comment, depth);
        let repliesHtml = '';

        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = comment.replies.map(reply =>
                this.createInlineCommentThread(reply, depth + 1)
            ).join('');
        }

        return commentHtml + repliesHtml;
    }

    createInlineCommentElement(comment, depth = 0) {
        const avatarColor = utils.generateAvatarColor(comment.username || 'Anonymous');
        const avatarInitials = utils.getAvatarInitials(comment.username || 'Anonymous');
        const isOwner = auth.isUserAuthenticated() && auth.getCurrentUser().id === comment.user_id;
        const isAuthenticated = auth.isUserAuthenticated();

        // Calculate indentation for nested comments (max depth of 5 levels)
        const maxDepth = 5;
        const actualDepth = Math.min(depth, maxDepth);
        const marginLeft = actualDepth * 30; // 30px per level

        return `
            <div class="inline-comment ${depth > 0 ? 'comment-reply' : ''}" data-comment-id="${comment.id}" data-parent-id="${comment.parent_id || ''}" style="margin-left: ${marginLeft}px;">
                <div class="comment-header">
                    <div class="post-avatar" style="background-color: ${avatarColor}; width: 32px; height: 32px; font-size: 0.8rem;">
                        ${avatarInitials}
                    </div>
                    <div class="comment-author">${utils.escapeHtml(comment.username || 'Anonymous')}</div>
                    <div class="comment-time">${utils.formatDate(comment.created_at)}</div>
                    ${depth > 0 ? `<span class="reply-indicator">↳ Reply</span>` : ''}
                    ${isOwner ? `
                        <button class="action-btn comment-delete-btn" title="Delete comment" data-comment-id="${comment.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content">
                    ${utils.escapeHtml(comment.content).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions">
                    <button class="action-btn comment-like-btn ${comment.user_liked ? 'liked' : ''}" data-comment-id="${comment.id}">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${comment.likes_count || 0}</span>
                    </button>
                    ${isAuthenticated && depth < maxDepth ? `
                        <button class="action-btn comment-reply-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-reply"></i>
                            Reply
                        </button>
                    ` : ''}
                </div>

                <!-- Reply form (initially hidden) -->
                <div class="reply-form" id="replyForm-${comment.id}" style="display: none;">
                    <textarea
                        id="replyContent-${comment.id}"
                        placeholder="Write a reply..."
                        rows="2"
                        class="reply-textarea"
                    ></textarea>
                    <div class="reply-form-actions">
                        <button class="btn btn-primary btn-sm" onclick="window.posts.submitReply(${comment.id})">
                            <i class="fas fa-paper-plane"></i> Post Reply
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.posts.cancelReply(${comment.id})">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachCommentEventListeners(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection) return;

        // Comment like buttons
        commentsSection.querySelectorAll('.comment-like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                auth.requireAuth(() => this.toggleCommentLike(commentId, postId));
            });
        });

        // Reply buttons
        commentsSection.querySelectorAll('.comment-reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                auth.requireAuth(() => this.showReplyForm(commentId));
            });
        });

        // Delete buttons
        commentsSection.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const commentId = btn.dataset.commentId;
                this.deleteComment(commentId, postId);
            });
        });
    }

    async submitComment(postId) {
        const content = document.getElementById(`commentContent-${postId}`).value.trim();

        if (!content) {
            toast.error('Please enter a comment');
            return;
        }

        if (!auth.isUserAuthenticated()) {
            toast.error('Please login to comment');
            return;
        }

        const commentData = {
            post_id: parseInt(postId),
            content: content
        };

        try {
            await apiWrapper.createComment(commentData);

            // Clear the comment form
            document.getElementById(`commentContent-${postId}`).value = '';

            // Reload comments
            await this.loadInlineComments(postId);

            // Update comment count in post card
            this.updatePostCommentCount(postId);

            toast.success('Comment posted successfully!');

        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async toggleCommentLike(commentId, postId) {
        try {
            await apiWrapper.toggleLike({ comment_id: parseInt(commentId) });

            // Reload comments to show updated like status
            await this.loadInlineComments(postId);

        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    showReplyForm(commentId) {
        // Hide any other open reply forms
        document.querySelectorAll('.reply-form').forEach(form => {
            form.style.display = 'none';
        });

        // Show the reply form for this comment
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        if (replyForm) {
            replyForm.style.display = 'block';
            const textarea = document.getElementById(`replyContent-${commentId}`);
            if (textarea) {
                textarea.focus();
            }
        }
    }

    cancelReply(commentId) {
        const replyForm = document.getElementById(`replyForm-${commentId}`);
        if (replyForm) {
            replyForm.style.display = 'none';
            const textarea = document.getElementById(`replyContent-${commentId}`);
            if (textarea) {
                textarea.value = '';
            }
        }
    }

    async submitReply(parentCommentId) {
        const content = document.getElementById(`replyContent-${parentCommentId}`).value.trim();

        if (!content) {
            toast.error('Please enter a reply');
            return;
        }

        // Find the post ID from the comment section
        const commentElement = document.querySelector(`[data-comment-id="${parentCommentId}"]`);
        const commentsSection = commentElement.closest('.inline-comments-section');
        const postId = commentsSection.id.replace('comments-', '');

        const commentData = {
            post_id: parseInt(postId),
            parent_id: parseInt(parentCommentId),
            content: content
        };

        try {
            await apiWrapper.createComment(commentData);

            // Clear the reply form
            this.cancelReply(parentCommentId);

            // Reload comments
            await this.loadInlineComments(postId);

            // Update comment count
            this.updatePostCommentCount(postId);

            toast.success('Reply posted successfully!');

        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async deleteComment(commentId, postId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await apiWrapper.deleteComment(parseInt(commentId));

            // Reload comments
            await this.loadInlineComments(postId);

            // Update comment count
            this.updatePostCommentCount(postId);

            toast.success('Comment deleted successfully!');

        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    updatePostCommentCount(postId) {
        // Update comment count in the post card
        const commentBtn = document.querySelector(`[data-post-id="${postId}"] .comment-btn span`);
        const commentsHeader = document.querySelector(`#comments-${postId} .comments-header h4`);

        if (commentBtn && commentsHeader) {
            // Extract count from header
            const headerText = commentsHeader.textContent;
            const match = headerText.match(/\((\d+)\)/);
            if (match) {
                const count = match[1];
                commentBtn.textContent = count;

                // Update post in posts array
                const post = this.posts.find(p => p.id == postId);
                if (post) {
                    post.comment_count = parseInt(count);
                }
            }
        }
    }

    // Helper method to count total comments including replies
    getTotalCommentCount(comments) {
        let count = 0;

        const countComments = (commentList) => {
            for (const comment of commentList) {
                count++;
                if (comment.replies && comment.replies.length > 0) {
                    countComments(comment.replies);
                }
            }
        };

        countComments(comments);
        return count;
    }
}

// Create global posts instance
window.posts = new PostsManager();
