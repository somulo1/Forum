/**
 * Comment Manager - Handles comment functionality including creation, replies, and rendering
 */

import { ApiUtils } from '../utils/ApiUtils.js';
import { TimeUtils } from '../utils/TimeUtils.js';
import { PostCard } from '../posts/PostCard.js';

export class CommentManager {
    constructor(authModal, reactionManager) {
        this.authModal = authModal;
        this.reactionManager = reactionManager;
    }

    /**
     * Create a comment element with threaded replies
     * @param {Object} comment - Comment data
     * @param {boolean} isReply - Whether this is a reply comment
     * @returns {HTMLElement} - Comment element
     */
    createCommentElement(comment, isReply = false) {
        const commentItem = document.createElement('div');
        commentItem.classList.add('comment');
        if (isReply) {
            commentItem.classList.add('reply-comment');
        }
        commentItem.setAttribute('comment-id', `${comment.id}`);

        // Use the correct field names from the backend
        const username = comment.username || comment.UserName;
        const avatarUrl = comment.avatar_url || comment.ProfileAvatar;

        commentItem.innerHTML = `
            <div class="comment-avatar">
                <img class="post-author-img" src="http://localhost:8080${avatarUrl || '/static/pictures/default-avatar.png'}"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzLjk5IDcuMDEgMTUuNjIgNiAxOEMxMC4wMSAyMCAxMy45OSAyMCAxOCAxOEMxNi45OSAxNS42MiAxNC42NyAxMy45OSAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4K'" />
            </div>
            <div class="comment-details">
                <p class="comment-content"> <strong><span class="comment-username">${username}</span>:</strong> <span class="comment-text">${comment.content}</span></p>
                <div class="comment-footer">
                    <div class="comment-actions">
                        <button class="reaction-btn comment-like-btn" data-id="${comment.id}"><i class="fas fa-thumbs-up"></i></button>
                        <button class="reaction-btn comment-dislike-btn" data-id="${comment.id}"><i class="fas fa-thumbs-down"></i></button>
                        ${!isReply ? `<button class="reaction-btn comment-reply-btn" data-id="${comment.id}"><i class="fas fa-comment"></i></button>` : ''}
                    </div>
                    <p class="comment-time">${TimeUtils.getTimeAgo(comment.created_at)}</p>
                </div>
            </div>
            ${!isReply ? `<div class="replies-container" data-comment-id="${comment.id}"></div>` : ''}
        `;

        return commentItem;
    }

    /**
     * Render replies for a comment using the replies data from the comment object
     * @param {HTMLElement} commentElement - The parent comment element
     * @param {Array} replies - Array of reply objects
     */
    renderRepliesForComment(commentElement, replies) {
        const repliesContainer = commentElement.querySelector('.replies-container');
        if (!repliesContainer || !replies || replies.length === 0) return;

        replies.forEach(reply => {
            const replyElement = this.createCommentElement(reply, true);
            repliesContainer.appendChild(replyElement);
        });
    }

    /**
     * Initialize comment forms for all posts
     */
    initializeCommentForms() {
        const commentContainers = document.querySelectorAll(`.post-card .post-comment`);
        
        commentContainers.forEach(commentContainer => {
            const postID = commentContainer.getAttribute('data-id');
            this.createCommentForm(commentContainer, postID);
        });

        this.setupReplyHandlers();
        this.setupCloseReplyHandlers();
    }

    /**
     * Create comment form for a post
     * @param {HTMLElement} commentContainer - Comment container element
     * @param {string} postID - Post ID
     */
    createCommentForm(commentContainer, postID) {
        // Check if form already exists
        if (commentContainer.querySelector('.write-comment-box')) {
            return;
        }

        const commentForm = document.createElement('div');
        commentForm.classList.add('write-comment-box');        
        commentForm.innerHTML = `
            <form class="comment-box-form" data-post-id="${postID}">
                <textarea type="text" placeholder="Write comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">send</button>
            </form>
        `;

        commentContainer.appendChild(commentForm);

        // Add submit handler for the comment form
        const form = commentForm.querySelector('form');
        form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }

    /**
     * Handle comment form submission
     * @param {Event} e - Form submission event
     */
    async handleCommentSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        const postId = form.getAttribute('data-post-id');
        const parentCommentId = form.getAttribute('comment-id'); // For replies

        if (!content) {
            alert('Comment cannot be empty');
            return;
        }

        // Determine if this is a top-level comment or a reply
        if (parentCommentId) {
            // This is a reply to a comment
            await this.handleReplySubmit(form, content, parentCommentId);
        } else if (postId) {
            // This is a top-level comment
            await this.handleTopLevelCommentSubmit(form, content, postId);
        } else {
            console.error('No post ID or parent comment ID found');
            alert('Error: Could not determine where to post the comment');
            return;
        }
    }

    /**
     * Handle top-level comment submission
     * @param {HTMLElement} form - The form element
     * @param {string} content - Comment content
     * @param {string} postId - Post ID
     */
    async handleTopLevelCommentSubmit(form, content, postId) {
        const commentData = {
            post_id: parseInt(postId),
            content: content
        };

        try {
            const result = await ApiUtils.post('/api/comments/create', commentData, true);

            // Clear the textarea
            form.querySelector('textarea').value = '';

            // Refresh comments for this post
            await this.refreshPostComments(postId);

        } catch (error) {
            const errorInfo = ApiUtils.handleError(error, 'comment creation');

            if (errorInfo.requiresAuth) {
                this.authModal.showLoginModal();
            } else {
                alert(`Failed to post comment: ${errorInfo.message}`);
            }
        }
    }

    /**
     * Handle reply submission
     * @param {HTMLElement} form - The form element
     * @param {string} content - Reply content
     * @param {string} parentCommentId - Parent comment ID
     */
    async handleReplySubmit(form, content, parentCommentId) {
        const replyData = {
            parent_comment_id: parseInt(parentCommentId),
            content: content
        };

        console.log('Submitting reply:', replyData); // Debug log

        try {
            const result = await ApiUtils.post('/api/comment/reply/create', replyData, true);
            console.log('Reply created successfully:', result); // Debug log

            // Clear the textarea
            form.querySelector('textarea').value = '';

            // Find the post ID from the parent comment context
            const postCommentSection = form.closest('.post-comment');
            const postId = postCommentSection.getAttribute('data-id');

            // Refresh comments for this post to show the new reply
            await this.refreshPostComments(postId);

            // Close the reply form and show normal comment form
            this.closeReplyForm(postId);

        } catch (error) {
            console.error('Reply submission error:', error); // Debug log
            const errorInfo = ApiUtils.handleError(error, 'reply creation');

            if (errorInfo.requiresAuth) {
                this.authModal.showLoginModal();
            } else {
                alert(`Failed to post reply: ${errorInfo.message}`);
            }
        }
    }

    /**
     * Refresh comments for a specific post
     * @param {string} postId - Post ID
     */
    async refreshPostComments(postId) {
        try {
            const comments = await ApiUtils.get(`/api/comments/get?post_id=${postId}`);

            console.log(`Comments for post ${postId}:`, comments); // Debug log

            if (!comments || !Array.isArray(comments)) {
                console.error('Invalid comments data received:', comments);
                return;
            }

            // Calculate total comment count (including replies)
            let totalCommentCount = comments.length;
            comments.forEach(comment => {
                // Check both 'replies' and 'Replies' for compatibility
                const replies = comment.replies || comment.Replies;
                if (replies && Array.isArray(replies)) {
                    console.log(`Comment ${comment.id} has ${replies.length} replies:`, replies); // Debug log
                    totalCommentCount += replies.length;
                }
            });

            console.log(`Total comment count for post ${postId}: ${totalCommentCount}`); // Debug log

            // Clear and re-render comments
            const commentsContainer = PostCard.getCommentsContainer(postId);
            if (commentsContainer) {
                commentsContainer.innerHTML = '<h4>Comments</h4>';

                for (const comment of comments) {
                    const commentElement = this.createCommentElement(comment);
                    commentsContainer.appendChild(commentElement);

                    // Render replies if they exist (check both field names)
                    const replies = comment.replies || comment.Replies;
                    if (replies && Array.isArray(replies) && replies.length > 0) {
                        console.log(`Rendering ${replies.length} replies for comment ${comment.id}`); // Debug log
                        this.renderRepliesForComment(commentElement, replies);
                    }
                }
            }

            // Update comment count with total (comments + replies)
            PostCard.updateCommentCount(postId, totalCommentCount);

            // Refresh comment likes
            await this.reactionManager.loadCommentsLikes();

        } catch (error) {
            console.error('Error refreshing comments:', error);
        }
    }

    /**
     * Setup reply button handlers
     */
    setupReplyHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.comment-reply-btn')) {
                this.handleReplyClick(e);
            }
        });
    }

    /**
     * Handle reply button click
     * @param {Event} e - Click event
     */
    handleReplyClick(e) {
        const replyBtn = e.target.closest('.comment-reply-btn');
        const commentID = replyBtn.getAttribute('data-id');
        const postComments = e.target.closest(`.post-card .post-comment`);
        const postID = postComments.getAttribute('data-id');

        const replyFormContainer = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .write-comment-box`);
        const originalCommentElement = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .comment[comment-id="${commentID}"]`);

        if (!originalCommentElement) {
            console.error('Original comment element not found');
            return;
        }

        const commenterAvatarSrc = originalCommentElement.querySelector('.comment-avatar img').getAttribute('src');
        const originalCommenterUsername = originalCommentElement.querySelector('.comment-details .comment-content span.comment-username').textContent;
        const originalCommenterText = originalCommentElement.querySelector('.comment-details .comment-content span.comment-text').textContent;
        const commentTimestamp = originalCommentElement.querySelector('.comment-details .comment-time').textContent;

        this.renderReplyForm(replyFormContainer, {
            commentID,
            postID,
            commenterAvatarSrc,
            originalCommenterUsername,
            originalCommenterText,
            commentTimestamp
        });
    }

    /**
     * Render reply form
     * @param {HTMLElement} container - Container for reply form
     * @param {Object} replyData - Reply data
     */
    renderReplyForm(container, replyData) {
        container.innerHTML = `
            <div class="reply-comment-header">
                <div><p><em>Replying to ${replyData.originalCommenterUsername}</em></p></div>
                <button class="close-reply" data-post-id="${replyData.postID}">Cancel</button>
            </div>
            <div class="comment original-comment">
                <div class="comment-avatar">
                    <img class="post-author-img" src="${replyData.commenterAvatarSrc}" alt="username"/>
                </div>
                <div class="comment-details">
                    <p><strong>${replyData.originalCommenterUsername}:</strong> ${replyData.originalCommenterText}</p>
                    <div class="comment-footer">
                        <p class="comment-time">${replyData.commentTimestamp}</p>
                    </div>
                </div>
            </div>
            <form class="comment-box-form" comment-id="${replyData.commentID}">
                <textarea placeholder="Write your reply to @${replyData.originalCommenterUsername}..." cols="30" rows="2" required autocomplete="off"></textarea>
                <button type="submit">Reply</button>
            </form>
        `;

        // Attach the submit handler to the new form
        const form = container.querySelector('form');
        form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }



    /**
     * Setup close reply handlers
     */
    setupCloseReplyHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.close-reply')) {
                this.handleCloseReply(e);
            }
        });
    }

    /**
     * Handle close reply button click
     * @param {Event} e - Click event
     */
    handleCloseReply(e) {
        const postId = e.target.getAttribute('data-post-id');
        this.closeReplyForm(postId);
    }

    /**
     * Close reply form and restore normal comment form
     * @param {string} postId - Post ID
     */
    closeReplyForm(postId) {
        const replyFormContainer = document.querySelector(`.post-card .post-comment[data-id="${postId}"] .write-comment-box`);

        if (!replyFormContainer) return;

        // Reset to normal comment form
        replyFormContainer.innerHTML = `
            <form class="comment-box-form" data-post-id="${postId}">
                <textarea placeholder="Write a comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">Comment</button>
            </form>
        `;

        // Re-attach event listener
        const form = replyFormContainer.querySelector('form');
        form.addEventListener('submit', (e) => this.handleCommentSubmit(e));
    }
}
