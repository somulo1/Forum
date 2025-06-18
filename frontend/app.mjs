// --- Constants & Configuration ---
const API_BASE_URL = "http://localhost:8080";

// --- Application State ---
/**
 * @typedef {Object} Post
 * @property {number} id
 * @property {string} title
 * @property {string} content
 * // ...other fields
 */

/** @type {{ posts: Post[], user: any, categories: any[] }} */
const AppState = {
    posts: [],
    user: null,
    categories: [],
};

// --- SPA Router ---
const routes = {
    home: renderFeedView,
    profile: renderProfileView,
    trending: renderTrendingView,
    saved: renderSavedView,
};

async function navigate(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    // Update the URL without a full page reload
    window.history.pushState({ view }, "", `/${view}`);
    await handleRoute();
}

async function handleRoute() {
    const path = window.location.pathname.replace("/", "") || "home";
    const view = routes[path] ? path : "home";

    // Clear main content areas before rendering the new view
    document.getElementById("createPostSection").innerHTML = '';
    const postFeed = document.getElementById("postFeed");
    postFeed.innerHTML = `<div class="loading">Loading...</div>`;

    if (routes[view]) {
        try {
            await routes[view]();
        } catch (error) {
            console.error(`Error rendering ${view} view:`, error);
            postFeed.innerHTML = `<div class="error-message">Failed to load view. Please try again later.</div>`;
        }
    }
    setActiveSidebar(view);
}

function setActiveSidebar(view) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    renderNavLogo();
    // setupAuthButtons(); // Assume this is defined elsewhere

    // Make sidebar links drive the SPA router instead of causing a page reload
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', navigate);
    });

    // Initial route handling on page load
    handleRoute();
});

// Handle browser back/forward button clicks
window.addEventListener("popstate", () => {
    handleRoute();
});

// --- Utility & Helper Functions ---

/**
 * Creates a DOM element safely, preventing XSS and improving performance.
 * @param {string} tag - The HTML tag name.
 * @param {object} [attributes={}] - An object of attributes (e.g., { class: 'post-card' }).
 * @param {(string|Node)[]} [children=[]] - An array of child nodes or strings.
 * @returns {HTMLElement} The created element.
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    for (const child of children) {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child) { // Ensure child is not null/undefined
            element.appendChild(child);
        }
    }
    return element;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return "a while ago";

    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return "Just now";
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return `${Math.floor(seconds)} seconds ago`;
}

function renderNavLogo() {
    const navLogoContainer = document.getElementById("navLogoContainer");
    if (navLogoContainer) {
        navLogoContainer.innerHTML = `<img src="${API_BASE_URL}/static/pictures/forum-logo.png" alt="Forum" class="nav-logo">`;
    }
}

// --- API Service Layer ---
// Consolidates all fetch calls into one place for easier management.
const ApiService = {
    async getPosts() {
        if (AppState.posts.length > 0) return AppState.posts; // Return from cache if available
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        AppState.posts = await response.json();
        console.log(AppState.posts)
        return AppState.posts;
    },
    async getUser() {
        if (AppState.user) return AppState.user; // Return from cache
        const response = await fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' });
        if (!response.ok) throw new Error('User not authenticated');
        AppState.user = await response.json();
        return AppState.user;
    },
    async getReactionsForPost(postId) {
        const response = await fetch(`${API_BASE_URL}/api/likes/reactions?post_id=${postId}`);
        if (!response.ok) return { likes: 0, dislikes: 0 }; // Fail gracefully
        return await response.json();
    }
    // ... other API calls like createPost, getCategories etc. would go here
};

// --- Component Rendering Functions ---

function renderPostCard(post) {
    // Using the createElement helper for security and performance.
    return createElement('div', { class: 'post-card', 'data-post-id': post.id }, [
        createElement('div', { class: 'post-header' }, [
            createElement('div', { class: 'post-author-info' }, [
                createElement('img', { class: 'post-author-img', src: `${API_BASE_URL}${post.avatar_url || '/static/pictures/icon1.png'}`, alt: 'Profile' }),
                createElement('span', { class: 'post-author-name' }, post.username),
            ]),
            createElement('span', { class: 'post-time' }, getTimeAgo(post.created_at)),
        ]),
        createElement('div', { class: 'post-content' }, [
            createElement('div', { class: 'post-title' }, post.title),
            post.image_url && createElement('div', { class: 'post-image' }, [
                createElement('img', { src: `${API_BASE_URL}${post.image_url}`, alt: 'post-image' })
            ]),
            createElement('div', { class: 'post-body' }, post.content),
        ]),
        createElement('div', { class: 'post-actions' }, [
            createElement('button', { class: 'reaction-btn like-btn', 'data-id': post.id }, [createElement('i', { class: 'fas fa-thumbs-up' })]),
            createElement('button', { class: 'reaction-btn dislike-btn', 'data-id': post.id }, [createElement('i', { class: 'fas fa-thumbs-down' })]),
            createElement('button', { class: 'reaction-btn comment-btn', 'data-id': post.id }, [createElement('i', { class: 'fas fa-comment' })]),
        ]),
        createElement('div', { class: 'post-comment hidden', 'data-id': post.id }, [
            createElement('div', { class: 'comments-container' }, [createElement('h4', {}, 'Comments')])
        ])
    ]);
}

async function renderPostFeed(posts) {
    const postContainer = document.getElementById("postFeed");
    postContainer.innerHTML = ""; // Clear loading message

    if (!posts || posts.length === 0) {
        postContainer.append(createElement('div', {class: 'info-message'}, 'No posts to display.'));
        return;
    }

    const postElements = posts.map(renderPostCard);
    postContainer.append(...postElements);
}

function renderCreatePostSection() {
    // This is mostly static, so innerHTML is acceptable, but bind events programmatically.
    const createPostContainer = document.getElementById("createPostSection");
    if (!createPostContainer) return;

    createPostContainer.innerHTML = `
        <form id="postForm" class="create-post-box">
            <h4 style="margin-top:0">Create a Post</h4>
            <div class="form-group">
                <input type="text" name="title" placeholder="Post title" required />
            </div>
            <textarea name="content" placeholder="What's on your mind?" required></textarea>
            <div class="post-options-row">
                 <input type="file" name="image" accept="image/*" />
                 <button type="submit" class="post-btn">Post</button>
            </div>
        </form>
    `;
    document.getElementById('postForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('Form submitted! Implement post creation logic in ApiService.');
    });
}

// --- SPA View Rendering Functions ---

async function renderFeedView() {
    renderCreatePostSection();
    const posts = await ApiService.getPosts();
    await renderPostFeed(posts);
}

async function renderProfileView() {
    try {
        const userData = await ApiService.getUser();
        // Fetch all posts to filter from; leverages the cache in ApiService
        const allPosts = await ApiService.getPosts();
        const userPosts = allPosts.filter(post => post.user_id === userData.id);

        // This is still an N+1 problem. IDEAL FIX: Backend includes like count in post data.
        let totalLikes = 0;
        await Promise.all(userPosts.map(async (post) => {
            const reactions = await ApiService.getReactionsForPost(post.id);
            totalLikes += reactions.likes || 0;
        }));

        const postFeed = document.getElementById('postFeed');
        postFeed.innerHTML = ''; // Clear loading message

        const profileHeader = createElement('div', { class: 'profile-header post-card' }, [
            createElement('div', {class: 'profile-info'}, `<h2>${userData.username}</h2>`), // Example, build this out
            createElement('div', {class: 'profile-stats'}, `Posts: ${userPosts.length} | Total Likes: ${totalLikes}`),
        ]);

        postFeed.append(profileHeader, createElement('h3', {}, 'My Posts'));
        await renderPostFeed(userPosts);

    } catch (error) {
        console.error('Profile view error:', error);
        document.getElementById("postFeed").innerHTML = `<div class="error-message">Please log in to view your profile.</div>`;
    }
}

async function renderTrendingView() {
    const allPosts = await ApiService.getPosts();
    
    const postsWithLikes = await Promise.all(allPosts.map(async (post) => {
        const reactions = await ApiService.getReactionsForPost(post.id);
        return { ...post, totalLikes: reactions.likes || 0 };
    }));

    const trendingPosts = postsWithLikes
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);
        
    const postFeed = document.getElementById('postFeed');
    postFeed.innerHTML = ''; // Clear loading

    postFeed.append(createElement('h3', {class: 'trending-header'}, 'Top 5 Trending Posts'));
    await renderPostFeed(trendingPosts);
}

function renderSavedView() {
    document.getElementById('postFeed').innerHTML = `
        <div class="saved-header post-card">
            <h3>Saved Posts</h3>
            <p>This feature will be implemented soon!</p>
        </div>
    `;
}
