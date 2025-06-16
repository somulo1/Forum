// Comments module for the forum application

class CommentsManager {
    constructor() {
        this.currentPostId = null;
        this.comments = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Comment form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'commentForm') {
                e.preventDefault();
                this.handleCreateComment(e);
            }
        });

        // Comment actions delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-like-btn')) {
                e.preventDefault();
                const commentId = e.target.closest('.comment').dataset.commentId;
                auth.requireAuth(() => this.toggleCommentLike(commentId));
            }

            if (e.target.closest('.comment-delete-btn')) {
                e.preventDefault();
                const commentId = e.target.closest('.comment').dataset.commentId;
                this.deleteComment(commentId);
            }

            if (e.target.closest('.comment-reply-btn')) {
                e.preventDefault();
                const commentId = e.target.closest('.comment').dataset.commentId;
                auth.requireAuth(() => this.showReplyForm(commentId));
            }
        });
    }

    async showPostDetail(postId) {
        this.currentPostId = postId;

        try {
            // Get post details
            const post = window.posts.posts.find(p => p.id == postId);
            if (!post) {
                toast.error('Post not found');
                return;
            }

            // Load comments
            await this.loadComments(postId);
            
            // Render post detail modal
            this.renderPostDetail(post);
            modal.open('postDetailModal');
            
        } catch (error) {
            console.error('Failed to load post details:', error);
            toast.error('Failed to load post details');
        }
    }

    async loadComments(postId) {
        try {
            const comments = await apiWrapper.getComments(postId);
            this.comments = comments || [];
        } catch (error) {
            console.error('Failed to load comments:', error);
            this.comments = [];
        }
    }

    renderPostDetail(post) {
        const container = document.getElementById('postDetailContent');
        if (!container) return;

        const avatarColor = utils.generateAvatarColor(post.username || 'Anonymous');
        const avatarInitials = utils.getAvatarInitials(post.username || 'Anonymous');
        const isOwner = auth.isUserAuthenticated() && auth.getCurrentUser().id === post.user_id;

        container.innerHTML = `
            <div class="post-detail">
                <div class="post-header">
                    <div class="post-avatar" style="background-color: ${avatarColor}">
                        ${avatarInitials}
                    </div>
                    <div class="post-meta">
                        <div class="post-author">${utils.escapeHtml(post.username || 'Anonymous')}</div>
                        <div class="post-time">${utils.formatDate(post.created_at)}</div>
                    </div>
                    ${post.category_name ? `<span class="post-category">${utils.escapeHtml(post.category_name)}</span>` : ''}
                </div>
                
                <div class="post-content">
                    <h2 class="post-title">${utils.escapeHtml(post.title)}</h2>
                    <div class="post-text">${utils.escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
                </div>
                
                <div class="post-actions">
                    <button class="action-btn like-btn ${post.user_liked ? 'liked' : ''}" onclick="window.posts.togglePostLike(${post.id})">
                        <i class="fas fa-thumbs-up"></i>
                        <span>${post.like_count || 0}</span>
                    </button>
                    <button class="action-btn comment-btn">
                        <i class="fas fa-comment"></i>
                        <span>${this.comments.length}</span>
                    </button>
                    ${isOwner ? `
                        <button class="action-btn delete-post-btn" onclick="window.posts.deletePost(${post.id}); modal.close();">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    ` : ''}
                </div>
                
                <div class="comments-section">
                    <h3>Comments (${this.comments.length})</h3>

                    ${auth.isUserAuthenticated() ? `
                        <form id="commentForm" class="comment-form">
                            <textarea
                                id="commentContent"
                                placeholder="Write a comment..."
                                required
                                rows="3"
                            ></textarea>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i>
                                Post Comment
                            </button>
                        </form>
                    ` : `
                        <div class="comment-form">
                            <p style="text-align: center; color: #666; padding: 20px;">
                                <a href="#" onclick="auth.showLoginModal(); return false;">Log in</a> to post a comment
                            </p>
                        </div>
                    `}
                    
                    <div class="comments-list">
                        ${this.renderComments()}
                    </div>
                </div>
            </div>
        `;
    }

    renderComments() {
        if (this.comments.length === 0) {
            return `
                <div class="empty-comments">
                    <i class="fas fa-comments fa-2x" style="color: #ddd; margin-bottom: 15px;"></i>
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            `;
        }

        // The backend now returns comments in threaded structure
        return this.comments.map(comment => this.createCommentThread(comment)).join('');
    }

    createCommentThread(comment, depth = 0) {
        const commentHtml = this.createCommentElement(comment, depth);
        let repliesHtml = '';

        if (comment.replies && comment.replies.length > 0) {
            repliesHtml = comment.replies.map(reply =>
                this.createCommentThread(reply, depth + 1)
            ).join('');
        }

        return commentHtml + repliesHtml;
    }

    createCommentElement(comment, depth = 0) {
        const avatarColor = utils.generateAvatarColor(comment.username || 'Anonymous');
        const avatarInitials = utils.getAvatarInitials(comment.username || 'Anonymous');
        const isOwner = auth.isUserAuthenticated() && auth.getCurrentUser().id === comment.user_id;
        const isAuthenticated = auth.isUserAuthenticated();

        // Calculate indentation for nested comments (max depth of 5 levels)
        const maxDepth = 5;
        const actualDepth = Math.min(depth, maxDepth);
        const marginLeft = actualDepth * 30; // 30px per level

        return `
            <div class="comment ${depth > 0 ? 'comment-reply' : ''}" data-comment-id="${comment.id}" data-parent-id="${comment.parent_id || ''}" style="margin-left: ${marginLeft}px;">
                <div class="comment-header">
                    <div class="post-avatar" style="background-color: ${avatarColor}; width: 32px; height: 32px; font-size: 0.8rem;">
                        ${avatarInitials}
                    </div>
                    <div class="comment-author">${utils.escapeHtml(comment.username || 'Anonymous')}</div>
                    <div class="comment-time">${utils.formatDate(comment.created_at)}</div>
                    ${depth > 0 ? `<span class="reply-indicator">↳ Reply</span>` : ''}
                    ${isOwner ? `
                        <button class="action-btn comment-delete-btn" title="Delete comment">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content">
                    ${utils.escapeHtml(comment.content).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions">
                    <button class="action-btn comment-like-btn ${comment.user_liked ? 'liked' : ''}">
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
                        <button class="btn btn-primary btn-sm" onclick="window.comments.submitReply(${comment.id})">
                            <i class="fas fa-paper-plane"></i> Post Reply
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="window.comments.cancelReply(${comment.id})">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async handleCreateComment(event) {
        event.preventDefault();

        const content = document.getElementById('commentContent').value.trim();

        if (!content) {
            toast.error('Please enter a comment');
            return;
        }

        if (!this.currentPostId) {
            toast.error('No post selected');
            return;
        }

        const commentData = {
            post_id: parseInt(this.currentPostId),
            content: content
        };

        try {
            await apiWrapper.createComment(commentData);
            
            // Clear the form
            document.getElementById('commentContent').value = '';
            
            // Reload comments
            await this.loadComments(this.currentPostId);
            
            // Re-render the comments section
            const commentsSection = document.querySelector('.comments-section');
            if (commentsSection) {
                const post = window.posts.posts.find(p => p.id == this.currentPostId);
                if (post) {
                    // Update comment count in the post
                    post.comment_count = this.comments.length;
                    
                    // Re-render just the comments part
                    const commentsList = document.querySelector('.comments-list');
                    const commentsHeader = document.querySelector('.comments-section h3');
                    
                    if (commentsList) {
                        commentsList.innerHTML = this.renderComments();
                    }
                    
                    if (commentsHeader) {
                        commentsHeader.textContent = `Comments (${this.comments.length})`;
                    }
                    
                    // Update comment count in post actions
                    const commentCountSpan = document.querySelector('.post-actions .comment-btn span');
                    if (commentCountSpan) {
                        commentCountSpan.textContent = this.comments.length;
                    }
                }
            }
            
        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    async toggleCommentLike(commentId) {
        try {
            await apiWrapper.toggleLike({ comment_id: parseInt(commentId) });
            
            // Update the UI optimistically
            const likeBtn = document.querySelector(`[data-comment-id="${commentId}"] .comment-like-btn`);
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

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await apiWrapper.deleteComment(parseInt(commentId));
            
            // Remove comment from local array
            this.comments = this.comments.filter(c => c.id != commentId);
            
            // Re-render comments
            const commentsList = document.querySelector('.comments-list');
            const commentsHeader = document.querySelector('.comments-section h3');
            
            if (commentsList) {
                commentsList.innerHTML = this.renderComments();
            }
            
            if (commentsHeader) {
                commentsHeader.textContent = `Comments (${this.comments.length})`;
            }
            
            // Update comment count in post actions
            const commentCountSpan = document.querySelector('.post-actions .comment-btn span');
            if (commentCountSpan) {
                commentCountSpan.textContent = this.comments.length;
            }
            
            // Update post in posts array
            const post = window.posts.posts.find(p => p.id == this.currentPostId);
            if (post) {
                post.comment_count = this.comments.length;
            }
            
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

        if (!this.currentPostId) {
            toast.error('No post selected');
            return;
        }

        const commentData = {
            post_id: parseInt(this.currentPostId),
            parent_id: parseInt(parentCommentId),
            content: content
        };

        try {
            await apiWrapper.createComment(commentData);

            // Clear the reply form
            this.cancelReply(parentCommentId);

            // Reload comments to show the new reply
            await this.loadComments(this.currentPostId);

            // Re-render the comments section
            const commentsList = document.querySelector('.comments-list');
            if (commentsList) {
                commentsList.innerHTML = this.renderComments();
            }

            // Update comment count
            const commentsHeader = document.querySelector('.comments-section h3');
            if (commentsHeader) {
                commentsHeader.textContent = `Comments (${this.getTotalCommentCount()})`;
            }

            // Update comment count in post actions
            const commentCountSpan = document.querySelector('.post-actions .comment-btn span');
            if (commentCountSpan) {
                commentCountSpan.textContent = this.getTotalCommentCount();
            }

            // Update post in posts array
            const post = window.posts.posts.find(p => p.id == this.currentPostId);
            if (post) {
                post.comment_count = this.getTotalCommentCount();
            }

        } catch (error) {
            // Error is already handled by apiWrapper
        }
    }

    // Helper method to count total comments including replies
    getTotalCommentCount() {
        let count = 0;

        const countComments = (comments) => {
            for (const comment of comments) {
                count++;
                if (comment.replies && comment.replies.length > 0) {
                    countComments(comment.replies);
                }
            }
        };

        countComments(this.comments);
        return count;
    }
}

// Create global comments instance
window.comments = new CommentsManager();
