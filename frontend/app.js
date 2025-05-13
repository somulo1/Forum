document.addEventListener("DOMContentLoaded", async () => {
    await renderPosts();
    await renderCategories();
    setupAuthButtons();
    loadLikes();
    loadComments()
});

// function to render nav logo
function renderNavLogo() {
    const navLogoContainer = document.getElementById("navLogoContainer");

    if (!navLogoContainer) {
        console.error("Missing #navLogoContainer in index.html");
        return;
    }

    navLogoContainer.innerHTML = `
        <img src="../static/pictures/forum-logo.png" alt="Forum Logo" class="nav-logo">
    `;
}

// Ensure the logo is injected when the page loads
document.addEventListener("DOMContentLoaded", () => {
    renderNavLogo();
});


// getTimeAgo() returns the time that has passed (i.e "1 day ago.")
function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date))/1000);

    const timePeriods = {
        year: 365 * 24 * 60 * 60,       // 31536000
        month: 30 * 24 * 60 * 60,       // 2592000
        week: 7 * 24 * 60 * 60,         // 604800
        day: 24 * 60 * 60,              // 86400
        hour: 60 * 60,                  // 3600
        minute: 60,                     // 60
        second: 1                       // 1
      };

    for (const [timePeriod, unitSeconds] of Object.entries(timePeriods)) {
        const periodValue = Math.floor(seconds/unitSeconds);
        if (periodValue >= 1) {
            return `${periodValue} ${timePeriod}${periodValue === 1 ? '': 's'} ago.`;
        }
    }
    return 'Just now.';
}


// Fetch & Render Forum Posts
async function renderPosts() {
    try {
        const response = await fetch("http://localhost:8080/api/posts");
        if (!response.ok) throw new Error("Failed to fetch posts");
        const posts = await response.json();

        const postContainer = document.getElementById("postFeed");
        postContainer.innerHTML = "";

        posts.forEach(post => {

            const postDiv = document.createElement("div");
            postDiv.classList.add("post-card");
            postDiv.innerHTML = `
                <div class="post-header">
                    <div class="post-author-info">
                        <img class="post-author-img" src="${post.avatar_url || '../static/pictures/icon1.png'}" alt="Profile">
                        <span class="post-author-name">${post.username}</span>
                    </div>
                    <span class="post-time">${getTimeAgo(post.created_at)}</span>
                </div>
                <div class="post-content">
                    <div class="post-title">${post.title}</div>
                    <div class="post-image hidden">
                        <img src="http://localhost:8080${post.image_url || ''}" alt="post-image"/>
                    </div>
                    <div class="post-body">${post.content}</div>
                </div>
                <div class="post-actions">
                    <button class="reaction-btn like-btn" data-id="${post.id}"><i class="fas fa-thumbs-up"></i></button>
                    <button class="reaction-btn dislike-btn" data-id="${post.id}"><i class="fas fa-thumbs-down"></i></button>
                    <button class="reaction-btn comment-btn" data-id="${post.id}"><i class="fas fa-comment"></i></button>
                </div>
                
            `;

            if (post.image_url) {
                const el = postDiv.querySelector(".post-image");
                el.classList.remove("hidden");
            }
            postContainer.appendChild(postDiv);
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}
// render create post
function renderCreatePostSection() {
    const createPostContainer = document.getElementById("createPostSection");

    if (!createPostContainer) {
        console.error("Missing #createPostContainer in index.html");
        return;
    }

    createPostContainer.innerHTML = `
        <div class="create-post-box">
            <input type="text" id="postInput" placeholder="What's on your mind?" aria-label="Create a post" />
            <div class="post-options">
                <button class="post-option photo-btn"><i class="fas fa-camera"></i> Photo</button>
                <button class="post-option video-btn"><i class="fas fa-video"></i> Video</button>
                <button class="post-option event-btn"><i class="fas fa-calendar"></i> Event</button>
            </div>
        </div>
    `;

    // Attach event listeners for interactivity
    document.querySelector(".photo-btn").addEventListener("click", () => {
        alert("Photo upload coming soon!");
    });

    document.querySelector(".video-btn").addEventListener("click", () => {
        alert("Video upload feature coming soon!");
    });

    document.querySelector(".event-btn").addEventListener("click", () => {
        alert("Event creation feature coming soon!");
    });
}

// Ensure the section loads on page startup
document.addEventListener("DOMContentLoaded", async () => {
    renderCreatePostSection(); // Inject post creation section
    await renderPosts();
    await renderCategories();
    setupAuthButtons();
});


// Fetch & Render Categories
async function renderCategories() {
    try {
        const response = await fetch("http://localhost:8080/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const categories = await response.json();

        const categoryContainer = document.getElementById("categoryFilter");
        categoryContainer.innerHTML = "<h3>Categories</h3>";

        categories.forEach(category => {
            const categoryItem = document.createElement("div");
            categoryItem.classList.add("menu-item");
            categoryItem.innerHTML = `<i class="fas fa-tag"></i> ${category.name}`;
            categoryContainer.appendChild(categoryItem);
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Setup Authentication UI
async function setupAuthButtons() {
    const navAuth = document.getElementById("navAuth");

    try {
        const response = await fetch("http://localhost:8080/api/user");
        if (response.ok) {
            const user = await response.json();
            navAuth.innerHTML = `<button class="logout-btn">Logout (${user.username})</button>`;
            document.querySelector(".logout-btn").addEventListener("click", logoutUser);
        } else {
            navAuth.innerHTML = `
                <button class="login-btn">Login</button>
                <button class="signup-btn">Sign Up</button>
            `;
            document.querySelector(".login-btn").addEventListener("click", showLoginModal);
            document.querySelector(".signup-btn").addEventListener("click", showSignupModal);
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
        navAuth.innerHTML = `
            <button class="login-btn">Login</button>
            <button class="signup-btn">Sign Up</button>
        `;
    }
}


// Logout Functionality
async function logoutUser() {
    try {
        await fetch("http://localhost:8080/api/logout", { method: "POST" });
        location.reload();
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

// Show Login Modal
function showLoginModal() {
    document.getElementById("authModal").classList.add("show");
}

// Event Delegation for Likes & Comments
document.addEventListener("click", async (event) => {
    if (event.target.matches(".like-btn")) {
        const postID = event.target.dataset.id;
        await fetch(`http://localhost:8080/api/likes/toggle`, {
            method: "POST",
            body: JSON.stringify({ post_id: parseInt(postID) }),
            headers: { "Content-Type": "application/json" }
        });
        renderPosts();
    }
    if (event.target.matches(".comment-btn")) {
        // Open comment modal (You can expand this function)
        alert("Commenting feature coming soon!");
    }
});


// load post likes & dislikes

async function loadLikes() {

    const reactionBtns = document.querySelectorAll(".reaction-btn");

    for (const btn of reactionBtns) {
        const postId = btn.getAttribute('data-id'); 
        try {
            const response = await fetch(`http://localhost:8080/api/likes/reactions?post_id=${postId}`); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (btn.classList.contains('like-btn')) {
                btn.insertAdjacentHTML("beforeend", ` ${result.likes} Likes`);
            }
            if (btn.classList.contains('dislike-btn')) {
                btn.insertAdjacentHTML("beforeend", ` ${result.dislikes} Dislikes`);
            }
            
        } catch (error) {
            console.log(error);
        }
    }
}



// load comments

async function loadComments() {

    const commentBtns = document.querySelectorAll(".comment-btn");

    for (const btn of commentBtns) {
        const postId = btn.getAttribute('data-id'); 
        try {
            const response = await fetch(`http://localhost:8080/api/comments/get?post_id=${postId}`); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            btn.insertAdjacentHTML("beforeend", ` ${result.length} Comments`);


            console.log(result);           
            
        } catch (error) {
            console.log(error);
        }
    }
}
    