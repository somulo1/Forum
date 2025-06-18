import { ApiService } from './api.mjs';
import { renderPostFeed } from './post.mjs';

/**
 * Renders the Trending Posts view (top 5 by like count).
 */
export async function renderTrendingView() {
    const postFeed = document.getElementById('postFeed');
    postFeed.innerHTML = '';
    try {
        const posts = await ApiService.getPosts();
        const postsWithLikes = await Promise.all(posts.map(async (post) => {
            try {
                const reaction = await ApiService.getReactionsForPost(post.id);
                return { ...post, totalLikes: reaction.likes || 0 };
            } catch {
                return { ...post, totalLikes: 0 };
            }
        }));

        const trendingPosts = postsWithLikes
            .sort((a, b) => b.totalLikes - a.totalLikes)
            .slice(0, 5);

        const trendingHeader = document.createElement('div');
        trendingHeader.classList.add('trending-header', 'post-card');
        trendingHeader.innerHTML = `
            <div class="post-header">
                <div class="post-author-info">
                    <i class="fas fa-fire" style="font-size: 2rem; color: var(--accent-color);"></i>
                    <span class="post-author-name">Top 5 Trending Posts</span>
                </div>
            </div>
        `;
        postFeed.appendChild(trendingHeader);
        await renderPostFeed(trendingPosts);
    } catch (error) {
        postFeed.innerHTML = `<div class="error-message">Failed to load trending posts.</div>`;
    }
}