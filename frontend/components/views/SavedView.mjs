/**
 * Saved View - Shows user's saved posts
 */

import { BaseView } from './BaseView.mjs';

export class SavedView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
    }

    /**
     * Render the saved view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Check authentication
            if (!await this.isAuthenticated()) {
                this.showAuthModal();
                this.app.router.navigate('/', true);
                return;
            }

            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.appendChild(this.createLoadingElement());

            // Create saved view
            await this.renderSavedContent(container);

        } catch (error) {
            console.error('Error rendering saved view:', error);
            container.innerHTML = '';
            container.appendChild(this.createErrorElement(
                'Failed to load saved posts.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Render saved content
     * @param {HTMLElement} container - Container element
     */
    async renderSavedContent(container) {
        container.innerHTML = '';

        const savedContent = document.createElement('div');
        savedContent.className = 'saved-view';
        savedContent.innerHTML = `
            <div class="saved-header">
                <h1><i class="fas fa-bookmark"></i> Saved Posts</h1>
                <p>Posts you've bookmarked for later</p>
            </div>

            <div class="saved-filters">
                <button class="filter-btn active" data-filter="all">All Saved</button>
                <button class="filter-btn" data-filter="recent">Recently Saved</button>
                <button class="filter-btn" data-filter="category">By Category</button>
            </div>

            <div class="saved-content">
                <div class="saved-posts" id="savedPosts">
                    <div class="loading">Loading your saved posts...</div>
                </div>
            </div>
        `;

        container.appendChild(savedContent);

        // Setup event listeners
        this.setupEventListeners();

        // Load saved posts
        await this.loadSavedPosts('all');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Load filtered data
                this.loadSavedPosts(filter);
            });
        });
    }

    /**
     * Load saved posts
     * @param {string} filter - Filter type
     */
    async loadSavedPosts(filter) {
        const postsContainer = document.getElementById('savedPosts');
        if (!postsContainer) return;

        try {
            postsContainer.innerHTML = '<div class="loading">Loading your saved posts...</div>';

            // This would typically fetch saved posts from the API
            // For now, we'll show a placeholder since saved posts functionality isn't implemented yet
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <h3>No Saved Posts Yet</h3>
                    <p>Start bookmarking posts you want to read later!</p>
                    <button class="browse-posts-btn">Browse Posts</button>
                </div>
            `;

            // Add event listener for browse button
            const browseBtn = postsContainer.querySelector('.browse-posts-btn');
            if (browseBtn) {
                browseBtn.addEventListener('click', () => {
                    this.app.router.navigate('/');
                });
            }

        } catch (error) {
            console.error('Error loading saved posts:', error);
            postsContainer.innerHTML = '';
            postsContainer.appendChild(this.createErrorElement(
                'Failed to load saved posts.',
                () => this.loadSavedPosts(filter)
            ));
        }
    }

    /**
     * Remove post from saved list
     * @param {number} postId - Post ID to remove
     */
    async removeSavedPost(postId) {
        try {
            // This would typically make an API call to remove the saved post
            console.log(`Removing saved post ${postId}`);
            
            // Refresh the saved posts list
            await this.loadSavedPosts('all');
            
        } catch (error) {
            console.error('Error removing saved post:', error);
            alert('Failed to remove saved post.');
        }
    }
}
