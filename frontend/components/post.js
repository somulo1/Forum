export class PostManager {
    constructor() {
        this.posts = [];
        this.mainContent = document.getElementById('mainContent');
        this.createPostModal = document.getElementById('createPostModal');
        this.createPostSection = document.getElementById('createPostSection');
        this.currentFilter = 'all';
        this.currentView = 'feed';
        this.API_BASE_URL = "http://localhost:8080/api";
    }

    async init() {
        await this.loadPosts();
        this.renderCreatePostSection();
    }

    renderCreatePostSection() {
        const user = this.getCurrentUser();
        if (!user) return;

        this.createPostSection.innerHTML = `
            <div class="post-input">
                <img src="${user.avatar}" alt="${user.username}" class="avatar" onerror="this.onerror=null; this.src='path/to/default-avatar.png';">
                <input type="text" placeholder="What's on your mind?" id="createPostTrigger">
            </div>
            <div class="post-actions-bar">
                <div class="post-action">
                    <i class="fas fa-image"></i>
                    <span>Photo/Video</span>
                </div>
                <div class="post-action">
                    <i class="fas fa-smile"></i>
                    <span>Feeling/Activity</span>
                </div>
                <div class="post-action">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Location</span>
                </div>
            </div>
        `;

        document.getElementById('createPostTrigger').addEventListener('click', () => this.showCreatePostForm());
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }

    async loadPosts() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/posts`);
            if (!response.ok) {
                throw new Error(`Failed to fetch posts: ${response.statusText}`);
            }
            this.posts = await response.json();
            console.log("Fetched posts:", this.posts); // Log the fetched posts
            this.renderPosts();
        } catch (error) {
            console.error("Error loading posts:", error);
            this.posts = []; // Fallback to empty posts array
            this.renderPosts();
        }
        return this.posts
    }

   async renderPosts() {
       let filteredPosts = this.posts;
       const user = this.getCurrentUser();
   
       switch (this.currentView) {
           case 'feed':
               if (this.currentFilter !== 'all') {
                   filteredPosts = this.posts.filter(post =>
                       post.categoryIDs && post.categoryIDs.includes(this.currentFilter) // Ensure categoryIDs exists
                   );
               }
               break;
   
           case 'profile':
               if (user) {
                   try {
                       const response = await fetch(`${this.API_BASE_URL}/posts/user/${user.id}`);
                       if (response.ok) {
                           filteredPosts = await response.json();
                       } else {
                           console.error("Failed to fetch user posts:", response.statusText);
                           filteredPosts = this.posts.filter(post => post.userID === user.id); // Use userID for filtering
                       }
                   } catch (error) {
                       console.error("Error fetching user posts:", error);
                       filteredPosts = this.posts.filter(post => post.userID === user.id); // Fallback
                   }
               } else {
                   filteredPosts = [];
               }
               break;
   
           case 'saved':
               if (user) {
                   try {
                       const response = await fetch(`${this.API_BASE_URL}/posts/saved/${user.id}`);
                       if (response.ok) {
                           filteredPosts = await response.json();
                       } else {
                           console.error("Failed to fetch saved posts:", response.statusText);
                           filteredPosts = []; // Fallback to empty array
                       }
                   } catch (error) {
                       console.error("Error fetching saved posts:", error);
                       filteredPosts = []; // Fallback to empty array
                   }
               } else {
                   filteredPosts = [];
               }
               break;
       }
   
       // Render the filtered posts
       this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
       this.setupPostInteractions();
   }
    async fetchCategories() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/categories`);
            if (!response.ok) {
                const errorText = await response.text(); // Get the response as text
                throw new Error(`Failed to fetch categories: ${response.statusText}. Response: ${errorText}`);
            }
            const categories = await response.json();
            console.log("Fetched categories:", categories);
            return categories;
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Handle the error appropriately
        }
    }
    createPostHTML(post) {
        if (!post) {
            console.error("Post is undefined:", post);
            return `
                <div class="post-card error">
                    <p>Error: Post data is not available.</p>
                </div>
            `;
        }
    
        const categories = Array.isArray(post.category_ids) ? post.category_ids : []; // Fallback to an empty array
        const user = this.getCurrentUser();
        const timeAgo = this.getTimeAgo(new Date(post.timestamp));
    
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img 
                        src="${post.authorAvatar || 'path/to/default-avatar.png'}" 
                        alt="${post.author}" 
                        class="post-author-img"
                        onerror="this.onerror=null; this.src='path/to/default-avatar.png';"
                    >
                    <div class="post-author-info">
                        <span class="post-author">${post.author}</span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                    ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
                </div>
                <div class="post-categories">
                    ${categories.length > 0 ? categories.map(cat => `
                        <span class="category-tag">${cat}</span>
                    `).join('') : '<span class="no-categories">No categories</span>'}
                </div>
                <div class="post-actions">
                    ${user ? `
                        <button class="action-btn like-btn ${post.liked ? 'active' : ''}" data-post-id="${post.id}">
                            <i class="fas fa-thumbs-up"></i> Like
                        </button>
                        <button class="action-btn comment-btn" data-post-id="${post.id}">
                            <i class="fas fa-comment"></i> Comment
                        </button>
                    ` : `
                        <p class="login-prompt">Log in to interact with posts.</p>
                    `}
                </div>
            </div>
        `;
    }

    renderComments(comments, level = 0) {
        if (!comments || comments.length === 0) return '';
        
        const user = this.getCurrentUser();
        return `
            <div class="comments-section" style="margin-left: ${level * 20}px">
                ${comments.map(comment => `
                    <div class="comment" data-comment-id="${comment.id}">
                        <div class="comment-header">
                            <img src="${comment.authorAvatar}" alt="${comment.author}" class="comment-avatar" onerror="this.onerror=null; this.src='path/to/default-avatar.png';">
                            <strong>${comment.author}</strong>
                            <small>${this.getTimeAgo(new Date(comment.timestamp))}</small>
                        </div>
                        <div class="comment-content">${comment.content}</div>
                        <div class="comment-actions">
                            ${user ? `
                                <button class="action-btn like-btn ${comment.liked ? 'active' : ''}" data-comment-id="${comment.id}">
                                    <i class="fas fa-thumbs-up"></i> ${comment.likes}
                                </button>
                                <button class="action-btn dislike-btn ${comment.disliked ? 'active' : ''}" data-comment-id="${comment.id}">
                                    <i class="fas fa-thumbs-down"></i> ${comment.dislikes}
                                </button>
                                <button class="action-btn reply-btn" data-comment-id="${comment.id}">
                                    <i class="fas fa-reply"></i> Reply
                                </button>
                            ` : `
                                <span><i class="fas fa-thumbs-up"></i> ${comment.likes}</span>
                                <span><i class="fas fa-thumbs-down"></i> ${comment.dislikes}</span>
                            `}
                        </div>
                        ${comment.replies ? this.renderComments(comment.replies, level + 1) : ''}
                        ${user && comment.showReplyInput ? `
                            <div class="reply-input-container">
                                <img src="${user.avatar}" alt="${user.username}" class="comment-avatar" onerror="this.onerror=null; this.src='path/to/default-avatar.png';">
                                <input type="text" class="reply-input" placeholder="Write a reply..." data-comment-id="${comment.id}">
                                <button class="btn btn-primary submit-reply" data-comment-id="${comment.id}">Reply</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    setupPostInteractions() {
        const user = this.getCurrentUser();
        if (!user) return;

        // Like/Dislike posts
        document.querySelectorAll('.post-card .like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.action-btn').dataset.postId);
                this.handlePostLike(postId);
            });
        });

        document.querySelectorAll('.post-card .dislike-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.action-btn').dataset.postId);
                this.handlePostDislike(postId);
            });
        });

        // Save post
        document.querySelectorAll('.post-card .save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.closest('.action-btn').dataset.postId);
                this.handleSavePost(postId);
            });
        });

        // Like/Dislike comments
        document.querySelectorAll('.comment .like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.closest('.action-btn').dataset.commentId);
                this.handleCommentLike(commentId);
            });
        });

        document.querySelectorAll('.comment .dislike-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.closest('.action-btn').dataset.commentId);
                this.handleCommentDislike(commentId);
            });
        });

        // Reply to comments
        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.closest('.action-btn').dataset.commentId);
                this.showReplyInput(commentId);
            });
        });

        // Submit comments
        document.querySelectorAll('.submit-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.dataset.postId);
                const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
                this.handleComment(postId, input.value);
                input.value = '';
            });
        });

        // Submit replies
        document.querySelectorAll('.submit-reply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = parseInt(e.target.dataset.commentId);
                const input = document.querySelector(`.reply-input[data-comment-id="${commentId}"]`);
                this.handleReply(commentId, input.value);
                input.value = '';
            });
        });
    }

    async handlePostLike(postId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const post = this.posts.find(p => p.id === postId);
            const action = post.liked ? 'unlike' : 'like';
            
            const response = await fetch(`${this.API_BASE_URL}/posts/${postId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                // Update local post state
                if (post.disliked) {
                    post.dislikes--;
                    post.disliked = false;
                }
                
                if (post.liked) {
                    post.likes--;
                    post.liked = false;
                } else {
                    post.likes++;
                    post.liked = true;
                }
                
                this.renderPosts();
            } else {
                console.error(`Failed to ${action} post:`, response.statusText);
            }
        } catch (error) {
            console.error(`Error ${post.liked ? 'unliking' : 'liking'} post:`, error);
        }
    }

    async handlePostDislike(postId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const post = this.posts.find(p => p.id === postId);
            const action = post.disliked ? 'undislike' : 'dislike';
            
            const response = await fetch(`${this.API_BASE_URL}/posts/${postId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                // Update local post state
                if (post.liked) {
                    post.likes--;
                    post.liked = false;
                }
                
                if (post.disliked) {
                    post.dislikes--;
                    post.disliked = false;
                } else {
                    post.dislikes++;
                    post.disliked = true;
                }
                
                this.renderPosts();
            } else {
                console.error(`Failed to ${action} post:`, response.statusText);
            }
        } catch (error) {
            console.error(`Error ${post.disliked ? 'undisliking' : 'disliking'} post:`, error);
        }
    }

    async handleSavePost(postId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const post = this.posts.find(p => p.id === postId);
            const action = post.saved ? 'unsave' : 'save';
            
            const response = await fetch(`${this.API_BASE_URL}/posts/${postId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                // Update local post state
                post.saved = !post.saved;
                this.renderPosts();
            } else {
                console.error(`Failed to ${action} post:`, response.statusText);
            }
        } catch (error) {
            console.error(`Error ${post.saved ? 'unsaving' : 'saving'} post:`, error);
        }
    }

    async handleCommentLike(commentId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const comment = this.findComment(commentId);
            const action = comment.liked ? 'unlike' : 'like';
            
            const response = await fetch(`${this.API_BASE_URL}/comments/${commentId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                // Update local comment state
                if (comment.disliked) {
                    comment.dislikes--;
                    comment.disliked = false;
                }
                
                if (comment.liked) {
                    comment.likes--;
                    comment.liked = false;
                } else {
                    comment.likes++;
                    comment.liked = true;
                }
                
                this.renderPosts();
            } else {
                console.error(`Failed to ${action} comment:`, response.statusText);
            }
        } catch (error) {
            console.error(`Error handling comment like:`, error);
        }
    }

    async handleCommentDislike(commentId) {
        const user = this.getCurrentUser();
        if (!user) return;

        try {
            const comment = this.findComment(commentId);
            const action = comment.disliked ? 'undislike' : 'dislike';
            
            const response = await fetch(`${this.API_BASE_URL}/comments/${commentId}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            if (response.ok) {
                // Update local comment state
                if (comment.liked) {
                    comment.likes--;
                    comment.liked = false;
                }
                
                if (comment.disliked) {
                    comment.dislikes--;
                    comment.disliked = false;
                } else {
                    comment.dislikes++;
                    comment.disliked = true;
                }
                
                this.renderPosts();
            } else {
                console.error(`Failed to ${action} comment:`, response.statusText);
            }
        } catch (error) {
            console.error(`Error handling comment dislike:`, error);
        }
    }

    findComment(commentId, comments = this.posts.flatMap(p => p.comments)) {
        for (const comment of comments) {
            if (comment.id === commentId) return comment;
            if (comment.replies) {
                const found = this.findComment(commentId, comment.replies);
                if (found) return found;
            }
        }
        return null;
    }

    showReplyInput(commentId) {
        const comment = this.findComment(commentId);
        if (comment) {
            comment.showReplyInput = !comment.showReplyInput;
            this.renderPosts();
        }
    }

    async handleComment(postId, content) {
        if (!content.trim()) return;
        
        const user = this.getCurrentUser();
        if (!user) return;
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    content: content.trim(),
                    userId: user.id
                })
            });

            if (response.ok) {
                const newComment = await response.json();
                
                // Update local state
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    post.comments.push(newComment);
                    this.renderPosts();
                }
            } else {
                console.error('Failed to post comment:', response.statusText);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    }

    async handleReply(commentId, content) {
        if (!content.trim()) return;
        
        const user = this.getCurrentUser();
        if (!user) return;
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/comments/${commentId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    content: content.trim(),
                    userId: user.id
                })
            });

            if (response.ok) {
                const newReply = await response.json();
                
                // Update local state
                const comment = this.findComment(commentId);
                if (comment) {
                    comment.replies = comment.replies || [];
                    comment.replies.push(newReply);
                    comment.showReplyInput = false;
                    this.renderPosts();
                }
            } else {
                console.error('Failed to post reply:', response.statusText);
            }
        } catch (error) {
            console.error('Error posting reply:', error);
        }
    }

    countTotalComments(post) {
        let count = post.comments ? post.comments.length : 0;
        if (post.comments) {
            for (const comment of post.comments) {
                if (comment.replies) {
                    count += comment.replies.length;
                }
            }
        }
        return count;
    }

    async setView(view) {
        this.currentView = view;
        await this.renderPosts();
    }

    showCreatePostForm() {
        const user = this.getCurrentUser();
        if (!user) return;
        
        const postForm = document.getElementById('postForm');
        postForm.innerHTML = `
            <h2>Create New Post</h2>
            <form id="createPostForm">
                <div class="form-group">
                    <textarea id="postContent" placeholder="What's on your mind?" required></textarea>
                </div>
                <div class="form-group">
                    <label for="postImage">Image URL (optional)</label>
                    <input type="url" id="postImage" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group">
                    <label for="postCategories">Categories (comma-separated)</label>
                    <input type="text" id="postCategories" placeholder="General, Technology, etc.">
                </div>
                <button type="submit" class="btn btn-primary">Post</button>
            </form>
        `;
        
        document.getElementById('createPostForm').addEventListener('submit', (e) => this.handleCreatePost(e));
        this.createPostModal.classList.remove('hidden');
    }

    async handleCreatePost(e) {
        e.preventDefault();
        const user = this.getCurrentUser();
        if (!user) return;
        
        const content = document.getElementById('postContent').value;
        const image = document.getElementById('postImage').value;
        const categories = document.getElementById('postCategories').value
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat);
        
        if (!content.trim()) {
            alert('Post content cannot be empty');
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    content: content.trim(),
                    image: image || null,
                    categories: categories.length ? categories : ['General'],
                    userId: user.id
                })
            });

            if (response.ok) {
                const newPost = await response.json();
                
                // Update local state
                this.posts.unshift(newPost);
                this.createPostModal.classList.add('hidden');
                this.renderPosts();
            } else {
                console.error('Failed to create post:', response.statusText);
                alert('Failed to create post. Please try again.');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Error creating post. Please try again later.');
        }
    }

    async filterBySearch(query) {
        if (!query || query.trim() === '') {
            await this.loadPosts();
            return;
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/posts/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const filteredPosts = await response.json();
                this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
                this.setupPostInteractions();
            } else {
                console.error('Search failed:', response.statusText);
                // Fallback to client-side filtering
                const filteredPosts = this.posts.filter(post => 
                    post.content.toLowerCase().includes(query.toLowerCase()) ||
                    post.author.toLowerCase().includes(query.toLowerCase()) ||
                    post.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
                );
                this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
                this.setupPostInteractions();
            }
        } catch (error) {
            console.error('Error searching posts:', error);
            // Fallback to client-side filtering
            const filteredPosts = this.posts.filter(post => 
                post.content.toLowerCase().includes(query.toLowerCase()) ||
                post.author.toLowerCase().includes(query.toLowerCase()) ||
                post.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
            );
            this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
            this.setupPostInteractions();
        }
    }

    async resetFilter() {
        this.currentFilter = 'all';
        await this.loadPosts();
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        
        return Math.floor(seconds) + " seconds ago";
    }

    async filterByCategory(category) {
        this.currentFilter = category;
        
        try {
            if (category === 'all') {
                await this.loadPosts();
                return;
            }
            
            const response = await fetch(`${this.API_BASE_URL}/posts/category/${encodeURIComponent(category)}`);
            if (response.ok) {
                this.posts = await response.json();
                this.renderPosts();
            } else {
                console.error('Category filtering failed:', response.statusText);
                // Fallback to client-side filtering
                await this.loadPosts();
                this.renderPosts();
            }
        } catch (error) {
            console.error('Error filtering by category:', error);
            // Fallback to client-side filtering
            await this.loadPosts();
            this.renderPosts();
        }
    }
}