/**
 * Trending View - Shows trending posts and topics
 */

import { BaseView } from './BaseView.mjs';

export class TrendingView extends BaseView {
    constructor(app, params, query) {
        super(app, params, query);
    }

    /**
     * Render the trending view
     * @param {HTMLElement} container - Container element
     */
    async render(container) {
        try {
            // Clear container
            container.innerHTML = '';

            // Show loading state
            container.appendChild(this.createLoadingElement());

            // Create trending view
            await this.renderTrendingContent(container);

        } catch (error) {
            console.error('Error rendering trending view:', error);
            container.innerHTML = '';
            container.appendChild(this.createErrorElement(
                'Failed to load trending content.',
                () => this.render(container)
            ));
        }
    }

    /**
     * Render trending content
     * @param {HTMLElement} container - Container element
     */
    async renderTrendingContent(container) {
        container.innerHTML = '';

        const trendingContent = document.createElement('div');
        trendingContent.className = 'trending-view';
        trendingContent.innerHTML = `
            <div class="trending-header">
                <h1><i class="fas fa-fire"></i> Trending</h1>
                <p>Discover what's popular in the community</p>
            </div>

            <div class="trending-filters">
                <button class="filter-btn active" data-filter="today">Today</button>
                <button class="filter-btn" data-filter="week">This Week</button>
                <button class="filter-btn" data-filter="month">This Month</button>
                <button class="filter-btn" data-filter="all">All Time</button>
            </div>

            <div class="trending-content">
                <div class="trending-section">
                    <h2><i class="fas fa-chart-line"></i> Trending Posts</h2>
                    <div class="trending-posts" id="trendingPosts">
                        <div class="loading">Loading trending posts...</div>
                    </div>
                </div>

                <div class="trending-section">
                    <h2><i class="fas fa-hashtag"></i> Popular Topics</h2>
                    <div class="trending-topics" id="trendingTopics">
                        <div class="loading">Loading popular topics...</div>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(trendingContent);

        // Setup event listeners
        this.setupEventListeners();

        // Load initial content
        await this.loadTrendingData('today');
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
                this.loadTrendingData(filter);
            });
        });
    }

    /**
     * Load trending data based on filter
     * @param {string} filter - Time filter (today, week, month, all)
     */
    async loadTrendingData(filter) {
        await Promise.all([
            this.loadTrendingPosts(filter),
            this.loadTrendingTopics(filter)
        ]);
    }

    /**
     * Load trending posts based on engagement metrics
     * @param {string} filter - Time filter
     */
    async loadTrendingPosts(filter) {
        const postsContainer = document.getElementById('trendingPosts');
        if (!postsContainer) return;

        try {
            postsContainer.innerHTML = '<div class="loading">Loading trending posts...</div>';

            // Fetch all posts first
            const allPosts = await this.app.postManager.fetchForumPosts();

            // Fetch engagement data for each post
            const postsWithEngagement = await Promise.all(
                allPosts.map(async (post) => {
                    try {
                        // Fetch likes/dislikes for the post
                        const reactions = await this.app.getReactionManager().getPostReactions(post.id);

                        // Fetch comments count
                        const comments = await this.app.getCommentManager().getPostComments(post.id);

                        // Calculate engagement score
                        const likes = reactions?.likes || 0;
                        const dislikes = reactions?.dislikes || 0;
                        const commentsCount = Array.isArray(comments) ? comments.length : 0;

                        // Engagement score: likes + comments - dislikes (weighted)
                        const engagementScore = likes + (commentsCount * 2) - (dislikes * 0.5);

                        return {
                            ...post,
                            likes,
                            dislikes,
                            commentsCount,
                            engagementScore
                        };
                    } catch (error) {
                        console.error(`Error fetching engagement for post ${post.id}:`, error);
                        return {
                            ...post,
                            likes: 0,
                            dislikes: 0,
                            commentsCount: 0,
                            engagementScore: 0
                        };
                    }
                })
            );

            // Sort by engagement score and take top 10
            const trendingPosts = postsWithEngagement
                .sort((a, b) => b.engagementScore - a.engagementScore)
                .slice(0, 10);

            if (trendingPosts.length === 0) {
                postsContainer.appendChild(this.createEmptyStateElement(
                    'No trending posts found.',
                    'fas fa-chart-line'
                ));
                return;
            }

            // Render trending posts with interactive reaction buttons
            postsContainer.innerHTML = trendingPosts.map((post, index) => `
                <div class="trending-post-item post-card" data-id="${post.id}">
                    <div class="post-content">
                        <div class="post-header">
                            <img src="http://localhost:8080${post.avatar_url || '/static/pictures/default-avatar.png'}"
                                 alt="${post.username}" class="post-avatar">
                            <div class="post-meta">
                                <h3 class="post-title">${post.title}</h3>
                                <div class="post-author">by ${post.username}</div>
                                <div class="post-date">${this.formatDate(post.created_at)}</div>
                            </div>
                        </div>
                        ${post.image_url ? `
                            <div class="post-image-container">
                                <img src="http://localhost:8080${post.image_url}" alt="Post image" class="trending-post-image">
                            </div>
                        ` : ''}
                        <div class="post-snippet">${this.truncateContent(post.content, 150)}</div>

                        <!-- Interactive reaction buttons -->
                        <div class="post-actions">
                            <div class="action-buttons">
                                <button class="reaction-btn like-btn" data-id="${post.id}">
                                    <i class="fas fa-thumbs-up"></i>
                                    <span class="like-count">${post.likes}</span>
                                </button>
                                <button class="reaction-btn dislike-btn" data-id="${post.id}">
                                    <i class="fas fa-thumbs-down"></i>
                                    <span class="dislike-count">${post.dislikes}</span>
                                </button>
                                <button class="reaction-btn comment-btn" data-id="${post.id}">
                                    <i class="fas fa-comment"></i>
                                    <span class="comment-count">${post.commentsCount}</span>
                                </button>
                                <div class="engagement-score">
                                    <i class="fas fa-fire"></i>
                                    <span>${Math.round(post.engagementScore)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Hidden comment section for consistency -->
                    <div class="post-comment" data-id="${post.id}" style="display: none;">
                        <div class="comments-container">
                            <h4>Comments</h4>
                        </div>
                        <div class="write-comment-box"></div>
                    </div>
                </div>
            `).join('');

            // Initialize reaction system for trending posts
            await this.initializeTrendingPostReactions();

            // Add click handlers for post titles/content (not the whole card)
            postsContainer.querySelectorAll('.post-title, .post-snippet').forEach(element => {
                element.style.cursor = 'pointer';
                element.addEventListener('click', () => {
                    const postCard = element.closest('.trending-post-item');
                    const postId = postCard.getAttribute('data-id');
                    this.app.router.navigate(`/post/${postId}`);
                });
            });

        } catch (error) {
            console.error('Error loading trending posts:', error);
            postsContainer.innerHTML = '';
            postsContainer.appendChild(this.createErrorElement(
                'Failed to load trending posts.',
                () => this.loadTrendingPosts(filter)
            ));
        }
    }

    /**
     * Initialize reaction system for trending posts
     */
    async initializeTrendingPostReactions() {
        try {
            // Load post reactions (likes/dislikes)
            await this.app.getReactionManager().loadPostsLikes();

            // Initialize comment forms for trending posts
            this.app.getCommentManager().initializeCommentForms();

            // Load comment reactions
            await this.app.getReactionManager().loadCommentsLikes();

            console.log('Trending post reactions initialized');
        } catch (error) {
            console.error('Error initializing trending post reactions:', error);
        }
    }

    /**
     * Load trending topics based on category usage
     * @param {string} filter - Time filter
     */
    async loadTrendingTopics(filter) {
        const topicsContainer = document.getElementById('trendingTopics');
        if (!topicsContainer) return;

        try {
            topicsContainer.innerHTML = '<div class="loading">Loading popular topics...</div>';

            // Fetch categories and posts to calculate trending topics
            const [categories, posts] = await Promise.all([
                this.app.getCategoryManager().getCategories(),
                this.app.postManager.fetchForumPosts()
            ]);

            // Count posts per category
            const categoryCount = {};
            const categoryNames = {};

            // Initialize category data
            if (categories && Array.isArray(categories)) {
                categories.forEach(category => {
                    categoryCount[category.id] = 0;
                    categoryNames[category.id] = category.name;
                });
            }

            // Count posts in each category
            if (posts && Array.isArray(posts)) {
                posts.forEach(post => {
                    if (post.category_ids && Array.isArray(post.category_ids)) {
                        post.category_ids.forEach(categoryId => {
                            if (categoryCount[categoryId] !== undefined) {
                                categoryCount[categoryId]++;
                            }
                        });
                    }
                });
            }

            // Convert to array and sort by count
            const trendingTopics = Object.entries(categoryCount)
                .map(([categoryId, count]) => ({
                    id: categoryId,
                    name: categoryNames[categoryId] || `Category ${categoryId}`,
                    count
                }))
                .filter(topic => topic.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8); // Top 8 trending topics

            if (trendingTopics.length === 0) {
                topicsContainer.appendChild(this.createEmptyStateElement(
                    'No trending topics found.',
                    'fas fa-hashtag'
                ));
                return;
            }

            topicsContainer.innerHTML = trendingTopics.map((topic, index) => `
                <div class="trending-topic-item" data-category-id="${topic.id}">
                    
                    <div class="topic-info">
                        <span class="topic-name">${topic.name}</span>
                        <span class="topic-count">${topic.count} post${topic.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="topic-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            `).join('');

            // Add click handlers for topics
            topicsContainer.querySelectorAll('.trending-topic-item').forEach(item => {
                item.addEventListener('click', () => {
                    const categoryId = item.getAttribute('data-category-id');
                    this.app.router.navigate(`/category/${categoryId}`);
                });
            });

        } catch (error) {
            console.error('Error loading trending topics:', error);
            topicsContainer.innerHTML = '';
            topicsContainer.appendChild(this.createErrorElement(
                'Failed to load trending topics.',
                () => this.loadTrendingTopics(filter)
            ));
        }
    }

    /**
     * Truncate content to specified length
     * @param {string} content - Content to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated content
     */
    truncateContent(content, maxLength) {
        if (!content) return '';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
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
