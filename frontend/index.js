// ================== API ENDPOINTS ==================
const API_BASE_URL = "http://localhost:8080/api";

// ================== AUTHENTICATION ==================
// Check if user is logged in
async function fetchUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/user`, { credentials: "include" });
        if (!response.ok) {
            window.location.href = "login.html"; // Redirect to login if not authenticated
        }
        const user = await response.json();
        document.querySelector(".profile .handle h3").textContent = user.username;
        document.querySelector(".profile .handle p").textContent = `@${user.username}`;
        document.querySelector(".profile-picture img").src = user.profilePicture || "default-avatar.png";
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}

// Logout function
async function logout() {
    await fetch(`${API_BASE_URL}/logout`, { method: "POST", credentials: "include" });
    window.location.href = "login.html"; // Redirect to login page after logout
}

// Attach logout to settings menu (Assuming a logout button exists)
document.querySelector(".menu-item:last-child").addEventListener("click", logout);

// ================== FETCH POSTS ==================
async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const posts = await response.json();
        renderPosts(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}

// Render posts dynamically
function renderPosts(posts) {
    const feedsContainer = document.querySelector(".feeds");
    feedsContainer.innerHTML = ""; // Clear existing content

    posts.forEach((post) => {
        const postElement = document.createElement("div");
        postElement.classList.add("feed");
        postElement.innerHTML = `
            <div class="head">
                <div class="user">
                    <div class="profile-picture">
                        <img src="${post.userProfile || 'default-avatar.png'}">
                    </div>
                    <div class="info">
                        <h3>${post.username}</h3>
                        <small>${new Date(post.created_at).toLocaleString()}</small>
                    </div>
                </div>
            </div>
            <div class="photo">
                <img src="${post.image || 'default-post.jpg'}">
            </div>
            <div class="action-buttons">
                <span class="like" data-post-id="${post.id}"><i class="uil uil-heart"></i> Like</span>
                <span class="comment" data-post-id="${post.id}"><i class="uil uil-comment-dots"></i> Comment</span>
            </div>
            <div class="liked-by">
                <p>Liked by <b>${post.likes}</b> users</p>
            </div>
            <div class="caption">
                <p><b>${post.username}</b> ${post.content}</p>
            </div>
        `;
        feedsContainer.appendChild(postElement);
    });

    attachLikeHandlers();
}

// ================== HANDLE POST CREATION ==================
document.querySelector(".create-post").addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.querySelector("#create-post").value;

    if (!content.trim()) return;

    try {
        await fetch(`${API_BASE_URL}/posts/create`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        document.querySelector("#create-post").value = ""; // Clear input field
        fetchPosts(); // Refresh posts
    } catch (error) {
        console.error("Error creating post:", error);
    }
});

// ================== HANDLE LIKES ==================
function attachLikeHandlers() {
    document.querySelectorAll(".like").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const postId = btn.getAttribute("data-post-id");

            try {
                await fetch(`${API_BASE_URL}/likes/toggle`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ post_id: parseInt(postId) }),
                });
                fetchPosts(); // Refresh posts to update like count
            } catch (error) {
                console.error("Error liking post:", error);
            }
        });
    });
}

// ================== INITIALIZE PAGE ==================
fetchUserData();
fetchPosts();
