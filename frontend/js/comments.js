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
        // Handle comment form submissions
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

    // Render comments for a post
    renderComments(postId, comments) {
        const container = Utils.$(`[data-post-id="${postId}"] .comments-list`);
        if (!container) return;

        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
    }

    // Render individual comment
    renderComment(comment) {
        const isOwner = AuthHelpers.isOwner(comment.user_id);
        const formattedDate = Utils.formatDate(comment.created_at);
        
        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.profile_avatar || '/static/profiles/default.png'}" 
                             alt="${Utils.escapeHtml(comment.user_name)}" class="avatar">
                        <div class="author-info">
                            <span class="username">${Utils.escapeHtml(comment.user_name)}</span>
                            <span class="comment-date">${formattedDate}</span>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="comment-actions">
                            <button class="btn btn-sm btn-danger" onclick="window.Comments.deleteComment(${comment.id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="comment-content">
                    <p>${Utils.escapeHtml(comment.content)}</p>
                </div>
                
                <div class="comment-footer">
                    ${AuthHelpers.isLoggedIn() ? `
                        <div class="comment-reactions" data-comment-id="${comment.id}">
                            <button class="btn btn-sm like-btn" data-comment-id="${comment.id}" data-type="like">
                                👍 Like
                            </button>
                            <button class="btn btn-sm dislike-btn" data-comment-id="${comment.id}" data-type="dislike">
                                👎 Dislike
                            </button>
                        </div>
                        <button class="btn btn-sm btn-outline reply-btn" onclick="window.Comments.showReplyForm(${comment.id})">
                            Reply
                        </button>
                    ` : ''}
                </div>
                
                <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
                    <form class="reply-form" data-comment-id="${comment.id}">
                        <textarea name="content" placeholder="Write a reply..." required></textarea>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Post Reply</button>
                            <button type="button" class="btn btn-outline" onclick="window.Comments.hideReplyForm(${comment.id})">Cancel</button>
                        </div>
                    </form>
                </div>
                
                ${comment.replies && comment.replies.length > 0 ? `
                    <div class="replies">
                        ${comment.replies.map(reply => this.renderReply(reply)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Render reply
    renderReply(reply) {
        const isOwner = AuthHelpers.isOwner(reply.user_id);
        const formattedDate = Utils.formatDate(reply.created_at);
        
        return `
            <div class="reply" data-reply-id="${reply.id}">
                <div class="reply-header">
                    <div class="reply-author">
                        <img src="${reply.profile_avatar || '/static/profiles/default.png'}" 
                             alt="${Utils.escapeHtml(reply.user_name)}" class="avatar">
                        <div class="author-info">
                            <span class="username">${Utils.escapeHtml(reply.user_name)}</span>
                            <span class="reply-date">${formattedDate}</span>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="reply-actions">
                            <button class="btn btn-sm btn-danger" onclick="window.Comments.deleteReply(${reply.id})">Delete</button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="reply-content">
                    <p>${Utils.escapeHtml(reply.content)}</p>
                </div>
                
                <div class="reply-footer">
                    ${AuthHelpers.isLoggedIn() ? `
                        <div class="reply-reactions" data-reply-id="${reply.id}">
                            <button class="btn btn-sm like-btn" data-reply-id="${reply.id}" data-type="like">
                                👍 Like
                            </button>
                            <button class="btn btn-sm dislike-btn" data-reply-id="${reply.id}" data-type="dislike">
                                👎 Dislike
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Handle create comment
    async handleCreateComment(event, postId) {
        const formData = Utils.getFormData(event.target);
        
        if (!formData.content.trim()) {
            Utils.showError('Please enter a comment');
            return;
        }

        try {
            Utils.showLoading();
            
            await api.createComment({
                post_id: parseInt(postId),
                content: formData.content.trim()
            });
            
            Utils.showSuccess('Comment posted successfully');
            Utils.clearForm(event.target);
            
            // Reload comments
            this.initPostComments(postId);

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Handle create reply
    async handleCreateReply(event, commentId) {
        const formData = Utils.getFormData(event.target);
        
        if (!formData.content.trim()) {
            Utils.showError('Please enter a reply');
            return;
        }

        try {
            Utils.showLoading();
            
            await api.createReply({
                parent_comment_id: parseInt(commentId),
                content: formData.content.trim()
            });
            
            Utils.showSuccess('Reply posted successfully');
            Utils.clearForm(event.target);
            this.hideReplyForm(commentId);
            
            // Find the post ID and reload comments
            const commentElement = Utils.$(`[data-comment-id="${commentId}"]`);
            const postElement = commentElement?.closest('[data-post-id]');
            if (postElement) {
                const postId = postElement.dataset.postId;
                this.initPostComments(postId);
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Show reply form
    showReplyForm(commentId) {
        if (!AuthHelpers.requireAuth()) return;
        
        const replyForm = Utils.$(`#reply-form-${commentId}`);
        if (replyForm) {
            Utils.show(replyForm);
            const textarea = replyForm.querySelector('textarea');
            if (textarea) {
                textarea.focus();
            }
        }
    }

    // Hide reply form
    hideReplyForm(commentId) {
        const replyForm = Utils.$(`#reply-form-${commentId}`);
        if (replyForm) {
            Utils.hide(replyForm);
            Utils.clearForm(replyForm.querySelector('form'));
        }
    }

    // Delete comment
    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            Utils.showLoading();
            
            await api.deleteComment(commentId);
            Utils.showSuccess('Comment deleted successfully');
            
            // Find the post ID and reload comments
            const commentElement = Utils.$(`[data-comment-id="${commentId}"]`);
            const postElement = commentElement?.closest('[data-post-id]');
            if (postElement) {
                const postId = postElement.dataset.postId;
                this.initPostComments(postId);
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Update comments count
    updateCommentsCount(postId, count) {
        const countElements = Utils.$$(`[data-post-id="${postId}"] .comments-count`);
        countElements.forEach(element => {
            element.textContent = `💬 ${count}`;
        });
    }

    // Refresh comments for a post
    async refresh(postId) {
        await this.initPostComments(postId);
    }
}

// Initialize comments when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Comments = new Comments();
});
