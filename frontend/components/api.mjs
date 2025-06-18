import { AppState } from './state.mjs';

const API_BASE_URL = "http://localhost:8080";

export const ApiService = {
    async getPosts() {
        if (AppState.posts.length > 0) return AppState.posts;
        const response = await fetch(`${API_BASE_URL}/api/posts`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        AppState.posts = await response.json();
        return AppState.posts;
    },
    async getUser() {
        if (AppState.user) return AppState.user;
        const response = await fetch(`${API_BASE_URL}/api/user`, { credentials: 'include' });
        if (!response.ok) throw new Error('User not authenticated');
        AppState.user = await response.json();
        return AppState.user;
    },
    async getReactionsForPost(postId) {
        const response = await fetch(`${API_BASE_URL}/api/likes/reactions?post_id=${postId}`);
        if (!response.ok) return { likes: 0, dislikes: 0 };
        return await response.json();
    }
};