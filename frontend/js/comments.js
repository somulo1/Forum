// Comments Management

class Comments {
    constructor() {
        this.comments = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event delegation for dynamically created comment forms and buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.reply-btn')) {
                const commentId = e.target.dataset.commentId;
                this.showReplyForm(commentId);
            } else if (e.target.matches('.delete-comment-btn')) {
                const commentId = e.target.dataset.commentId;
                this.deleteComment(commentId);
            } else if (e.target.matches('.cancel-reply-btn')) {
                this.hideReplyForm(e.target.closest('.reply-form'));
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.matches('.comment-form')) {
                e.preventDefault();
                const postId = e.target.dataset.postId;
                this.handleCreateComment(e, postId);
            } else if (e.target.matches('.reply-form')) {
                e.preventDefault();
                const commentId = e.target.dataset.commentId;
                this.handleCreateReply(e, commentId);
            }
        });
    }

    // Initialize comments for a specific post
    async initPostComments(postId) {
        try {
            const comments = await api.getComments(postId);
            this.comments[postId] = comments;
            this.renderComments(postId, comments);
            this.updateCommentsCount(postId, comments.length);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    // Render comments section
    renderComments(postId, comments) {
        const container = document.querySelector(`.comments-section[data-post-id="${postId}"]`);
        if (!container) return;

        const commentsHtml = `
            <div class="comments-header">
                <h3>Comments (${comments.length})</h3>
            </div>
            
            ${AuthHelpers.isLoggedIn() ? `
                <form class="comment-form" data-post-id="${postId}">
                    <div class="form-group">
                        <textarea name="content" placeholder="Write a comment..." rows="3" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Post Comment</button>
                </form>
            ` : ''}
            
            <div class="comments-list">
                ${comments.map(comment => this.renderComment(comment)).join('')}
            </div>
        `;

        container.innerHTML = commentsHtml;

        // Initialize likes for comments
        if (window.Likes) {
            comments.forEach(comment => {
                window.Likes.initCommentLikes(comment.id);
                if (comment.replies) {
                    comment.replies.forEach(reply => {
                        window.Likes.initCommentLikes(reply.id);
                    });
                }
            });
        }
    }

    // Render individual comment
    renderComment(comment) {
        const formattedComment = ApiHelpers.formatComment(comment);
        const isOwner = AuthHelpers.isOwner(comment.user_id);
        
        return `
            <div class="comment-card" data-comment-id="${comment.id}">
                <header class="comment-header">
                    <img src="${formattedComment.avatar_url}" alt="${Utils.escapeHtml(comment.username)}" class="comment-avatar">
                    <div class="comment-meta">
                        <div class="comment-author">${Utils.escapeHtml(comment.username)}</div>
                        <div class="comment-date">${formattedComment.created_at}</div>
                    </div>
                    ${isOwner ? `
                        <button class="btn btn-small btn-danger delete-comment-btn" data-comment-id="${comment.id}">Delete</button>
                    ` : ''}
                </header>
                
                <div class="comment-content">${Utils.escapeHtml(comment.content)}</div>
                
                <footer class="comment-actions">
                    <div class="like-buttons" data-comment-id="${comment.id}">
                        <!-- Like buttons will be loaded by likes.js -->
                    </div>
                    
                    ${AuthHelpers.isLoggedIn() ? `
                        <button class="btn btn-small btn-secondary reply-btn" data-comment-id="${comment.id}">Reply</button>
                    ` : ''}
                </footer>
                
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="reply-section">
                        ${comment.replies.map(reply => this.renderReply(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Render reply comment
    renderReply(reply) {
        const formattedReply = ApiHelpers.formatComment(reply);
        const isOwner = AuthHelpers.isOwner(reply.user_id);
        
        return `
            <div class="reply-card comment-card" data-comment-id="${reply.id}">
                <header class="comment-header">
                    <img src="${formattedReply.avatar_url}" alt="${Utils.escapeHtml(reply.username)}" class="comment-avatar">
                    <div class="comment-meta">
                        <div class="comment-author">${Utils.escapeHtml(reply.username)}</div>
                        <div class="comment-date">${formattedReply.created_at}</div>
                    </div>
                    ${isOwner ? `
                        <button class="btn btn-small btn-danger delete-comment-btn" data-comment-id="${reply.id}">Delete</button>
                    ` : ''}
                </header>
                
                <div class="comment-content">${Utils.escapeHtml(reply.content)}</div>
                
                <footer class="comment-actions">
                    <div class="like-buttons" data-comment-id="${reply.id}">
                        <!-- Like buttons will be loaded by likes.js -->
                    </div>
                </footer>
            </div>
        `;
    }

    // Handle create comment
    async handleCreateComment(event, postId) {
        if (!AuthHelpers.requireAuth()) return;

        const form = event.target;
        const formData = Utils.getFormData(form);

        if (!formData.content || formData.content.trim().length < 1) {
            Utils.showError('Comment cannot be empty');
            return;
        }

        try {
            await api.createComment({
                post_id: parseInt(postId),
                content: formData.content.trim()
            });

            Utils.showSuccess('Comment posted successfully!');
            Utils.clearForm(form);
            
            // Reload comments for this post
            this.initPostComments(postId);

        } catch (error) {
            ApiHelpers.handleError(error);
        }
    }

    // Show reply form
    showReplyForm(commentId) {
        if (!AuthHelpers.requireAuth()) return;

        // Hide any existing reply forms
        document.querySelectorAll('.reply-form').forEach(form => {
            this.hideReplyForm(form);
        });

        const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentCard) return;

        const replyFormHtml = `
            <form class="reply-form" data-comment-id="${commentId}">
                <div class="form-group">
                    <textarea name="content" placeholder="Write a reply..." rows="2" required></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-small btn-primary">Post Reply</button>
                    <button type="button" class="btn btn-small btn-secondary cancel-reply-btn">Cancel</button>
                </div>
            </form>
        `;

        const actionsFooter = commentCard.querySelector('.comment-actions');
        if (actionsFooter) {
            actionsFooter.insertAdjacentHTML('afterend', replyFormHtml);
        }
    }

    // Hide reply form
    hideReplyForm(form) {
        if (form) {
            form.remove();
        }
    }

    // Handle create reply
    async handleCreateReply(event, commentId) {
        const form = event.target;
        const formData = Utils.getFormData(form);

        if (!formData.content || formData.content.trim().length < 1) {
            Utils.showError('Reply cannot be empty');
            return;
        }

        try {
            await api.createReply({
                parent_comment_id: parseInt(commentId),
                content: formData.content.trim()
            });

            Utils.showSuccess('Reply posted successfully!');
            this.hideReplyForm(form);
            
            // Find the post ID and reload comments
            const postSection = form.closest('.comments-section');
            if (postSection) {
                const postId = postSection.dataset.postId;
                this.initPostComments(postId);
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        }
    }

    // Delete comment
    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await api.deleteComment(commentId);
            Utils.showSuccess('Comment deleted successfully');
            
            // Find the post ID and reload comments
            const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
            const postSection = commentCard?.closest('.comments-section');
            if (postSection) {
                const postId = postSection.dataset.postId;
                this.initPostComments(postId);
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        }
    }

    // Update comments count in post card
    updateCommentsCount(postId, count) {
        const countElement = document.querySelector(`#comments-count-${postId}`);
        if (countElement) {
            countElement.textContent = count;
        }
    }
}

// Initialize comments when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Comments = new Comments();
});
