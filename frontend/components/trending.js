export class TrendingManager {
    constructor() {
        this.trendingSection = document.getElementById('trendingSection');
        this.suggestedUsers = document.getElementById('suggestedUsers');
        this.trends = [];
        this.suggestions = [];
    }

    init() {
        this.loadTrends();
        this.loadSuggestions();
        this.render();
    }

    loadTrends() {
        // Simulate trending topics
        this.trends = [
            { tag: '#JavaScript', posts: 1234, avatar: 'frontend/images/Screenshot from 2025-02-25 13-39-19.png' },
            { tag: '#WebDev', posts: 987, avatar: 'frontend/images/Screenshot from 2025-02-25 13-40-43.png' },
            { tag: '#CodingLife', posts: 654, avatar: 'frontend/images/Screenshot from 2025-02-25 13-41-13.png' },
            { tag: '#Programming', posts: 432, avatar: 'frontend/images/Screenshot from 2025-02-25 13-41-13.png' },
            { tag: '#TechNews', posts: 321, avatar: 'frontend/images/Screenshot from 2025-02-25 13-41-13.png' }
        ];
    }

    loadSuggestions() {
        // Simulate suggested users
        this.suggestions = [
            { username: 'tech_guru', avatar: 'images/Screenshot from 2025-02-25 13-39-19.png', followers: 1200 },
            { username: 'code_master', avatar: 'images/Screenshot from 2025-02-25 13-40-43.png', followers: 980 },
            { username: 'web_ninja', avatar: 'images/Screenshot from 2025-02-25 13-41-13.png', followers: 850 }
        ];
    }

    renderTrends() {
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
        this.suggestedUsers.innerHTML = this.suggestions.map(user => `
            <div class="suggested-user">
                <img src="${user.avatar}" alt="${user.username}'s avatar" class="suggested-avatar rounded-circle">
                <span>${user.username} (${user.followers} followers)</span>
            </div>
        `).join('');
    }

    render() {
        this.renderTrends();
        this.renderSuggestions();
    }
}