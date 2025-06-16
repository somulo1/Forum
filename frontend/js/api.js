// API communication module for the forum application

class ApiClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            credentials: 'include', // Include cookies for session management
            ...options
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

            return { data, status: response.status };
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(userData) {
        return this.request('/api/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async logout() {
        return this.request('/api/logout', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.request('/api/user');
    }

    // Posts endpoints
    async getPosts(page = 1, limit = 10, filters = {}) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
        });
        return this.request(`/api/posts?${params}`);
    }

    async createPost(postData) {
        return this.request('/api/posts/create', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updatePost(postData) {
        return this.request('/api/posts/update', {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deletePost(postId) {
        return this.request('/api/posts/delete', {
            method: 'DELETE',
            body: JSON.stringify({ post_id: postId })
        });
    }

    // Comments endpoints
    async getComments(postId) {
        return this.request(`/api/comments/get?post_id=${postId}`);
    }

    async createComment(commentData) {
        return this.request('/api/comments/create', {
            method: 'POST',
            body: JSON.stringify(commentData)
        });
    }

    async deleteComment(commentId) {
        return this.request('/api/comments/delete', {
            method: 'DELETE',
            body: JSON.stringify({ comment_id: commentId })
        });
    }

    // Categories endpoints
    async getCategories() {
        return this.request('/api/categories');
    }

    async createCategory(categoryData) {
        return this.request('/api/categories/create', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    // Likes endpoints
    async toggleLike(likeData) {
        return this.request('/api/likes/toggle', {
            method: 'POST',
            body: JSON.stringify(likeData)
        });
    }
}

// Create global API instance
window.api = new ApiClient();

// API response handlers
class ApiResponseHandler {
    static handleSuccess(response, successMessage = null) {
        if (successMessage) {
            toast.success(successMessage);
        }
        return response.data;
    }

    static handleError(error, defaultMessage = 'An error occurred') {
        console.error('API Error:', error);
        
        let errorMessage = defaultMessage;
        
        if (error.message) {
            errorMessage = error.message;
        }
        
        // Handle specific error cases
        if (error.message && error.message.includes('Unauthorized')) {
            errorMessage = 'Please log in to continue';
            // Optionally redirect to login or show login modal
            window.auth?.handleUnauthorized();
        } else if (error.message && error.message.includes('Forbidden')) {
            errorMessage = 'You do not have permission to perform this action';
        } else if (error.message && error.message.includes('Not Found')) {
            errorMessage = 'The requested resource was not found';
        }
        
        toast.error(errorMessage);
        throw error;
    }
}

// Export response handler
window.ApiResponseHandler = ApiResponseHandler;

// API wrapper functions with error handling
window.apiWrapper = {
    // Authentication
    async register(userData) {
        try {
            const response = await api.register(userData);
            return ApiResponseHandler.handleSuccess(response, 'Registration successful!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Registration failed');
        }
    },

    async login(credentials) {
        try {
            const response = await api.login(credentials);
            return ApiResponseHandler.handleSuccess(response, 'Login successful!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Login failed');
        }
    },

    async logout() {
        try {
            const response = await api.logout();
            return ApiResponseHandler.handleSuccess(response, 'Logged out successfully');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Logout failed');
        }
    },

    async getCurrentUser() {
        try {
            const response = await api.getCurrentUser();
            return ApiResponseHandler.handleSuccess(response);
        } catch (error) {
            // Don't show error toast for user check failures
            console.log('User not authenticated');
            return null;
        }
    },

    // Posts
    async getPosts(page, limit, filters) {
        try {
            const response = await api.getPosts(page, limit, filters);
            return ApiResponseHandler.handleSuccess(response);
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to load posts');
        }
    },

    async createPost(postData) {
        try {
            const response = await api.createPost(postData);
            return ApiResponseHandler.handleSuccess(response, 'Post created successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to create post');
        }
    },

    async updatePost(postData) {
        try {
            const response = await api.updatePost(postData);
            return ApiResponseHandler.handleSuccess(response, 'Post updated successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to update post');
        }
    },

    async deletePost(postId) {
        try {
            const response = await api.deletePost(postId);
            return ApiResponseHandler.handleSuccess(response, 'Post deleted successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to delete post');
        }
    },

    // Comments
    async getComments(postId) {
        try {
            const response = await api.getComments(postId);
            return ApiResponseHandler.handleSuccess(response);
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to load comments');
        }
    },

    async createComment(commentData) {
        try {
            const response = await api.createComment(commentData);
            return ApiResponseHandler.handleSuccess(response, 'Comment added successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to add comment');
        }
    },

    async deleteComment(commentId) {
        try {
            const response = await api.deleteComment(commentId);
            return ApiResponseHandler.handleSuccess(response, 'Comment deleted successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to delete comment');
        }
    },

    // Categories
    async getCategories() {
        try {
            const response = await api.getCategories();
            return ApiResponseHandler.handleSuccess(response);
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to load categories');
        }
    },

    async createCategory(categoryData) {
        try {
            const response = await api.createCategory(categoryData);
            return ApiResponseHandler.handleSuccess(response, 'Category created successfully!');
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to create category');
        }
    },

    // Likes
    async toggleLike(likeData) {
        try {
            const response = await api.toggleLike(likeData);
            return ApiResponseHandler.handleSuccess(response);
        } catch (error) {
            ApiResponseHandler.handleError(error, 'Failed to toggle like');
        }
    }
};
