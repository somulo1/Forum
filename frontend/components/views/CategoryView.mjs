/**
 * Category View - Shows posts from a specific category
 */

import { BaseView } from './BaseView.mjs';

export class CategoryView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
        this.categoryId = params.id;
        this.category = null;
    }

    /**
     * Render the category view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.appendChild(this.createLoadingElement());

            // Load category data and render
            await this.loadCategory();
            await this.renderCategoryContent(container);

        } catch (error) {
            console.error('Error rendering category view:', error);
            container.innerHTML = '';
            container.appendChild(this.createErrorElement(
                'Failed to load category.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Load category data from the backend
     */
    async loadCategory() {
        try {
            // Get categories from the CategoryManager
            const categories = this.app.getCategoryManager().getCategories();

            // Find the specific category by ID
            this.category = categories.find(cat => cat.id.toString() === this.categoryId.toString());

            if (!this.category) {
                // If not found in cached categories, try to refresh and search again
                await this.app.getCategoryManager().renderCategories();
                const refreshedCategories = this.app.getCategoryManager().getCategories();
                this.category = refreshedCategories.find(cat => cat.id.toString() === this.categoryId.toString());
            }

            if (!this.category) {
                // Category still not found, create a fallback
                this.category = {
                    id: this.categoryId,
                    name: 'Unknown Category',
                    description: 'This category could not be found.'
                };
            }

        } catch (error) {
            console.error('Error loading category:', error);
            throw error;
        }
    }

    /**
     * Render category content
     * @param {HTMLElement} container - Container element
     */
    async renderCategoryContent(container) {
        container.innerHTML = '';

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-view';
        categoryContent.innerHTML = `
            <div class="category-header">
                <button class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <div class="category-info">
                    <h1>${this.category.name}</h1>
                    <p>${this.category.description || 'Explore posts in this category'}</p>
                </div>
            </div>

            <div class="category-filters">
                <button class="filter-btn active" data-filter="recent">Recent</button>
                <button class="filter-btn" data-filter="popular">Popular</button>
                <button class="filter-btn" data-filter="trending">Trending</button>
            </div>

            <div class="category-content">
                <div class="category-posts" id="categoryPosts">
                    <div class="loading">Loading posts...</div>
                </div>
            </div>
        `;

        container.appendChild(categoryContent);

        // Setup event listeners
        this.setupEventListeners();

        // Load category posts
        await this.loadCategoryPosts('recent');

        // Update active category in sidebar
        this.app.getCategoryManager().updateActiveCategory(parseInt(this.categoryId));
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Back button
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.app.router.navigate('/');
            });
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');

                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Load filtered posts
                this.loadCategoryPosts(filter);
            });
        });
    }

    /**
     * Load posts for this category
     * @param {string} filter - Sort filter (recent, popular, trending)
     */
    async loadCategoryPosts(filter) {
        const postsContainer = document.getElementById('categoryPosts');
        if (!postsContainer) return;

        try {
            postsContainer.innerHTML = '<div class="loading">Loading posts...</div>';

            // Fetch all posts and filter by category
            const allPosts = await this.app.postManager.fetchForumPosts();

            // Filter posts by this category
            const categoryPosts = allPosts.filter(post =>
                post.category_ids && post.category_ids.includes(parseInt(this.categoryId))
            );

            // Sort posts based on filter
            let sortedPosts = [...categoryPosts];
            switch (filter) {
                case 'popular':
                    // Sort by likes (assuming we have likes data)
                    sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                    break;
                case 'trending':
                    // Sort by recent activity and engagement
                    sortedPosts.sort((a, b) => {
                        const aScore = (a.likes || 0) + (a.comments_count || 0);
                        const bScore = (b.likes || 0) + (b.comments_count || 0);
                        return bScore - aScore;
                    });
                    break;
                case 'recent':
                default:
                    // Sort by creation date (most recent first)
                    sortedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    break;
            }

            if (sortedPosts.length === 0) {
                postsContainer.appendChild(this.createEmptyStateElement(
                    `No posts in ${this.category.name} yet. Be the first to post!`,
                    'fas fa-file-alt'
                ));
                return;
            }

            // Render posts using the existing PostCard component
            postsContainer.innerHTML = '';

            for (const post of sortedPosts) {
                // Import PostCard dynamically
                const { PostCard } = await import('../posts/PostCard.mjs');
                const postCard = PostCard.create(post);

                // Add category-specific styling
                postCard.classList.add('category-post-card');

                // Setup comment toggle for this post
                PostCard.setupCommentToggle(postCard);

                postsContainer.appendChild(postCard);
            }

            // Load additional data for posts (reactions, etc.)
            await this.loadPostsData(sortedPosts);

        } catch (error) {
            console.error('Error loading category posts:', error);
            postsContainer.innerHTML = '';
            postsContainer.appendChild(this.createErrorElement(
                'Failed to load posts.',
                () => this.loadCategoryPosts(filter)
            ));
        }
    }

    /**
     * Load additional data for posts (reactions, comments count)
     * @param {Array} posts - Posts to load data for
     */
    async loadPostsData(posts) {
        try {
            // Load reactions for all posts
            await this.app.getReactionManager().loadPostsLikes();

            // Update comment counts for all posts
            for (const post of posts) {
                try {
                    await this.app.postManager.updatePostComments(post.id);
                } catch (error) {
                    console.error(`Error updating comments for post ${post.id}:`, error);
                }
            }
        } catch (error) {
            console.error('Error loading posts data:', error);
        }
    }



    /**
     * Format date for display
     * @param {string} dateString - Date string to format
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else {
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return 'Unknown';
        }
    }
}
