/**
 * Post Card - Handles rendering of individual post cards
 */

import { TimeUtils } from '../utils/TimeUtils.mjs';

export class PostCard {
    /**
     * Create a post card element
     * @param {Object} post - Post data
     * @returns {HTMLElement} - Post card element
     */
    static create(post) {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post-card");
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-author-info">
                    <img class="post-author-img" src="http://localhost:8080${post.avatar_url || '/static/pictures/default-avatar.png'}"
                         alt="Profile" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSIjOWNhM2FmIi8+CjxwYXRoIGQ9Ik0xMiAxNEM5LjMzIDEzLjk5IDcuMDEgMTUuNjIgNiAxOEMxMC4wMSAyMCAxMy45OSAyMCAxOCAxOEMxNi45OSAxNS42MiAxNC42NyAxMy45OSAxMiAxNFoiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+Cjwvc3ZnPgo8L3N2Zz4K'">
                    <span class="post-author-name">${post.username}</span>
                </div>
                <span class="post-time">${TimeUtils.getTimeAgo(post.created_at)}</span>
            </div>
            <div class="post-content">
                <div class="post-title">${post.title}</div>
                <div class="post-image hidden">
                    <img src="http://localhost:8080${post.image_url || ''}" alt="post-image" onerror="this.style.display='none'"/>
                </div>
                <div class="post-body">${post.content}</div>
            </div>
            <div class="post-actions">
                <button class="reaction-btn like-btn" data-id="${post.id}"><i class="fas fa-thumbs-up"></i></button>
                <button class="reaction-btn dislike-btn" data-id="${post.id}"><i class="fas fa-thumbs-down"></i></button>
                <button class="reaction-btn comment-btn" data-id="${post.id}"><i class="fas fa-comment"></i></button>
            </div>
            <div class="post-comment hidden" data-id="${post.id}">
                <div class="comments-container">
                    <h4>Comments</h4>
                </div>
            </div>
        `;

        // Show image if it exists
        if (post.image_url) {
            const imageEl = postDiv.querySelector(".post-image");
            imageEl.classList.remove("hidden");
        }

        return postDiv;
    }

    /**
     * Setup comment toggle functionality for a post card
     * @param {HTMLElement} postCard - The post card element
     */
    static setupCommentToggle(postCard) {
        const commentBtn = postCard.querySelector('.comment-btn');
        const postId = commentBtn.dataset.id;
        
        commentBtn.addEventListener('click', () => {
            const commentSection = postCard.querySelector(`.post-comment[data-id="${postId}"]`);
            if (commentSection) {
                commentSection.classList.toggle('hidden');
            }
        });
    }

    /**
     * Update comment count for a post
     * @param {string} postId - Post ID
     * @param {number} count - Comment count
     */
    static updateCommentCount(postId, count) {
        const commentBtn = document.querySelector(`.comment-btn[data-id="${postId}"]`);
        if (commentBtn) {
            // Clear existing text and add new count
            const icon = commentBtn.querySelector('i');
            commentBtn.innerHTML = '';
            commentBtn.appendChild(icon);
            commentBtn.insertAdjacentHTML("beforeend", ` ${count} Comments`);
        }
    }

    /**
     * Get post card element by post ID
     * @param {string} postId - Post ID
     * @returns {HTMLElement|null} - Post card element or null
     */
    static getPostCard(postId) {
        return document.querySelector(`.post-card .post-comment[data-id="${postId}"]`)?.closest('.post-card');
    }

    /**
     * Get comments container for a post
     * @param {string} postId - Post ID
     * @returns {HTMLElement|null} - Comments container or null
     */
    static getCommentsContainer(postId) {
        return document.querySelector(`.post-card .post-comment[data-id="${postId}"] .comments-container`);
    }

    /**
     * Clear comments in a post's comments container
     * @param {string} postId - Post ID
     */
    static clearComments(postId) {
        const commentsContainer = this.getCommentsContainer(postId);
        if (commentsContainer) {
            commentsContainer.innerHTML = '<h4>Comments</h4>';
        }
    }
}
