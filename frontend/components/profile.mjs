import { ApiService } from './api.mjs';
import { AppState } from './state.mjs';
import { renderPostFeed } from './post.mjs';

/**
 * Renders the user's profile view, including stats and their posts.
 */
export async function renderProfileView() {
    const postFeed = document.getElementById('postFeed');
    postFeed.innerHTML = '';
    try {
        const user = await ApiService.getUser();
        const posts = await ApiService.getPosts();
        const userPosts = posts.filter(post => post.user_id === user.id);

        // Get user's total likes
        let totalLikes = 0;
        await Promise.all(userPosts.map(async (post) => {
            try {
                const response = await fetch(`http://localhost:8080/api/likes/reactions?post_id=${post.id}`);
                if (response.ok) {
                    const likeData = await response.json();
                    totalLikes += likeData.likes || 0;
                }
            } catch (error) {
                // Ignore errors for individual posts
            }
        }));

        // Profile header
        const profileHeader = document.createElement('div');
        profileHeader.classList.add('profile-header', 'post-card');
        profileHeader.innerHTML = `
            <div class="profile-banner" style="background: var(--bg-color); padding: 2rem; border-radius: var(--radius) var(--radius) 0 0;">
                <div class="profile-avatar" style="text-align: center; margin-bottom: 1rem;">
                    <img src="http://localhost:8080${user.avatar_url || '/static/pictures/default-avatar.png'}" 
                         alt="Profile" 
                         style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary-color); object-fit: cover;">
                </div>
                <div class="profile-info" style="text-align: center; color: var(--primary-color);">
                    <h2 style="margin-bottom: 0.5rem;">${user.username}</h2>
                    <p style="color: rgba(255,255,255,0.8);">${user.email}</p>
                </div>
            </div>
            <div class="profile-stats" style="display: flex; justify-content: space-around; padding: 1rem; border-top: 1px solid var(--border-color);">
                <div class="stat-item" style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold;">${userPosts.length}</div>
                    <div style="color: var(--muted-text);">Posts</div>
                </div>
                <div class="stat-item" style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold;">${totalLikes}</div>
                    <div style="color: var(--muted-text);">Total Likes</div>
                </div>
            </div>
            <div class="profile-posts-header" style="padding: 1rem; border-top: 1px solid var(--border-color);">
                <h3>My Posts</h3>
            </div>
        `;
        postFeed.appendChild(profileHeader);
        await renderPostFeed(userPosts);
    } catch (error) {
        postFeed.innerHTML = `<div class="error-message">Please log in to view your profile.</div>`;
    }
}