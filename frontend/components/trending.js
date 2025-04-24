import { API_BASE_URL } from '../config.mjs';

// Example of defining trendingManager
// window.trendingManager = new TrendingManager(); // Ensure this is executed before navigation.js
export class TrendingManager {
    constructor() {
        this.trendingSection = document.getElementById('trendingSection');
        this.suggestedUsers = document.getElementById('suggestedUsers');
        this.trends = [];
        this.suggestions = [];
    }

    async init() {
        await Promise.all([
            this.loadTrends(),
            this.loadSuggestions()
        ]);
        this.render();
    }

    async loadTrends() {
        try {
            const response = await fetch(`${API_BASE_URL}/trends`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch trends');
            }

            this.trends = await response.json();
        } catch (error) {
            console.error('Error loading trends:', error);
            // Fallback to empty trends if API fails
            this.trends = [];
        }
    }

    async loadSuggestions() {
        try {
            const response = await fetch(`${API_BASE_URL}/users/suggested`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch suggestions');
            }

            this.suggestions = await response.json();
        } catch (error) {
            console.error('Error loading suggestions:', error);
            // Fallback to empty suggestions if API fails
            this.suggestions = [];
        }
    }

    renderTrends() {
        if (this.trends.length === 0) {
            this.trendingSection.innerHTML = '<h3>No trends available</h3>';
            return;
        }

        this.trendingSection.innerHTML = `
            <h3>Trending</h3>
            ${this.trends.map(trend => `
                <div class="trending-item">
                    <div>
                        <div class="trend-tag">${trend.tag}</div>
                        <small>${trend.posts} posts</small>
                    </div>
                </div>
            `).join('')}
        `;
    }

    renderSuggestions() {
        if (this.suggestions.length === 0) {
            this.suggestedUsers.innerHTML = '<p>No suggestions available</p>';
            return;
        }

        this.suggestedUsers.innerHTML = this.suggestions.map(user => `
            <div class="suggested-user">
                <img src="${user.avatar}" alt="${user.username}'s avatar" 
                     class="suggested-avatar rounded-circle"
                     onerror="this.src='assets/default-avatar.png'">
                <span>${user.username} (${user.followers} followers)</span>
            </div>
        `).join('');
    }

    render() {
        this.renderTrends();
        this.renderSuggestions();
    }
}