export class PostManager {
    constructor() {
        this.posts = [];
        this.mainContent = document.getElementById('mainContent');
        this.createPostModal = document.getElementById('createPostModal');
        this.createPostSection = document.getElementById('createPostSection');
        this.currentFilter = 'all';
        this.currentView = 'feed';
    }

    init() {
        this.loadPosts();
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

    loadPosts() {
        this.posts = [
            {
                id: 1,
                author: 'John Doe',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-35-47.png',
                content: 'Just launched my new project! 🚀',
                image: 'images/Screenshot from 2025-02-25 13-36-23.png',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                likes: 15,
                dislikes: 1,
                categories: ['Technology', 'Programming'],
                comments: [
                    {
                        id: 1,
                        author: 'Jane Smith',
                        authorAvatar: 'images/Screenshot from 2025-02-25 13-36-46.png',
                        content: 'Looks amazing! 👏',
                        timestamp: new Date(Date.now() - 1800000).toISOString(),
                        likes: 5,
                        dislikes: 0,
                        replies: [
                            {
                                id: 2,
                                author: 'John Doe',
                                authorAvatar: 'images/Screenshot from 2025-02-25 13-35-47.png',
                                content: 'Thanks Jane! 🙏',
                                timestamp: new Date(Date.now() - 1700000).toISOString(),
                                likes: 2,
                                dislikes: 0
                            }
                        ]
                    }
                ]
            },
            {
                id: 2,
                author: 'Jane Smith',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-36-46.png',
                content: 'Check out this awesome meme! 😂',
                image: 'images/Screenshot from 2025-02-25 13-37-12.png',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                likes: 42,
                dislikes: 3,
                categories: ['Memes', 'Humor'],
                comments: []
            },
            {
                id: 3,
                author: 'Alice Johnson',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-38-13.png',
                content: 'Had a great day at the beach party! 🏖️',
                image: 'images/Screenshot from 2025-02-25 13-39-19.png',
                timestamp: new Date(Date.now() - 10800000).toISOString(),
                likes: 10,
                dislikes: 0,
                categories: ['Travel', 'Lifestyle'],
                comments: []
            },
            {
                id: 4,
                author: 'Bob Brown',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-40-43.png',
                content: 'Just finished reading a fantastic book! 📚',
                image: 'images/Screenshot from 2025-02-25 13-40-59.png',
                timestamp: new Date(Date.now() - 14400000).toISOString(),
                likes: 8,
                dislikes: 1,
                categories: ['Books', 'Reading'],
                comments: []
            },
            {
                id: 5,
                author: 'Charlie Green',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-41-13.png',
                content: 'Excited for the weekend! 🎉',
                image: 'images/Screenshot from 2025-02-25 13-48-23.png',
                timestamp: new Date(Date.now() - 18000000).toISOString(),
                likes: 5,
                dislikes: 0,
                categories: ['Weekend', 'Fun'],
                comments: []
            },
            {
                id: 6,
                author: 'Diana Prince',
                authorAvatar: 'images/Screenshot from 2025-02-25 13-48-57.png',
                content: 'Working on a new project, stay tuned! 🔧',
                image: 'images/Screenshot from 2025-02-25 13-49-21.png',
                timestamp: new Date(Date.now() - 21600000).toISOString(),
                likes: 12,
                dislikes: 2,
                categories: ['Work', 'Projects'],
                comments: []
            }
        ];
        this.renderPosts();
    }

    renderPosts() {
        let filteredPosts = this.posts;
        const user = this.getCurrentUser();
        
        switch(this.currentView) {
            case 'feed':
                if (this.currentFilter !== 'all') {
                    filteredPosts = this.posts.filter(post => 
                        post.categories.includes(this.currentFilter)
                    );
                }
                break;
            case 'profile':
                filteredPosts = this.posts.filter(post => post.author === user?.username);
                break;
            case 'saved':
                // Implement saved posts functionality
                filteredPosts = [];
                break;
        }

        this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
        this.setupPostInteractions();
    }

    createPostHTML(post) {
        const user = this.getCurrentUser();
        const timeAgo = this.getTimeAgo(new Date(post.timestamp));
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.authorAvatar}" alt="${post.author}" class="post-author-img">
                    <div class="post-author-info">
                        <span class="post-author">${post.author}</span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" style="max-width: 100%; height: auto;">` : ''}
                <div class="post-categories">
                    ${post.categories.map(cat => `
                        <span class="category-tag">${cat}</span>
                    `).join('')}
                </div>
                <div class="post-actions">
                    ${user ? `
                        <button class="action-btn like-btn ${post.liked ? 'active' : ''}" data-post-id="${post.id}">
                            <i class="fas fa-thumbs-up"></i> ${post.likes}
                        </button>
                        <button class="action-btn dislike-btn ${post.disliked ? 'active' : ''}" data-post-id="${post.id}">
                            <i class="fas fa-thumbs-down"></i> ${post.dislikes}
                        </button>
                        <button class="action-btn comment-btn" data-post-id="${post.id}">
                            <i class="fas fa-comment"></i> ${this.countTotalComments(post)}
                        </button>
                        <button class="action-btn share-btn" data-post-id="${post.id}">
                            <i class="fas fa-share"></i> Share
                        </button>
                    ` : `
                        <span><i class="fas fa-thumbs-up"></i> ${post.likes}</span>
                        <span><i class="fas fa-thumbs-down"></i> ${post.dislikes}</span>
                        <span><i class="fas fa-comment"></i> ${this.countTotalComments(post)}</span>
                    `}
                </div>
                ${this.renderComments(post.comments)}
                ${user ? `
                    <div class="comment-input-container">
                        <img src="${user.avatar}" alt="${user.username}" class="comment-avatar">
                        <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${post.id}">
                        <button class="btn btn-primary submit-comment" data-post-id="${post.id}">Comment</button>
                    </div>
                ` : ''}
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
                            <img src="${comment.authorAvatar}" alt="${comment.author}" class="comment-avatar">
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
                                <img src="${user.avatar}" alt="${user.username}" class="comment-avatar">
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

    handlePostLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
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
        }
    }

    handlePostDislike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
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
        }
    }

    handleCommentLike(commentId) {
        const comment = this.findComment(commentId);
        if (comment) {
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
        }
    }

    handleCommentDislike(commentId) {
        const comment = this.findComment(commentId);
        if (comment) {
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

    handleComment(postId, content) {
        if (!content.trim()) return;
        
        const user = this.getCurrentUser();
        const post = this.posts.find(p => p.id === postId);
        
        if (post && user) {
            const newComment = {
                id: Date.now(),
                author: user.username,
                authorAvatar: user.avatar,
                content: content.trim(),
                timestamp: new Date().toISOString(),
                likes: 0,
                dislikes: 0,
                replies: []
            };
            
            post.comments.push(newComment);
            this.renderPosts();
        }
    }

    handleReply(commentId, content) {
        if (!content.trim()) return;
        
        const user = this.getCurrentUser();
        const comment = this.findComment(commentId);
        
        if (comment && user) {
            const newReply = {
                id: Date.now(),
                author: user.username,
                authorAvatar: user.avatar,
                content: content.trim(),
                timestamp: new Date().toISOString(),
                likes: 0,
                dislikes: 0
            };
            
            comment.replies = comment.replies || [];
            comment.replies.push(newReply);
            comment.showReplyInput = false;
            this.renderPosts();
        }
    }

    countTotalComments(post) {
        let count = post.comments.length;
        for (const comment of post.comments) {
            if (comment.replies) {
                count += comment.replies.length;
            }
        }
        return count;
    }

    setView(view) {
        this.currentView = view;
        this.renderPosts();
    }

    showCreatePostForm() {
        const user = this.getCurrentUser();
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
        const content = document.getElementById('postContent').value;
        const image = document.getElementById('postImage').value;
        const categories = document.getElementById('postCategories').value
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat);
        
        const newPost = {
            id: this.posts.length + 1,
            author: user.username,
            authorAvatar: user.avatar,
            content,
            image,
            timestamp: new Date().toISOString(),
            likes: 0,
            dislikes: 0,
            categories,
            comments: []
        };

        this.posts.unshift(newPost);
        this.createPostModal.classList.add('hidden');
        this.renderPosts();
    }

    filterBySearch(query) {
        const filteredPosts = this.posts.filter(post => 
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.author.toLowerCase().includes(query.toLowerCase()) ||
            post.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
        );
        this.mainContent.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
        this.setupPostInteractions();
    }

    resetFilter() {
        this.currentFilter = 'all';
        this.renderPosts();
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

    filterByCategory(category) {
        this.currentFilter = category;
        this.renderPosts();
    }
}