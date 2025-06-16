// Likes and Reactions Management
class Likes {
    constructor() {
        this.reactions = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle like/dislike button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.like-btn') || e.target.closest('.like-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.matches('.like-btn') ? e.target : e.target.closest('.like-btn');
                this.handleLikeClick(button, 'like');
            } else if (e.target.matches('.dislike-btn') || e.target.closest('.dislike-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.matches('.dislike-btn') ? e.target : e.target.closest('.dislike-btn');
                this.handleLikeClick(button, 'dislike');
            }
        });
    }

    // Initialize likes for a post
    async initPostLikes(postId) {
        try {
            const reactions = await api.getReactions({ post_id: postId });
            this.reactions[`post-${postId}`] = reactions;
            this.renderLikeButtons(postId, 'post');
        } catch (error) {
            console.error('Error loading post reactions:', error);
        }
    }

    // Initialize likes for a comment
    async initCommentLikes(commentId) {
        try {
            const reactions = await api.getReactions({ comment_id: commentId });
            this.reactions[`comment-${commentId}`] = reactions;
            this.renderLikeButtons(commentId, 'comment');
        } catch (error) {
            console.error('Error loading comment reactions:', error);
        }
    }

    // Handle like/dislike button click
    async handleLikeClick(button, type) {
        if (!AuthHelpers.requireAuth()) return;

        const postId = button.dataset.postId;
        const commentId = button.dataset.commentId;
        const replyId = button.dataset.replyId;

        if (!postId && !commentId && !replyId) {
            console.error('No ID found for like button');
            return;
        }

        try {
            // Disable button during request
            button.disabled = true;

            const likeData = { type };
            
            if (postId) {
                likeData.post_id = parseInt(postId);
            } else if (commentId) {
                likeData.comment_id = parseInt(commentId);
            } else if (replyId) {
                likeData.comment_id = parseInt(replyId); // Replies use comment_id in backend
            }

            await api.toggleLike(likeData);

            // Refresh reactions for this item
            if (postId) {
                await this.refreshReactions(postId, 'post');
            } else if (commentId) {
                await this.refreshReactions(commentId, 'comment');
            } else if (replyId) {
                await this.refreshReactions(replyId, 'reply');
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            button.disabled = false;
        }
    }

    // Render like buttons for an item
    renderLikeButtons(id, type) {
        const reactions = this.reactions[`${type}-${id}`] || { likes: 0, dislikes: 0, user_reaction: null };
        
        // Find all reaction containers for this item
        const containers = Utils.$$(`[data-${type}-id="${id}"] .${type}-reactions, [data-${type}-id="${id}"].${type}-reactions`);
        
        containers.forEach(container => {
            if (!container) return;

            const currentUser = AuthHelpers.getCurrentUser();
            const userReaction = reactions.user_reaction;

            container.innerHTML = `
                <div class="reactions-display">
                    <span class="likes-count">👍 ${reactions.likes || 0}</span>
                    <span class="dislikes-count">👎 ${reactions.dislikes || 0}</span>
                </div>
                
                ${AuthHelpers.isLoggedIn() ? `
                    <div class="reaction-buttons">
                        <button class="btn btn-sm like-btn ${userReaction === 'like' ? 'active' : ''}" 
                                data-${type}-id="${id}" data-type="like">
                            👍 ${userReaction === 'like' ? 'Liked' : 'Like'}
                        </button>
                        <button class="btn btn-sm dislike-btn ${userReaction === 'dislike' ? 'active' : ''}" 
                                data-${type}-id="${id}" data-type="dislike">
                            👎 ${userReaction === 'dislike' ? 'Disliked' : 'Dislike'}
                        </button>
                    </div>
                ` : ''}
            `;
        });

        // Update counts in post cards
        if (type === 'post') {
            const postCards = Utils.$$(`[data-post-id="${id}"]`);
            postCards.forEach(card => {
                const likesCount = card.querySelector('.likes-count');
                const dislikesCount = card.querySelector('.dislikes-count');
                
                if (likesCount) {
                    likesCount.textContent = `👍 ${reactions.likes || 0}`;
                }
                if (dislikesCount) {
                    dislikesCount.textContent = `👎 ${reactions.dislikes || 0}`;
                }
            });
        }
    }

    // Update reaction counts from server
    async refreshReactions(id, type) {
        try {
            const params = {};
            if (type === 'post') {
                params.post_id = id;
            } else {
                params.comment_id = id;
            }

            const reactions = await api.getReactions(params);
            this.reactions[`${type}-${id}`] = reactions;
            this.renderLikeButtons(id, type);
        } catch (error) {
            console.error('Error refreshing reactions:', error);
        }
    }

    // Initialize all likes for posts currently visible
    initVisiblePosts() {
        const postCards = document.querySelectorAll('.post-card[data-post-id]');
        postCards.forEach(card => {
            const postId = card.dataset.postId;
            this.initPostLikes(postId);
        });
    }

    // Initialize all likes for comments currently visible
    initVisibleComments() {
        const comments = document.querySelectorAll('.comment[data-comment-id]');
        comments.forEach(comment => {
            const commentId = comment.dataset.commentId;
            this.initCommentLikes(commentId);
        });

        const replies = document.querySelectorAll('.reply[data-reply-id]');
        replies.forEach(reply => {
            const replyId = reply.dataset.replyId;
            this.initCommentLikes(replyId);
        });
    }

    // Get reaction data for an item
    getReactions(id, type) {
        return this.reactions[`${type}-${id}`] || { likes: 0, dislikes: 0, user_reaction: null };
    }

    // Clear cached reactions
    clearCache() {
        this.reactions = {};
    }

    // Refresh all visible reactions
    async refreshAll() {
        // Refresh post reactions
        const postCards = document.querySelectorAll('.post-card[data-post-id]');
        for (const card of postCards) {
            const postId = card.dataset.postId;
            await this.refreshReactions(postId, 'post');
        }

        // Refresh comment reactions
        const comments = document.querySelectorAll('.comment[data-comment-id]');
        for (const comment of comments) {
            const commentId = comment.dataset.commentId;
            await this.refreshReactions(commentId, 'comment');
        }

        // Refresh reply reactions
        const replies = document.querySelectorAll('.reply[data-reply-id]');
        for (const reply of replies) {
            const replyId = reply.dataset.replyId;
            await this.refreshReactions(replyId, 'reply');
        }
    }
}

// Initialize likes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Likes = new Likes();
});
