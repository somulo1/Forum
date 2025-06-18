/**
 * Main Application Controller - Orchestrates all components
 */

import { AuthManager } from '../auth/AuthManager.mjs';
import { AuthModal } from '../auth/AuthModal.mjs';
import { NavManager } from '../navigation/NavManager.mjs';
import { CategoryManager } from '../categories/CategoryManager.mjs';
import { ReactionManager } from '../reactions/ReactionManager.mjs';
import { PostManager } from '../posts/PostManager.mjs';
import { PostForm } from '../posts/PostForm.mjs';
import { CommentManager } from '../comments/CommentManager.mjs';

export class App {
    constructor() {
        this.authManager = null;
        this.authModal = null;
        this.navManager = null;
        this.categoryManager = null;
        this.reactionManager = null;
        this.postManager = null;
        this.postForm = null;
        this.commentManager = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize core managers
            this.authManager = new AuthManager();
            this.authModal = new AuthModal(this.authManager, (user) => this.onAuthSuccess(user));
            
            // Initialize navigation
            this.navManager = new NavManager(this.authManager, this.authModal);
            
            // Initialize category manager with filter callback
            this.categoryManager = new CategoryManager((categoryId) => this.onCategoryFilter(categoryId));
            
            // Initialize reaction manager
            this.reactionManager = new ReactionManager(this.authModal);
            
            // Initialize comment manager
            this.commentManager = new CommentManager(this.authModal, this.reactionManager);
            
            // Initialize post manager
            this.postManager = new PostManager(this.reactionManager, this.commentManager);
            
            // Initialize post form
            this.postForm = new PostForm(
                this.categoryManager, 
                this.authModal, 
                () => this.onPostCreated()
            );

            // Setup the application
            await this.setupApp();
            
            console.log('Forum application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    /**
     * Setup the application components
     */
    async setupApp() {
        // Render create post section
        this.postForm.renderCreatePostSection();
        
        // Fetch and render initial data
        await this.postManager.fetchForumPosts();
        await this.postManager.renderPosts();
        await this.categoryManager.renderCategories();
        
        // Setup authentication UI
        await this.navManager.setupAuthButtons();
    }

    /**
     * Handle successful authentication
     * @param {Object} user - Authenticated user data
     */
    onAuthSuccess(user) {
        console.log('User authenticated:', user.username);
        this.navManager.onAuthSuccess(user);
    }

    /**
     * Handle category filter changes
     * @param {number} categoryId - Selected category ID
     */
    async onCategoryFilter(categoryId) {
        await this.postManager.filterPostsByCategory(categoryId);
    }

    /**
     * Handle post creation
     */
    async onPostCreated() {
        console.log('New post created, refreshing feed...');
        await this.postManager.refreshPosts();
    }

    /**
     * Get the auth manager instance
     * @returns {AuthManager} - Auth manager instance
     */
    getAuthManager() {
        return this.authManager;
    }

    /**
     * Get the post manager instance
     * @returns {PostManager} - Post manager instance
     */
    getPostManager() {
        return this.postManager;
    }

    /**
     * Get the category manager instance
     * @returns {CategoryManager} - Category manager instance
     */
    getCategoryManager() {
        return this.categoryManager;
    }

    /**
     * Get the comment manager instance
     * @returns {CommentManager} - Comment manager instance
     */
    getCommentManager() {
        return this.commentManager;
    }

    /**
     * Get the reaction manager instance
     * @returns {ReactionManager} - Reaction manager instance
     */
    getReactionManager() {
        return this.reactionManager;
    }

    /**
     * Refresh the entire application
     */
    async refresh() {
        await this.postManager.refreshPosts();
        await this.categoryManager.renderCategories();
        await this.navManager.setupAuthButtons();
    }

    /**
     * Handle application errors
     * @param {Error} error - Error to handle
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = '') {
        console.error(`Application error in ${context}:`, error);
        
        // You can add global error handling logic here
        // For example, showing a toast notification or error modal
    }
}
