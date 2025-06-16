// API Configuration and Methods
class API {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Don't set Content-Type for FormData - let browser set it automatically
        const headers = options.body instanceof FormData 
            ? { ...options.headers } 
            : { ...this.defaultHeaders, ...options.headers };
        
        const config = {
            credentials: 'include', // Include cookies for session management
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.error || data || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET',
        });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data),
        });
    }

    // POST request with FormData (for file uploads)
    async postFormData(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            body: formData,
        });
    }

    // Authentication endpoints
    async register(userData) {
        // If there's an avatar, use FormData, otherwise use JSON
        if (userData.avatar) {
            const formData = new FormData();
            formData.append('username', userData.username);
            formData.append('email', userData.email);
            formData.append('password', userData.password);
            formData.append('avatar', userData.avatar);
            
            return this.postFormData('/api/register', formData);
        } else {
            // Use JSON for registration without avatar
            return this.post('/api/register', {
                username: userData.username,
                email: userData.email,
                password: userData.password
            });
        }
    }

    async login(credentials) {
        return this.post('/api/login', credentials);
    }

    async logout() {
        return this.post('/api/logout');
    }

    async getCurrentUser() {
        return this.get('/api/user');
    }

    // Posts endpoints - FIXED TO MATCH BACKEND
    async getPosts(params = {}) {
        return this.get('/api/posts', params);
    }

    async createPost(postData) {
        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('content', postData.content);
        
        // Handle categories
        if (postData.categories && postData.categories.length > 0) {
            postData.categories.forEach(category => {
                formData.append('category_names[]', category);
            });
        }
        
        if (postData.image) {
            formData.append('image', postData.image);
        }
        
        return this.postFormData('/api/posts/create', formData);
    }

    async updatePost(postData) {
        return this.put('/api/posts/update', postData);
    }

    async deletePost(postId) {
        return this.delete('/api/posts/delete', { post_id: postId });
    }

    async deleteAllPosts() {
        return this.delete('/api/posts/delete-all');
    }

    // Comments endpoints - FIXED TO MATCH BACKEND
    async getComments(postId) {
        return this.get('/api/comments/get', { post_id: postId });
    }

    async createComment(commentData) {
        return this.post('/api/comments/create', commentData);
    }

    async createReply(replyData) {
        return this.post('/api/comment/reply/create', replyData);
    }

    async deleteComment(commentId) {
        return this.delete('/api/comments/delete', { comment_id: commentId });
    }

    // Categories endpoints - FIXED TO MATCH BACKEND
    async getCategories() {
        return this.get('/api/categories');
    }

    async createCategory(categoryData) {
        return this.post('/api/categories/create', categoryData);
    }

    // Likes endpoints - FIXED TO MATCH BACKEND
    async toggleLike(likeData) {
        return this.post('/api/likes/toggle', likeData);
    }

    async getReactions(params) {
        return this.get('/api/likes/reactions', params);
    }

    // User info endpoint - FIXED TO MATCH BACKEND
    async getUserInfo(userId) {
        return this.get('/api/owner', { user_id: userId });
    }
}

// Create a global API instance
window.api = new API();
