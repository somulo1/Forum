let forumPosts;

let sampleReplies = [
    {
        "id": 8,
        "user_id": "8cab6c13-6f8f-4a30-90db-d34c37e90457",
        "username": "james_arch",
        "avatar_url": "/static/pictures/icon6.png",
        "post_id": 3,
        "content": "Serverless architecture is the future.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    },
    {
        "id": 10,
        "user_id": "71caaa69-9ae5-46e7-b77c-335bf371c6a9",
        "username": "david_block",
        "avatar_url": "/static/pictures/icon10.png",
        "post_id": 3,
        "content": "Advanced TypeScriptThe issue is most likely due to the attribute value not being quoted. In CSS selectors, if an attribute value is purely numeric or contains special characters, it should be quoted. types are fascinating.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    },
    {
        "id": 18,
        "user_id": "8cab6c13-6f8f-4a30-90db-d34c37e90457",
        "username": "james_arch",
        "avatar_url": "/static/pictures/icon6.png",
        "post_id": 3,
        "content": "Serverless architecture is the future.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    },
    {
        "id": 8,
        "user_id": "8cab6c13-6f8f-4a30-90db-d34c37e90457",
        "username": "james_arch",
        "avatar_url": "/static/pictures/icon6.png",
        "post_id": 3,
        "content": "Serverless architecture is the future.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    },
    {
        "id": 10,
        "user_id": "71caaa69-9ae5-46e7-b77c-335bf371c6a9",
        "username": "david_block",
        "avatar_url": "/static/pictures/icon10.png",
        "post_id": 3,
        "content": "Advanced TypeScriptThe issue is most likely due to the attribute value not being quoted. In CSS selectors, if an attribute value is purely numeric or contains special characters, it should be quoted. types are fascinating.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    },
    {
        "id": 18,
        "user_id": "8cab6c13-6f8f-4a30-90db-d34c37e90457",
        "username": "james_arch",
        "avatar_url": "/static/pictures/icon6.png",
        "post_id": 3,
        "content": "Serverless architecture is the future.",
        "created_at": "2025-05-18T14:52:33Z",
        "updated_at": "0001-01-01T00:00:00Z"
    }
];

document.addEventListener("DOMContentLoaded", async () => {
    renderCreatePostSection();
    forumPosts = await fetchForumPosts();
    await renderPosts(forumPosts);
    await renderCategories();
    setupAuthButtons();
});


// function to render nav logo
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

//Fetch all posts

async function fetchForumPosts() {

    try {
        const response = await fetch("http://localhost:8080/api/posts");
        if (!response.ok) throw new Error("Failed to fetch posts");
        const posts = await response.json();

        return posts;
    } catch (error) {
        console.error("Error fetching posts:", error);
    }

}

// Render Forum Posts
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
                <div class="post-comment hidden" data-id="${post.id}">
                    <div class="comments-container">
                        <h4>Comments</h4>
                    </div>              
                </div>
                
            `;

            if (post.image_url) {
                const el = postDiv.querySelector(".post-image");
                el.classList.remove("hidden");
            }
            postContainer.appendChild(postDiv);
        }
        await loadPostsLikes();
        await loadPostsComments();
        await loadCommentsLikes();
        initializeCommentForms();
    
}
// Render create post with image upload and category selection
function renderCreatePostSection() {
    const createPostContainer = document.getElementById("createPostSection");

    if (!createPostContainer) {
        console.error("Missing #createPostForm in index.html");
        return;
    }

    createPostContainer.innerHTML = `
        <form id="postForm" class="create-post-box" method="post" enctype="multipart/form-data">
            <!-- Title Field -->
            <div class="form-group" style="margin-bottom: 0rem;">
                <input type="text" id="postTitle" name="title" placeholder="Post title" 
                       style="width: 100%; padding: 8px; margin-bottom: 0px; border: 1px solid #ccc; border-radius: 8px;" />
            </div>

            <!-- Textarea and Post Button Side-by-Side -->
            <div style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem;">
                <textarea id="postInput" name="content" placeholder="What's on your mind?" aria-label="Post content"
                    style="flex: 1; min-height: 40px;"></textarea>
                <button type="submit" id="postBtn" class="post-btn" style="height: 40px;">Post</button>
            </div>

            <!-- Image and Categories -->
            <div class="post-options-row" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <!-- Image Upload -->
                <div class="form-group" style="flex: 1;">
                    <label for="postImage" style="display: relative; align-items: center; gap: 0.5rem; cursor: pointer;">
                    Add Image:
                    </label>
                    <input type="file" id="postImage" name="image" accept="image/*" />
                </div>

                <!-- Category Selector -->
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
                            <!-- Categories will load here -->
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;

    setupCategoryDropdown();
    bindPostFormSubmit();
}

function setupCategoryDropdown() {
    // Toggle dropdown
    document.getElementById("dropdownToggle").addEventListener("click", () => {
        const menu = document.getElementById("dropdownMenu");
        menu.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("categoryDropdown");
        if (!dropdown.contains(e.target)) {
            document.getElementById("dropdownMenu").classList.add("hidden");
        }
    });

    // Load categories dynamically
    fetch('http://localhost:8080/api/categories')
        .then(res => res.json())
        .then(categories => {
            const menu = document.getElementById("dropdownMenu");
            menu.innerHTML = "";
            categories.forEach(cat => {
                const item = document.createElement("label");
                item.style.display = "block";
                item.style.padding = "5px 10px";
                item.innerHTML = `
                    <input type="checkbox" name="category_names[]" value="${cat.name}" />
                    ${cat.name}
                `;
                menu.appendChild(item);
            });
        })
        .catch(err => console.error("Failed to load categories:", err));
}

function bindPostFormSubmit() {
    const form = document.getElementById("postForm");
    if (!form) return;

    form.addEventListener("submit", handlePostFormSubmit);
}

async function handlePostFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const title = formData.get("title").trim();
    const content = formData.get("content").trim();
    const selectedCategories = Array.from(form.querySelectorAll('input[name="category_names[]"]:checked'));

    if (!title) {
        alert("Title is required.");
        return;
    }

    if (!content) {
        alert("Your post can't be empty!");
        return;
    }

    if (selectedCategories.length === 0) {
        alert("Please select at least one category.");
        return;
    }

    // Add category names to formData
    selectedCategories.forEach(cb => {
        formData.append("category_names[]", cb.value);
    });

    try {
        const response = await fetch('http://localhost:8080/api/posts/create', {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const result = await response.json();
        alert("Post created successfully!");
        console.log("New Post:", result);
        form.reset();
    } catch (err) {
        console.error("Error submitting post:", err);
        alert("Failed to create post. Please try again.");
    }
}

// Fetch & Render Categories
async function renderCategories() {
    try {
        const response = await fetch("http://localhost:8080/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const categories = await response.json();

        const categoryContainer = document.getElementById("categoryFilter");
        categoryContainer.innerHTML = `<h3>Categories</h3>
                        <div class="menu-item" category-id="0"><i class="fas fa-tag"></i> All</div>
        `;

        categories.forEach(category => {
            const categoryItem = document.createElement("div");
            categoryItem.classList.add("menu-item");
            categoryItem.setAttribute("category-id", `${category.id}`);
            categoryItem.innerHTML = `<i class="fas fa-tag"></i> ${category.name}`;
            categoryContainer.appendChild(categoryItem);
        });

        const categoryBtns = document.querySelectorAll("#categoryFilter .menu-item");
        let filteredPosts = [];
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', function () {
            let catId = this.getAttribute('category-id');
            if (parseInt(catId)==0){
                filteredPosts = forumPosts;
            } else {
                forumPosts.forEach(post => {
                let postCat = post.category_ids;
                if (postCat.includes(parseInt(catId))) {
                    filteredPosts.push(post);
                }
                });
            }
            
            renderPosts(filteredPosts);
            filteredPosts = [];
            
            });
        });
        
        
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}



// Logout Functionality
async function logoutUser() {
    try {
        const response = await fetch("http://localhost:8080/api/logout", { 
            method: "POST",
            credentials: "include"  // Important for cookies
        });
        
        if (response.ok) {
            // Update UI to show login/signup buttons
            const navAuth = document.getElementById("navAuth");
            navAuth.innerHTML = `
                <button class="login-btn">Login</button>
                <button class="signup-btn">Sign Up</button>
            `;
            
            // Reattach event listeners to the new buttons
            const loginBtn = document.querySelector(".login-btn");
            const signupBtn = document.querySelector(".signup-btn");
            
            loginBtn.addEventListener("click", () => {
                const authModal = document.getElementById('authModal');
                document.querySelector('.main-container').classList.add('blur');
                authModal.classList.remove('hidden');
                document.querySelector('.cont').classList.remove('s-signup');
            });
            
            signupBtn.addEventListener("click", () => {
                const authModal = document.getElementById('authModal');
                document.querySelector('.main-container').classList.add('blur');
                authModal.classList.remove('hidden');
                document.querySelector('.cont').classList.add('s-signup');
            });
        } else {
            console.error("Logout failed");
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

// Show Login Modal
function showLoginModal() {
    document.getElementById("authModal").classList.add("show");
}

document.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".like-btn");
    const dislikeBtn = event.target.closest(".dislike-btn");
    const commentBtn = event.target.closest(".comment-btn");

    if (likeBtn) {
        const postID = likeBtn.dataset.id;
        const response = await fetch(`http://localhost:8080/api/likes/toggle`, {
            method: "POST",
            body: JSON.stringify({ post_id: parseInt(postID), type: "like" }),
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
        });
        if (!response.ok){
            alert("User not logged in");
        }
        await loadPostsLikes();
        return; // prevent double-handling
    }

    if (dislikeBtn) {
        const postID = dislikeBtn.dataset.id;
        const response = await fetch(`http://localhost:8080/api/likes/toggle`, {
            method: "POST",
            body: JSON.stringify({ post_id: parseInt(postID), type: "dislike" }),
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
        });
        if (!response.ok){
            alert("User not logged in");
        }
        await loadPostsLikes();
        return;
    }

    if (commentBtn) {
        const postId = commentBtn.dataset.id;
        const commentSection = document.querySelector(`.post-comment[data-id="${postId}"]`);
        if (commentSection) {
            commentSection.classList.toggle('hidden');
        }
    }
});

// load post likes & dislikes

async function loadPostsLikes() {
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
                // Optional: similar dynamic span logic for likes
                let span = btn.querySelector(".like-count");
                if (!span) {
                    span = document.createElement("span");
                    span.className = "like-count";
                    btn.appendChild(span);
                }
                span.textContent = `${result.likes === 0 ? '' : result.likes + ' '}Likes`;
            }

            if (btn.classList.contains('dislike-btn')) {
                let span = btn.querySelector(".dislike-count");
                if (!span) {
                    span = document.createElement("span");
                    span.className = "dislike-count";
                    btn.appendChild(span);
                }
                span.textContent = `${result.dislikes === 0 ? '' : result.dislikes + ' '}Dislikes`;
            }

        } catch (error) {
            console.log(error);
        }
    }
}

// load comments

async function loadPostsComments() {

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

            const commentSection = document.querySelector(`.post-card .post-comment[data-id="${postId}"] .comments-container`);


            for (const comment of result) {
                const commentItem = document.createElement('div');
                commentItem.classList.add('comment');
                commentItem.setAttribute('comment-id', `${comment.id}`);
                commentItem.innerHTML = `
                    <div class="comment-avatar">
                        <img class="post-author-img" src="http://localhost:8080${comment.avatar_url}" />
                    </div>
                    <div class="comment-details">
                        <p class="comment-content"> <strong><span class="comment-username">${comment.username}</span>:</strong> <span class="comment-text">${comment.content}</span></p>
                        <div class="comment-footer">
                            <div class="comment-actions">
                                <button class="reaction-btn comment-like-btn" data-id="${comment.id}"><i class="fas fa-thumbs-up"></i></button>
                                <button class="reaction-btn comment-dislike-btn"data-id="${comment.id}"><i class="fas fa-thumbs-down"></i></button>
                                <button class="reaction-btn comment-reply-btn" data-id="${comment.id}"><i class="fas fa-comment"></i></button>
                            </div>
                            <p class="comment-time">${getTimeAgo(comment.created_at)}</p>
                        </div>
                    </div>
                `;
                commentSection.appendChild(commentItem);
            }

            

        } catch (error) {
            console.log(error);
        }
    }
}

function loadReplyComments() {
    const replyCommentsSections = document.querySelectorAll('.reply-comments-container'); 

    console.log("replycommentsSection", replyCommentsSections);


    replyCommentsSections.forEach(replyCommentsSection => {
            sampleReplies.forEach(reply => {
                const replyComment = document.createElement('div');
            replyComment.classList.add('comment');
            replyComment.innerHTML = `
                    <div class="comment-avatar">
                        <img class="post-author-img" src="http://localhost:8080${reply.avatar_url}" />
                    </div>
                    <div class="comment-details">
                        <p class="comment-content"> <strong><span class="comment-username">${reply.username} <em>></em> alice_data</span></strong><br/><span class="comment-text">${reply.content}</span></p>
                        <div class="comment-footer">
                            <div class="comment-actions">
                                <button class="reaction-btn comment-like-btn" data-id="${reply.id}"><i class="fas fa-thumbs-up"></i></button>
                                <button class="reaction-btn comment-dislike-btn"data-id="${reply.id}"><i class="fas fa-thumbs-down"></i></button>
                                <button class="reaction-btn comment-reply-btn" data-id="${reply.id}"><i class="fas fa-comment"></i></button>
                            </div>
                            <p class="comment-time">${getTimeAgo(reply.created_at)}</p>
                        </div>
                    </div>
                `;
                replyCommentsSection.appendChild(replyComment);
            });

    });

}

function initializeCommentForms() {
    const commentContainers = document.querySelectorAll(`.post-card .post-comment`);
    commentContainers.forEach(commentContainer => {
        // const postID = commentContainer.getAttribute('data-id');
        const commentForm = document.createElement('div');
        commentForm.classList.add('write-comment-box');        
        commentForm.innerHTML = `
            <form class="comment-box-form">
                <textarea type="text" placeholder="Write comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">send</button>
            </form>
    `;

    commentContainer.appendChild(commentForm);

    });

     // Reply functionality

    const commentReplyBtns = document.querySelectorAll(".comment-reply-btn");
    commentReplyBtns.forEach(replyBtn => {
        replyBtn.addEventListener('click', function (e) {
            const commentID = e.currentTarget.getAttribute('data-id');
            const postComments = e.target.closest(`.post-card .post-comment`);
            const postID = postComments.getAttribute('data-id');

            const commentSection = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .comments-container`);
            commentSection.classList.add('hidden');
            
            const replyFormContainer = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .write-comment-box`);

            const originalCommentElement = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .comment[comment-id="${commentID}"]`);
            console.log("commentator details", originalCommentElement);
            const commenterAvatarSrc = originalCommentElement.querySelector('.comment-avatar img').getAttribute('src');
            const originalCommenterUsername = originalCommentElement.querySelector('.comment-details .comment-content span.comment-username').textContent;
            const originalCommenterText = originalCommentElement.querySelector('.comment-details .comment-content span.comment-text').textContent;
            const commentTimestamp = originalCommentElement.querySelector('.comment-details .comment-time').textContent;

            replyFormContainer.innerHTML = "";
            replyFormContainer.innerHTML = `
                <div class="reply-comment-header">
                    <div><p><em>Reply to ...</em></p></div>
                    <button class="close-reply">Cancel</button>
                </div>
                <div class="comment">
                    <div class="comment-avatar">
                        <img class="post-author-img" src="${commenterAvatarSrc}" alt=username/>
                    </div>
                    <div class="comment-details">
                        <p><strong>${originalCommenterUsername}:</strong>  ${originalCommenterText}</p>
                        <div class="comment-footer">
                            <div class="comment-actions">
                                <button class="reaction-btn comment-like-btn" data-id="${commentID}"><i class="fas fa-thumbs-up"></i></button>
                                <button class="reaction-btn comment-dislike-btn"data-id="${commentID}"><i class="fas fa-thumbs-down"></i></button>
                                <button class="reaction-btn comment-reply-btn" data-id="${commentID}"><i class="fas fa-comment"></i></button>
                            </div>
                            <p class="comment-time">${commentTimestamp}</p>
                        </div>
                    </div>
                </div>
                <div class="reply-comments-container">
                </div>
                <form class="comment-box-form" comment-id="${commentID}">
                    <textarea type="text" placeholder="Reply to @${originalCommenterUsername}..." cols="30" rows="1" required autocomplete="off"></textarea>
                    <button type="submit">send</button>
                </form>
            `;

            loadReplyComments();
            console.log(replyFormContainer);            
        });
    });
    
    // close reply handler
    document.addEventListener('click', function (e) {

    if (e.target.matches('.close-reply')) {
        const parentCommentSection = e.target.closest('.post-card .post-comment');
        console.log("parent comment section", parentCommentSection)
        const commentReplyPostId = parentCommentSection.getAttribute('data-id');
        console.log("post-id", commentReplyPostId);
        const replyFormContainer = document.querySelector(`.post-card .post-comment[data-id="${commentReplyPostId}"] .write-comment-box`);
        replyFormContainer. innerHTML = "";
        replyFormContainer.innerHTML = `
            <form class="comment-box-form post-id="${commentReplyPostId}">
                <textarea type="text" placeholder="Write comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">send</button>
            </form>
         `;

        const commentSection = document.querySelector(`.post-card .post-comment[data-id="${commentReplyPostId}"] .comments-container`);
            commentSection.classList.remove('hidden');

    }

    });

}

async function fetchOwner(Oid) {
    try {
        const response = await fetch(`http://localhost:8080/api/owner?user_id=${Oid}`); 
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const Ownresult = await response.json();
        return Ownresult;
} catch (error) {
    console.log(error);
}
}

    


// comments reactions
async function loadCommentsLikes() {

    const reactionBtns = document.querySelectorAll(".comment-actions .reaction-btn");

    for (const btn of reactionBtns) {
        const commentId = btn.getAttribute('data-id'); 
        try {
            const response = await fetch(`http://localhost:8080/api/likes/reactions?comment_id=${commentId}`); 
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (btn.classList.contains('comment-like-btn')) {
                btn.insertAdjacentHTML("beforeend", ` ${result.likes === 0 ? '' : result.likes}`);
            }
            if (btn.classList.contains('comment-dislike-btn')) {
                btn.insertAdjacentHTML("beforeend", ` ${result.dislikes === 0 ? '' : result.dislikes}`);
            }
            
        } catch (error) {
            console.log(error);
        }
    }
}

// Setup Authentication UI (moved to global scope)
async function setupAuthButtons() {
    const navAuth = document.getElementById("navAuth");

    try {
        const response = await fetch("http://localhost:8080/api/user", {
            credentials: "include"  // important to send cookies/session
        });
        
        if (response.ok) {
            const user = await response.json();
            // Show avatar + username + logout button
            navAuth.innerHTML = `
                <img src="http://localhost:8080${user.avatar_url || '/static/default.png'}" 
                     alt="User Avatar" 
                     style="width:32px; height:32px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px;">
                <span>${user.username}</span>
                <button class="logout-btn" style="margin-left:10px;">Logout</button>
            `;
            document.querySelector(".logout-btn").addEventListener("click", logoutUser);
        } else {
            // Show login/signup buttons for unauthenticated users
            navAuth.innerHTML = `
                <button class="login-btn">Login</button>
                <button class="signup-btn">Sign Up</button>
            `;
            const loginBtn = document.querySelector(".login-btn");
            const signupBtn = document.querySelector(".signup-btn");
            
            loginBtn.addEventListener("click", () => {
                const authModal = document.getElementById('authModal');
                document.querySelector('.main-container').classList.add('blur');
                authModal.classList.remove('hidden');
                document.querySelector('.cont').classList.remove('s-signup');
            });
            
            signupBtn.addEventListener("click", () => {
                const authModal = document.getElementById('authModal');
                document.querySelector('.main-container').classList.add('blur');
                authModal.classList.remove('hidden');
                document.querySelector('.cont').classList.add('s-signup');
            });
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
        navAuth.innerHTML = `
            <button class="login-btn">Login</button>
            <button class="signup-btn">Sign Up</button>
        `;
    }
}

// Initialize auth modal functionality
document.addEventListener("DOMContentLoaded", function() {
    const authModal = document.getElementById('authModal');
    const mainContainer = document.querySelector('.main-container');
    const cont = document.querySelector('.cont');

    // Function to show login form
    function showLoginForm() {
        cont.classList.remove('s-signup');
    }

    // Function to show signup form
    function showSignupForm() {
        cont.classList.add('s-signup');
    }

    // Login button click handler
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // console.log("Login button clicked!");
            mainContainer.classList.add('blur');
            authModal.classList.remove('hidden');
            showLoginForm();
        });
    }

    // Signup button click handler
    const signupBtn = document.querySelector('.signup-btn');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            console.log("Signup button clicked!");
            mainContainer.classList.add('blur');
            authModal.classList.remove('hidden');
            showSignupForm();
        });
    }

    // Toggle between login and signup using the sliding button
    const imgBtn = document.querySelector('.img-btn');
    if (imgBtn) {
        imgBtn.addEventListener('click', function() {
            cont.classList.toggle('s-signup');
        });
    }

    // Mobile toggle buttons
    const toggleSignup = document.querySelector('.toggle-signup');
    const toggleSignin = document.querySelector('.toggle-signin');

    if (toggleSignup) {
        toggleSignup.addEventListener('click', function(e) {
            e.preventDefault();
            showSignupForm();
        });
    }

    if (toggleSignin) {
        toggleSignin.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Close button handler
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            mainContainer.classList.remove('blur');
            authModal.classList.add('hidden');
        });
    }

    // Handle form submissions
    const signInBtn = document.querySelector('.sign-in .submit');
    if (signInBtn) {
        signInBtn.addEventListener('click', async function() {
            const email = document.querySelector('.sign-in input[type="email"]').value;
            const password = document.querySelector('.sign-in input[type="password"]').value;

            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch('http://localhost:8080/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',  // Important for cookies
                    body: JSON.stringify({ email, password }),
                });
                
                if (response.ok) {
                    // After successful login, fetch user data and update UI
                    const userResponse = await fetch("http://localhost:8080/api/user", {
                        credentials: "include"
                        
                    });
                    // console.log("userResponse", userResponse)

                    if (userResponse.ok) {
                        const user = await userResponse.json();
                        // console.log(user);
                        const navAuth = document.getElementById("navAuth");
                        navAuth.innerHTML = `
                            <img src="http://localhost:8080${user.avatar_url || '/static/default.png'}" 
                                 alt="User Avatar" 
                                 style="width:32px; height:32px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px;">
                            <span>${user.username}</span>
                            <button class="logout-btn" style="margin-left:10px;">Logout</button>
                        `;
                        document.querySelector(".logout-btn").addEventListener("click", logoutUser);
                    }
                    
                    mainContainer.classList.remove('blur');
                    authModal.classList.add('hidden');
                } else {
                    alert('Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    const signUpBtn = document.querySelector('.sign-up .submit');

    if (signUpBtn) {
        signUpBtn.addEventListener('click', async function () {
            const usernameInput = document.querySelector('.sign-up input[name="username"]');
            const emailInput = document.querySelector('.sign-up input[name="email"]');
            const passwordInput = document.querySelector('.sign-up input[name="password"]');
            const confirmPasswordInput = document.querySelector('.sign-up input[name="confirmPassword"]');
            const avatarInput = document.getElementById("avatar");
    
            const username = usernameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
    
            // --- Regex validation ---
            const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{6,}$/;
    
            if (!username || !email || !password || !confirmPassword) {
                alert('All fields are required.');
                return;
            }
    
            if (!usernameRegex.test(username)) {
                alert('Username must be 3–20 characters, no spaces or special characters.');
                return;
            }
    
            if (!emailRegex.test(email)) {
                alert('Invalid email format.');
                return;
            }
    
            if (!passwordRegex.test(password)) {
                alert('Password must be at least 6 characters and safe.');
                return;
            }
    
            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
    
            // File validation
            if (avatarInput.files.length > 0) {
                const file = avatarInput.files[0];
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Avatar must be JPG, PNG, or GIF format.');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    alert('Avatar size must be under 5MB.');
                    return;
                }
            }
    
            const formData = new FormData();
            formData.append("username", username);
            formData.append("email", email);
            formData.append("password", password);
            if (avatarInput.files.length > 0) {
                formData.append("avatar", avatarInput.files[0]);
            }
    
            try {
                const response = await fetch("http://localhost:8080/api/register", {
                    method: "POST",
                    body: formData
                    // ❌ Do NOT set headers like 'Content-Type': browser will handle it
                });
    
                if (response.ok) {
                    alert("Registration successful!");
                    mainContainer.classList.remove("blur");
                    authModal.classList.add("hidden");
                    location.reload();
                } else {
                    const errText = await response.text();
                    alert(`Registration failed: ${errText}`);
                }
            } catch (error) {
                console.error("Registration error:", error);
                alert("Registration failed. Please try again.");
            }
        });
    }
    
    // Handle form submission with Enter key
    authModal.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            const activeForm = cont.classList.contains('s-signup') ? signUpBtn : signInBtn;
            activeForm.click();
        }
    });
});