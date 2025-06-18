/**
 * Home View - Main forum feed
 */

import { BaseView } from './BaseView.mjs';

export class HomeView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
    }

    /**
     * Render the home view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Clear container
            container.innerHTML = '';

            // Create the home view structure
            const homeContent = document.createElement('div');
            homeContent.className = 'home-view';
            homeContent.innerHTML = `
                <section id="storySection" class="story-section">
                    <!-- Stories will be rendered dynamically -->
                </section>
                <section id="createPostSection" class="create-post-section">
                    <!-- Create post form will be rendered here -->
                </section>
                <section id="postFeed">
                    <!-- Posts will be injected here -->
                </section>
            `;

            container.appendChild(homeContent);

            // Initialize the home view components
            await this.initializeComponents();

        } catch (error) {
            console.error('Error rendering home view:', error);
            container.appendChild(this.createErrorElement(
                'Failed to load the home feed.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Initialize home view components
     */
    async initializeComponents() {
        try {
            // Update PostManager's container reference since we recreated the DOM
            this.app.postManager.postContainer = document.getElementById('postFeed');

            // Render create post section
            this.app.postForm.renderCreatePostSection();

            // Show loading state for posts
            const postFeed = document.getElementById('postFeed');
            if (postFeed) {
                postFeed.appendChild(this.createLoadingElement());
            }

            // Fetch and render posts
            await this.app.postManager.fetchForumPosts();
            await this.app.postManager.renderPosts();

            // Apply any category filter from query parameters
            if (this.query.category) {
                const categoryId = parseInt(this.query.category);
                if (!isNaN(categoryId)) {
                    await this.app.postManager.filterPostsByCategory(categoryId);
                    // Update active category in sidebar
                    this.app.getCategoryManager().updateActiveCategory(categoryId);
                }
            } else {
                // Show all posts and update active category to "All"
                await this.app.postManager.filterPostsByCategory(0);
                this.app.getCategoryManager().updateActiveCategory(0);
            }

        } catch (error) {
            console.error('Error initializing home components:', error);
            const postFeed = document.getElementById('postFeed');
            if (postFeed) {
                postFeed.innerHTML = '';
                postFeed.appendChild(this.createErrorElement(
                    'Failed to load posts.',
                    () => this.initializeComponents()
                ));
            }
        }
    }

    /**
     * Handle category filter changes
     * @param {number} categoryId - Category ID to filter by
     */
    async handleCategoryFilter(categoryId) {
        const currentPath = window.location.pathname;
        const newQuery = new URLSearchParams(window.location.search);
        
        if (categoryId) {
            newQuery.set('category', categoryId.toString());
        } else {
            newQuery.delete('category');
        }

        const newPath = currentPath + (newQuery.toString() ? '?' + newQuery.toString() : '');
        this.app.router.navigate(newPath, true);
        
        await this.app.postManager.filterPostsByCategory(categoryId);
    }

    /**
     * Cleanup when view is destroyed
     */
    destroy() {
        // Clean up any event listeners or timers if needed
        super.destroy();
    }
}
