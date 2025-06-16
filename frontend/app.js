// --- SPA Route handler setup ---
let forumPosts;

const routes = {
    home: renderFeedView,
    profile: renderProfileView,
    trending: renderTrendingView,
    saved: renderSavedView,
};

function handleRoute(view, pushState = true) {
    if (routes[view]) {
        routes[view]();
        if (pushState) {
            window.history.pushState({ view }, "", "/" + view);
        }
        setActiveSidebar(view);
    } else {
        routes.home();
        setActiveSidebar("home");
    }
}

function setActiveSidebar(view) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderNavLogo();
    setupAuthButtons();
    setupMenuHandlers();
    const path = window.location.pathname.replace("/", "") || "home";
    handleRoute(path);
});

window.addEventListener("popstate", (e) => {
    const view = e.state?.view || "home";
    handleRoute(view, false);
});

// --- Utility Functions ---

function renderNavLogo() {
    const navLogoContainer = document.getElementById("navLogoContainer");
    if (!navLogoContainer) {
        console.error("Missing #navLogoContainer in index.html");
        return;
    }
    navLogoContainer.innerHTML = `
        <img src="http://localhost:8080/static/pictures/forum-logo.png" alt="Forum" class="nav-logo">
    `;
}

function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date))/1000);
    const timePeriods = {
        year: 365 * 24 * 60 * 60,
        month: 30 * 24 * 60 * 60,
        week: 7 * 24 * 60 * 60,
        day: 24 * 60 * 60,
        hour: 60 * 60,
        minute: 60,
        second: 1
    };
    for (const [timePeriod, unitSeconds] of Object.entries(timePeriods)) {
        const periodValue = Math.floor(seconds/unitSeconds);
        if (periodValue >= 1) {
            return `${periodValue} ${timePeriod}${periodValue === 1 ? '': 's'} ago.`;
        }
    }
    return 'Just now.';
}

// --- Data Fetching ---

async function fetchForumPosts() {
    try {
        const response = await fetch("http://localhost:8080/api/posts");
        if (!response.ok) throw new Error("Failed to fetch posts");
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
}

// --- Rendering Functions ---

async function renderPosts(posts) {
    const postContainer = document.getElementById("postFeed");
    postContainer.innerHTML = "";
    for(const post of posts) {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post-card");
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-author-info">
                    <img class="post-author-img" src="http://localhost:8080${post.avatar_url || '../static/pictures/icon1.png'}" alt="Profile">
                    <span class="post-author-name">${post.username}</span>
                </div>
                <span class="post-time">${getTimeAgo(post.created_at)}</span>
            </div>
            <div class="post-content">
                <div class="post-title">${post.title}</div>
                <div class="post-image${post.image_url ? '' : ' hidden'}">
                    <img src="http://localhost:8080${post.image_url || ''}" alt="post-image"/>
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
        postContainer.appendChild(postDiv);
    }
    await loadPostsLikes();
    await loadPostsComments();
    await loadCommentsLikes();
    initializeCommentForms();
}

function renderCreatePostSection() {
    const createPostContainer = document.getElementById("createPostSection");
    if (!createPostContainer) {
        console.error("Missing #createPostForm in index.html");
        return;
    }
    createPostContainer.innerHTML = `
        <form id="postForm" class="create-post-box" method="post" enctype="multipart/form-data">
            <div class="form-group" style="margin-bottom: 0rem;">
                <input type="text" id="postTitle" name="title" placeholder="Post title" 
                       style="width: 100%; padding: 8px; margin-bottom: 0px; border: 1px solid #ccc; border-radius: 8px;" />
            </div>
            <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                <textarea id="postInput" name="content" placeholder="What's on your mind?" aria-label="Post content"
                    style="flex: 1; min-height: 40px;"></textarea>
                <button type="submit" id="postBtn" class="post-btn" style="height: 40px;">Post</button>
            </div>
            <div class="post-options-row" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group" style="flex: 1;">
                    <label for="postImage" style="display: relative; align-items: center; gap: 0.5rem; cursor: pointer;">
                    Add Image:
                    </label>
                    <input type="file" id="postImage" name="image" accept="image/*" />
                </div>
                <div class="form-group" style="flex: 1; position: relative;">
                    <label></label>
                    <div id="categoryDropdown" class="dropdown" style="position: relative;">
                        <div id="dropdownToggle" class="dropdown-toggle" tabindex="0" 
                             style="border: 1px solid #ccc; padding: 5px; cursor: pointer;">
                             Select categories
                        </div>
                        <div id="dropdownMenu" class="dropdown-menu hidden" 
                             style="position: absolute; background: white; border: 1px solid #ccc; 
                                    max-height: 150px; overflow-y: auto; width: 100%; z-index: 100;">
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;
    setupCategoryDropdown();
    bindPostFormSubmit();
}

// --- SPA View Functions ---

async function renderFeedView() {
    renderCreatePostSection();
    forumPosts = await fetchForumPosts();
    await renderPosts(forumPosts);
    await renderCategories();
}

async function renderProfileView() {
    const postFeed = document.getElementById('postFeed');
    postFeed.innerHTML = '';
    try {
        const userResponse = await fetch('http://localhost:8080/api/user', {
            credentials: 'include'
        });
        if (!userResponse.ok) throw new Error('Please log in to view your profile');
        const userData = await userResponse.json();
        const userPosts = forumPosts.filter(post => post.user_id === userData.id);

        let totalLikes = 0;
        await Promise.all(userPosts.map(async (post) => {
            try {
                const response = await fetch(`http://localhost:8080/api/likes/reactions?post_id=${post.id}`);
                if (response.ok) {
                    const likeData = await response.json();
                    totalLikes += likeData.likes || 0;
                }
            } catch (error) {
                console.error(`Error fetching likes for post ${post.id}:`, error);
            }
        }));

        const profileHeader = document.createElement('div');
        profileHeader.classList.add('profile-header', 'post-card');
        profileHeader.innerHTML = `
            <div class="profile-banner" style="background: var(--bg-color); padding: 2rem; border-radius: var(--radius) var(--radius) 0 0;">
                <div class="profile-avatar" style="text-align: center; margin-bottom: 1rem;">
                    <img src="http://localhost:8080${userData.avatar_url || '/static/pictures/default-avatar.png'}" 
                         alt="Profile" 
                         style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--primary-color); object-fit: cover;">
                </div>
                <div class="profile-info" style="text-align: center; color: var(--primary-color);">
                    <h2 style="margin-bottom: 0.5rem;">${userData.username}</h2>
                    <p style="color: rgba(255,255,255,0.8);">${userData.email}</p>
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
        await renderPosts(userPosts);
    } catch (error) {
        if (error.message === 'Please log in to view your profile') {
            const authModal = document.getElementById('authModal');
            document.querySelector('.main-container').classList.add('blur');
            authModal.classList.remove('hidden');
            document.querySelector('.cont').classList.remove('s-signup');
        }
        console.error('Error rendering profile view:', error);
    }
}

async function renderTrendingView() {
    const postFeed = document.getElementById('postFeed');
    postFeed.innerHTML = '';
    try {
        const postsWithLikes = await Promise.all(forumPosts.map(async (post) => {
            try {
                const response = await fetch(`http://localhost:8080/api/likes/reactions?post_id=${post.id}`);
                if (!response.ok) throw new Error('Failed to fetch likes');
                const likeData = await response.json();
                return { ...post, totalLikes: likeData.likes || 0 };
            } catch (error) {
                console.error(`Error fetching likes for post ${post.id}:`, error);
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
        await renderPosts(trendingPosts);
    } catch (error) {
        console.error('Error rendering trending view:', error);
    }
}

function renderSavedView() {
    const postFeed = document.getElementById('postFeed');
    const savedHeader = document.createElement('div');
    savedHeader.classList.add('saved-header', 'post-card');
    savedHeader.innerHTML = `
        <div class="post-header">
            <div class="post-author-info">
                <i class="fas fa-bookmark" style="font-size: 2rem; color: var(--accent-color);"></i>
                <span class="post-author-name">Saved Posts</span>
            </div>
        </div>
        <div class="post-content">
            <p>The saved posts feature will be implemented soon! Stay tuned for updates.</p>
            <p>You'll be able to save your favorite posts and find them here.</p>
        </div>
    `;
    postFeed.innerHTML = '';
    postFeed.appendChild(savedHeader);
}

// --- Tree shaking: Remove unused or duplicate code below this line ---

// (Remove any functions, variables, or event listeners that are not used by the SPA routing or view logic above)