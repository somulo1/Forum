/**
 * Post Manager - Handles post fetching, rendering, and management
 */

import { ApiUtils } from '../utils/ApiUtils.mjs';
import { PostCard } from './PostCard.mjs';

export class PostManager {
    constructor(reactionManager, commentManager) {
        this.posts = [];
        this.filteredPosts = [];
        this.reactionManager = reactionManager;
        this.commentManager = commentManager;
        this.postContainer = document.getElementById("postFeed");
    }

    /**
     * Fetch all forum posts
     * @returns {Array} - Array of posts
     */
    async fetchForumPosts() {
        try {
            this.posts = await ApiUtils.get("/api/posts");
            return this.posts;
        } catch (error) {
            console.error("Error fetching posts:", error);
            return [];
        }
    }

    /**
     * Render posts in the feed
     * @param {Array} posts - Posts to render (optional, uses this.posts if not provided)
     */
    async renderPosts(posts = null) {
        const postsToRender = posts || this.posts;
        this.postContainer.innerHTML = "";

        for (const post of postsToRender) {
            const postCard = PostCard.create(post);
            
            // Setup comment toggle for this post
            PostCard.setupCommentToggle(postCard);
            
            this.postContainer.appendChild(postCard);
        }

        // Load additional data for posts
        await this.loadPostsData();
    }

    /**
     * Load additional data for posts (likes, comments, etc.)
     */
    async loadPostsData() {
        await this.reactionManager.loadPostsLikes();
        await this.loadPostsComments();
        await this.reactionManager.loadCommentsLikes();
        this.commentManager.initializeCommentForms();
    }

    /**
     * Load comments for all posts
     */
    async loadPostsComments() {
        const commentBtns = document.querySelectorAll(".comment-btn");

        for (const btn of commentBtns) {
            const postId = btn.getAttribute('data-id');
            
            try {
                const comments = await ApiUtils.get(`/api/comments/get?post_id=${postId}`);

                // Handle null or undefined responses by treating them as empty arrays
                const commentsArray = comments && Array.isArray(comments) ? comments : [];

                // Update comment count
                PostCard.updateCommentCount(postId, commentsArray.length);

                // Render comments
                const commentsContainer = PostCard.getCommentsContainer(postId);
                if (commentsContainer) {
                    this.renderCommentsInContainer(commentsContainer, commentsArray);
                }
            } catch (error) {
                console.error(`Error loading comments for post ${postId}:`, error);
                // Set comment count to 0 on error
                PostCard.updateCommentCount(postId, 0);
            }
        }
    }

    /**
     * Render comments in a container
     * @param {HTMLElement} container - Comments container
     * @param {Array} comments - Comments to render
     */
    renderCommentsInContainer(container, comments) {
        // Keep the header
        const header = container.querySelector('h4');
        container.innerHTML = '';
        if (header) {
            container.appendChild(header);
        } else {
            container.innerHTML = '<h4>Comments</h4>';
        }

        for (const comment of comments) {
            const commentElement = this.commentManager.createCommentElement(comment);
            container.appendChild(commentElement);
        }
    }

    /**
     * Filter posts by category
     * @param {number} categoryId - Category ID (0 for all)
     */
    async filterPostsByCategory(categoryId) {
        if (categoryId === 0) {
            this.filteredPosts = this.posts;
        } else {
            this.filteredPosts = this.posts.filter(post => 
                post.category_ids && post.category_ids.includes(categoryId)
            );
        }

        await this.renderPosts(this.filteredPosts);
    }

    /**
     * Refresh posts (fetch and render)
     */
    async refreshPosts() {
        await this.fetchForumPosts();
        await this.renderPosts();
    }

    /**
     * Get all posts
     * @returns {Array} - Array of posts
     */
    getPosts() {
        return this.posts;
    }

    /**
     * Get filtered posts
     * @returns {Array} - Array of filtered posts
     */
    getFilteredPosts() {
        return this.filteredPosts;
    }

    /**
     * Add a new post to the beginning of the posts array
     * @param {Object} post - New post object
     */
    addPost(post) {
        this.posts.unshift(post);
        this.filteredPosts.unshift(post);
    }

    /**
     * Update comment count for a specific post
     * @param {string} postId - Post ID
     */
    async updatePostComments(postId) {
        try {
            const comments = await ApiUtils.get(`/api/comments/get?post_id=${postId}`);

            // Handle null or undefined responses by treating them as empty arrays
            const commentsArray = comments && Array.isArray(comments) ? comments : [];

            PostCard.updateCommentCount(postId, commentsArray.length);

            const commentsContainer = PostCard.getCommentsContainer(postId);
            if (commentsContainer) {
                this.renderCommentsInContainer(commentsContainer, commentsArray);
            }

            // Refresh comment likes
            await this.reactionManager.loadCommentsLikes();
        } catch (error) {
            console.error(`Error updating comments for post ${postId}:`, error);
            // Set comment count to 0 on error
            PostCard.updateCommentCount(postId, 0);
        }
    }
}
