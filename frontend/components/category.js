export class CategoryManager {
    constructor() {
        this.categories = new Set(['General', 'Technology', 'News', 'Introduction']);
        this.categoryFilter = document.getElementById('categoryFilter');
    }

    init() {
        this.renderCategories();
    }

    renderCategories() {
        const user = this.getCurrentUser();
        if (!user) return;

        this.categoryFilter.classList.remove('hidden');
        this.categoryFilter.innerHTML = `
            <button class="btn btn-secondary" data-category="all">All Posts</button>
            ${Array.from(this.categories).map(category => `
                <button class="btn btn-secondary" data-category="${category}">${category}</button>
            `).join('')}
        `;

        this.setupCategoryListeners();
    }

    setupCategoryListeners() {
        this.categoryFilter.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                window.postManager.filterByCategory(category);
            });
        });
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }

    addCategory(category) {
        this.categories.add(category);
        this.renderCategories();
    }
}