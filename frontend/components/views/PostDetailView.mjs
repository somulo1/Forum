/**
 * Post Detail View - Shows individual post with comments
 */

import { BaseView } from './BaseView.mjs';

export class PostDetailView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
        this.postId = params.id;
        this.post = null;
    }

    /**
     * Render the post detail view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.appendChild(this.createLoadingElement());

            // Load and render post
            await this.loadPost();
            await this.renderPostContent(container);

        } catch (error) {
            console.error('Error rendering post detail view:', error);
            container.innerHTML = '';
            container.appendChild(this.createErrorElement(
                'Failed to load post.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Load post data
     */
    async loadPost() {
        try {
            console.log('PostDetailView: Loading post with ID:', this.postId);

            // First, try to get the post from the PostManager's cached posts
            const allPosts = this.app.postManager.getPosts();
            let post = allPosts.find(p => p.id.toString() === this.postId.toString());

            if (!post) {
                // If not found in cache, fetch all posts and try again
                console.log('PostDetailView: Post not found in cache, fetching all posts');
                await this.app.postManager.fetchForumPosts();
                const refreshedPosts = this.app.postManager.getPosts();
                post = refreshedPosts.find(p => p.id.toString() === this.postId.toString());
            }

            if (!post) {
                throw new Error(`Post with ID ${this.postId} not found`);
            }

            console.log('PostDetailView: Post found:', post);

            // Get additional data for the post
            const [reactions, comments] = await Promise.all([
                this.app.getReactionManager().getPostReactions(post.id),
                this.app.getCommentManager().getPostComments(post.id)
            ]);

            // Enhance post with additional data
            this.post = {
                ...post,
                likes: reactions.likes || 0,
                dislikes: reactions.dislikes || 0,
                comments_count: Array.isArray(comments) ? comments.length : 0,
                comments: comments || []
            };

            console.log('PostDetailView: Enhanced post data:', this.post);

        } catch (error) {
            console.error('Error loading post:', error);
            throw error;
        }
    }

    /**
     * Render post content
     * @param {HTMLElement} container - Container element
     */
    async renderPostContent(container) {
        container.innerHTML = '';

        const postContent = document.createElement('div');
        postContent.className = 'post-detail-view';
        postContent.innerHTML = `
            <div class="post-detail-header">
                <button class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div class="post-actions">
                    <button class="save-post-btn" title="Save Post">
                        <i class="fas fa-bookmark"></i>
                    </button>
                    <button class="share-post-btn" title="Share Post">
                        <i class="fas fa-share"></i>
                    </button>
                </div>
            </div>

            <article class="post-detail-content">
                <div class="post-header">
                    <div class="post-author">
                        <img src="http://localhost:8080${this.post.avatar_url || '/static/pictures/default-avatar.png'}"
                             alt="${this.post.username}"
                             class="author-avatar">
                        <div class="author-info">
                            <span class="author-name">${this.post.username}</span>
                            <span class="post-date">${this.formatDate(this.post.created_at)}</span>
                        </div>
                    </div>
                    <div class="post-categories">
                        ${this.renderPostCategories()}
                    </div>
                </div>

                <div class="post-body">
                    <h1 class="post-title">${this.post.title}</h1>
                    ${this.post.image_url ? `<img src="http://localhost:8080${this.post.image_url}" alt="Post image" class="post-image">` : ''}
                    <div class="post-content">${this.post.content}</div>
                </div>

                <div class="post-footer">
                    <div class="post-stats">
                        <button class="like-btn" data-post-id="${this.post.id}">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${this.post.likes}</span>
                        </button>
                        <span class="comment-count">
                            <i class="fas fa-comment"></i>
                            ${this.post.comments_count} comments
                        </span>
                    </div>
                </div>
            </article>

            <section class="comments-section">
                <div class="comments-header">
                    <h2>Comments (${this.post.comments_count})</h2>
                </div>
                
                <div class="comment-form" id="commentForm">
                    <!-- Comment form will be rendered here -->
                </div>
                
                <div class="comments-list" id="commentsList">
                    <div class="loading">Loading comments...</div>
                </div>
            </section>
        `;

        container.appendChild(postContent);

        // Setup event listeners
        this.setupEventListeners();

        // Load comments
        await this.loadComments();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Save post button
        const saveBtn = document.querySelector('.save-post-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.toggleSavePost();
            });
        }

        // Share post button
        const shareBtn = document.querySelector('.share-post-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.sharePost();
            });
        }

        // Like button
        const likeBtn = document.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => {
                this.toggleLike();
            });
        }
    }

    /**
     * Load comments for the post
     */
    async loadComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;

        try {
            commentsList.innerHTML = '<div class="loading">Loading comments...</div>';

            // Fetch fresh comments from the API
            const comments = await this.app.getCommentManager().getPostComments(this.postId);

            if (comments.length === 0) {
                commentsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>No Comments Yet</h3>
                        <p>Be the first to comment on this post!</p>
                    </div>
                `;
            } else {
                // Render comments manually using the CommentManager's createCommentElement method
                commentsList.innerHTML = '<h4>Comments</h4>';

                for (const comment of comments) {
                    const commentElement = this.app.getCommentManager().createCommentElement(comment);
                    commentsList.appendChild(commentElement);

                    // Render replies if they exist
                    const replies = comment.replies || comment.Replies;
                    if (replies && Array.isArray(replies) && replies.length > 0) {
                        this.app.getCommentManager().renderRepliesForComment(commentElement, replies);
                    }
                }
            }

            // Render comment form
            await this.renderCommentForm();

            // Load comment reactions
            await this.app.getReactionManager().loadCommentsLikes();

        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '';
            commentsList.appendChild(this.createErrorElement(
                'Failed to load comments.',
                () => this.loadComments()
            ));
        }
    }

    /**
     * Render post categories
     * @returns {string} - HTML for post categories
     */
    renderPostCategories() {
        if (!this.post.category_ids || !Array.isArray(this.post.category_ids)) {
            return '<span class="post-category">General</span>';
        }

        // Get category names from the CategoryManager
        const categories = this.app.getCategoryManager().getCategories();
        const categoryNames = this.post.category_ids.map(categoryId => {
            const category = categories.find(cat => cat.id === categoryId);
            return category ? category.name : `Category ${categoryId}`;
        });

        return categoryNames.map(name =>
            `<span class="post-category">${name}</span>`
        ).join('');
    }

    /**
     * Render comment form
     */
    async renderCommentForm() {
        const commentForm = document.getElementById('commentForm');
        if (!commentForm) return;

        if (await this.isAuthenticated()) {
            commentForm.innerHTML = `
                <div class="comment-form-content">
                    <form class="comment-box-form" data-post-id="${this.postId}">
                        <textarea placeholder="Write a comment..." class="comment-input" rows="3" required></textarea>
                        <div class="comment-form-actions">
                            <button type="submit" class="submit-comment-btn">Post Comment</button>
                        </div>
                    </form>
                </div>
            `;

            // Setup comment form handler using the CommentManager's handler
            const form = commentForm.querySelector('form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    this.app.getCommentManager().handleCommentSubmit(e).then(() => {
                        // Refresh comments after successful submission
                        this.loadComments();
                    });
                });
            }
        } else {
            commentForm.innerHTML = `
                <div class="auth-prompt">
                    <p>Please <button class="login-link">sign in</button> to comment.</p>
                </div>
            `;

            const loginLink = commentForm.querySelector('.login-link');
            if (loginLink) {
                loginLink.addEventListener('click', () => {
                    this.showAuthModal();
                });
            }
        }
    }



    /**
     * Toggle like status
     */
    async toggleLike() {
        try {
            if (!await this.isAuthenticated()) {
                this.showAuthModal();
                return;
            }

            // This would typically toggle like via API
            console.log('Toggling like for post:', this.postId);
            
            // Update UI optimistically
            const likeBtn = document.querySelector('.like-btn');
            const likeCount = document.querySelector('.like-count');
            
            if (likeBtn && likeCount) {
                const currentCount = parseInt(likeCount.textContent);
                likeCount.textContent = currentCount + 1;
                likeBtn.classList.add('liked');
            }

        } catch (error) {
            console.error('Error toggling like:', error);
        }
    }

    /**
     * Toggle save post
     */
    async toggleSavePost() {
        try {
            if (!await this.isAuthenticated()) {
                this.showAuthModal();
                return;
            }

            // This would typically toggle save status via API
            console.log('Toggling save for post:', this.postId);
            
            const saveBtn = document.querySelector('.save-post-btn');
            if (saveBtn) {
                saveBtn.classList.toggle('saved');
                const icon = saveBtn.querySelector('i');
                if (icon) {
                    icon.className = saveBtn.classList.contains('saved') ? 
                        'fas fa-bookmark' : 'far fa-bookmark';
                }
            }

        } catch (error) {
            console.error('Error toggling save:', error);
        }
    }

    /**
     * Share post
     */
    sharePost() {
        if (navigator.share) {
            navigator.share({
                title: this.post.title,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Post URL copied to clipboard!');
            });
        }
    }

    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Unknown';
        }
    }
}
