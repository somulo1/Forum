// API Communication Layer

class API {
    constructor() {
        this.baseURL = '';  // Since we're serving from the same domain
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            credentials: 'include', // Include cookies for session management
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...options.headers,
            },
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
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            // Only log non-authentication errors to avoid console spam
            if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                console.error('API request failed:', error);
            }
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const url = new URL(endpoint, window.location.origin);
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET',
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // POST request with FormData (for file uploads)
    async postFormData(endpoint, formData) {
        return this.request(endpoint, {
            method: 'POST',
            headers: {}, // Don't set Content-Type for FormData
            body: formData,
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: JSON.stringify(data),
        });
    }

    // Authentication endpoints
    async register(userData) {
        const formData = new FormData();
        formData.append('username', userData.username);
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        
        if (userData.avatar) {
            formData.append('avatar', userData.avatar);
        }
        
        return this.postFormData('/api/register', formData);
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

    // Posts endpoints
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

    // Comments endpoints
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

    // Categories endpoints
    async getCategories() {
        return this.get('/api/categories');
    }

    async createCategory(categoryData) {
        return this.post('/api/categories/create', categoryData);
    }

    // Likes endpoints
    async toggleLike(likeData) {
        return this.post('/api/likes/toggle', likeData);
    }

    async getReactions(params) {
        return this.get('/api/likes/reactions', params);
    }

    // User info endpoint
    async getUserInfo(userId) {
        return this.get('/api/owner', { user_id: userId });
    }
}

// Create a global API instance
window.api = new API();

// Helper functions for common API operations
window.ApiHelpers = {
    // Handle API errors consistently
    handleError: (error) => {
        console.error('API Error:', error);
        
        if (error.message.includes('Unauthorized')) {
            // User session expired or not logged in
            window.Auth.handleLogout();
            Utils.showError('Please log in to continue');
        } else if (error.message.includes('Forbidden')) {
            Utils.showError('You do not have permission to perform this action');
        } else if (error.message.includes('Not Found')) {
            Utils.showError('The requested resource was not found');
        } else {
            Utils.showError(error.message || 'An unexpected error occurred');
        }
    },

    // Wrapper for API calls with loading and error handling
    async withLoading(apiCall, showLoadingSpinner = true) {
        try {
            if (showLoadingSpinner) Utils.showLoading();
            const result = await apiCall();
            return result;
        } catch (error) {
            this.handleError(error);
            throw error;
        } finally {
            if (showLoadingSpinner) Utils.hideLoading();
        }
    },

    // Check if user is authenticated
    async checkAuth() {
        try {
            const user = await api.getCurrentUser();
            return user;
        } catch (error) {
            return null;
        }
    },

    // Validate file upload
    validateFile: (file, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
        if (!file) return { valid: true };
        
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
            };
        }
        
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type must be one of: ${allowedTypes.join(', ')}`
            };
        }
        
        return { valid: true };
    },

    // Format API response for display
    formatPost: (post) => {
        return {
            ...post,
            created_at: Utils.formatDate(post.created_at),
            updated_at: Utils.formatDate(post.updated_at),
            avatar_url: Utils.getAvatarUrl(post.avatar_url),
            image_url: Utils.getImageUrl(post.image_url),
            content_preview: Utils.truncateText(post.content, 200)
        };
    },

    formatComment: (comment) => {
        return {
            ...comment,
            created_at: Utils.formatDateTime(comment.created_at),
            avatar_url: Utils.getAvatarUrl(comment.avatar_url)
        };
    },

    // Pagination helpers
    getPaginationParams: (page = 1, limit = 10) => {
        return { page, limit };
    }
};
