
let forumPosts;
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
        handleCommentWriting();
    
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

document.addEventListener("click", async (event) => {
    const likeBtn = event.target.closest(".like-btn");
    const dislikeBtn = event.target.closest(".dislike-btn");
    const commentBtn = event.target.closest(".comment-btn");

    if (likeBtn) {
        const postID = likeBtn.dataset.id;
        const response = await fetch(`http://localhost:8080/api/likes/toggle`, {
            method: "POST",
            body: JSON.stringify({ post_id: parseInt(postID), type: "like" }),
            headers: { "Content-Type": "application/json" }
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
            headers: { "Content-Type": "application/json" }
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
                commentItem.innerHTML = `
                    <div class="comment-avatar">
                        <img class="post-author-img" src="http://localhost:8080${comment.avatar_url}" />
                    </div>
                    <div class="comment-details">
                        <p class="comment-content"> <strong>${comment.username}:</strong> ${comment.content} </p>
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

function handleCommentWriting() {
    const postComments = document.querySelectorAll(`.post-card .post-comment`);
    postComments.forEach(postCommentSection => {
        // const postID = postCommentSection.getAttribute('data-id');
        const commentBox = document.createElement('div');
        commentBox.classList.add('write-comment-box');        
        commentBox.innerHTML = `
            <form class="comment-box-form">
                <textarea type="text" placeholder="Write comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">send</button>
            </form>
    `;

    postCommentSection.appendChild(commentBox);

    });

    // for comment replies

    const commentReplyBtns = document.querySelectorAll(".comment-reply-btn");
    commentReplyBtns.forEach(replyBtn => {
        replyBtn.addEventListener('click', function (e) {
            const commentID = e.currentTarget.getAttribute('data-id');
            // console.log('target', replyBtn );
            const postComments = e.target.closest(`.post-card .post-comment`);
            const postID = postComments.getAttribute('data-id');
            // console.log('post comments', postComments);
            // console.log('postid', postID);
            // console.log('commentid', commentID);
            const replyPostComment = document.querySelector(`.post-card .post-comment[data-id="${postID}"] .write-comment-box`);
            replyPostComment.innerHTML = "";
            replyPostComment.innerHTML = `
                <div class="reply-comment-header">
                <div><p><em>Reply to ...</em></p></div>
                <button class="close-reply">Close</button>
                </div>
                <div class="comment">
                    <div class="comment-avatar">
                        <img class="post-author-img" src="http://localhost:8080/avatar_url" alt=username/>
                    </div>
                    <div class="comment-details">
                        <p class="comment-content"> <strong>recipient comment id(${commentID}):</strong> comment content shown here. Smart contract security is crucial. Unreal Engine tips are very practical. ............ </p>
                        <div class="comment-footer">                            
                            <p class="comment-time">10 min ago</p>
                        </div>
                    </div>
                </div>
                <form class="comment-box-form">
                    <textarea type="text" placeholder="Reply to username goes here...." cols="30" rows="1" required autocomplete="off"></textarea>
                    <button type="submit">send</button>
                </form>
            `;

            console.log(replyPostComment);            
        });
    });
    
    // close reply section
    document.addEventListener('click', function (e) {

    if (e.target.matches('.close-reply')) {
        const parentCommentSection = e.target.closest('.post-card .post-comment');
        console.log("parent comment section", parentCommentSection)
        const commentReplyPostId = parentCommentSection.getAttribute('data-id');
        console.log("post-id", commentReplyPostId);
        const replyPostComment = document.querySelector(`.post-card .post-comment[data-id="${commentReplyPostId}"] .write-comment-box`);
        replyPostComment. innerHTML = "";
        replyPostComment.innerHTML = `
            <form class="comment-box-form">
                <textarea type="text" placeholder="Write comment..." cols="30" rows="1" required autocomplete="off"></textarea>
                <button type="submit">send</button>
            </form>
    `;

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