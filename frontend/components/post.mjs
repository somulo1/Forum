import { ApiService } from './api.mjs';
import { getTimeAgo } from './helpers.mjs';

/**
 * Renders the feed view: create post section and all posts.
 */
export async function renderFeedView() {
    renderCreatePostSection();
    const posts = await ApiService.getPosts();
    await renderPostFeed(posts);
}

/**
 * Renders the create post section.
 */
export function renderCreatePostSection() {
    const createPostContainer = document.getElementById("createPostSection");
    if (!createPostContainer) return;
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
    // Optionally, bind form events here
}

/**
 * Renders a list of posts into the postFeed container.
 * @param {Array} posts
 */
export async function renderPostFeed(posts) {
    const postContainer = document.getElementById("postFeed");
    postContainer.innerHTML = "";
    if (!posts || posts.length === 0) {
        postContainer.innerHTML = "<div class='post-card'>No posts to display.</div>";
        return;
    }
    for (const post of posts) {
        const postDiv = renderPostCard(post);
        postContainer.appendChild(postDiv);
    }
    // Optionally, load likes/comments, bind events, etc.
}

/**
 * Renders a single post card.
 * @param {Object} post
 * @returns {HTMLElement}
 */
export function renderPostCard(post) {
    const postDiv = document.createElement("div");
    postDiv.classList.add("post-card");
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-author-info">
                <img class="post-author-img" src="http://localhost:8080${post.avatar_url || '/static/pictures/icon1.png'}" alt="Profile">
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
    return postDiv;
}