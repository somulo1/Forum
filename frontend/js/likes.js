// Likes and Dislikes Management

class Likes {
    constructor() {
        this.reactions = {};
        this.userReactions = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Event delegation for like/dislike buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.like-btn') || e.target.closest('.like-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.matches('.like-btn') ? e.target : e.target.closest('.like-btn');
                this.handleLike(button);
            } else if (e.target.matches('.dislike-btn') || e.target.closest('.dislike-btn')) {
                e.preventDefault();
                e.stopPropagation();
                const button = e.target.matches('.dislike-btn') ? e.target : e.target.closest('.dislike-btn');
                this.handleDislike(button);
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

    // Render like/dislike buttons
    renderLikeButtons(id, type) {
        const container = document.querySelector(`[data-${type}-id="${id}"] .like-buttons`);
        if (!container) return;

        const reactions = this.reactions[`${type}-${id}`] || { likes: 0, dislikes: 0 };
        const userReaction = this.userReactions[`${type}-${id}`] || null;

        const likeActive = userReaction === 'like' ? 'active' : '';
        const dislikeActive = userReaction === 'dislike' ? 'active' : '';

        container.innerHTML = `
            <button class="like-btn ${likeActive}" data-${type}-id="${id}" data-type="like">
                <span>👍</span>
                <span class="like-count">${reactions.likes || 0}</span>
            </button>
            <button class="dislike-btn ${dislikeActive}" data-${type}-id="${id}" data-type="dislike">
                <span>👎</span>
                <span class="dislike-count">${reactions.dislikes || 0}</span>
            </button>
        `;
    }

    // Handle like button click
    async handleLike(button) {
        if (!AuthHelpers.requireAuth()) return;

        const postId = button.dataset.postId;
        const commentId = button.dataset.commentId;
        const type = 'like';

        await this.toggleReaction(postId, commentId, type);
    }

    // Handle dislike button click
    async handleDislike(button) {
        if (!AuthHelpers.requireAuth()) return;

        const postId = button.dataset.postId;
        const commentId = button.dataset.commentId;
        const type = 'dislike';

        await this.toggleReaction(postId, commentId, type);
    }

    // Toggle like/dislike reaction
    async toggleReaction(postId, commentId, type) {
        try {
            const data = { type };
            
            if (postId) {
                data.post_id = parseInt(postId);
            } else if (commentId) {
                data.comment_id = parseInt(commentId);
            } else {
                throw new Error('Invalid reaction target');
            }

            await api.toggleLike(data);

            // Update local state
            const key = postId ? `post-${postId}` : `comment-${commentId}`;
            const currentReaction = this.userReactions[key];

            if (currentReaction === type) {
                // Remove reaction
                this.userReactions[key] = null;
                this.reactions[key][type === 'like' ? 'likes' : 'dislikes']--;
            } else {
                // Add or change reaction
                if (currentReaction) {
                    // Remove previous reaction
                    this.reactions[key][currentReaction === 'like' ? 'likes' : 'dislikes']--;
                }
                // Add new reaction
                this.userReactions[key] = type;
                this.reactions[key][type === 'like' ? 'likes' : 'dislikes']++;
            }

            // Re-render buttons
            const id = postId || commentId;
            const targetType = postId ? 'post' : 'comment';
            this.renderLikeButtons(id, targetType);

        } catch (error) {
            ApiHelpers.handleError(error);
        }
    }

    // Load user's current reactions for a post and its comments
    async loadUserReactions(postId) {
        if (!AuthHelpers.isLoggedIn()) return;

        try {
            // This would require a new API endpoint to get user's reactions
            // For now, we'll determine reactions based on button states
            // In a real implementation, you'd want to fetch this from the server
        } catch (error) {
            console.error('Error loading user reactions:', error);
        }
    }

    // Get reaction counts for display
    getReactionCounts(id, type) {
        const reactions = this.reactions[`${type}-${id}`];
        return reactions || { likes: 0, dislikes: 0 };
    }

    // Check if user has reacted to a post/comment
    getUserReaction(id, type) {
        return this.userReactions[`${type}-${id}`] || null;
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
        const commentCards = document.querySelectorAll('.comment-card[data-comment-id]');
        commentCards.forEach(card => {
            const commentId = card.dataset.commentId;
            this.initCommentLikes(commentId);
        });
    }

    // Clear reactions cache
    clearCache() {
        this.reactions = {};
        this.userReactions = {};
    }

    // Get total engagement (likes + dislikes) for sorting
    getTotalEngagement(id, type) {
        const reactions = this.reactions[`${type}-${id}`];
        if (!reactions) return 0;
        return (reactions.likes || 0) + (reactions.dislikes || 0);
    }

    // Get like ratio for sorting (likes / total reactions)
    getLikeRatio(id, type) {
        const reactions = this.reactions[`${type}-${id}`];
        if (!reactions) return 0;
        
        const total = (reactions.likes || 0) + (reactions.dislikes || 0);
        if (total === 0) return 0;
        
        return (reactions.likes || 0) / total;
    }
}

// Initialize likes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Likes = new Likes();
});

// Helper functions for other modules
window.LikesHelpers = {
    // Initialize likes for a specific post
    initPost: (postId) => {
        if (window.Likes) {
            window.Likes.initPostLikes(postId);
        }
    },

    // Initialize likes for a specific comment
    initComment: (commentId) => {
        if (window.Likes) {
            window.Likes.initCommentLikes(commentId);
        }
    },

    // Get reaction counts
    getReactions: (id, type) => {
        if (window.Likes) {
            return window.Likes.getReactionCounts(id, type);
        }
        return { likes: 0, dislikes: 0 };
    },

    // Check user reaction
    getUserReaction: (id, type) => {
        if (window.Likes) {
            return window.Likes.getUserReaction(id, type);
        }
        return null;
    },

    // Refresh reactions from server
    refresh: (id, type) => {
        if (window.Likes) {
            window.Likes.refreshReactions(id, type);
        }
    }
};
