import { API_BASE_URL } from '../config.mjs';

export class CategoryManager {
    constructor() {
        this.categories = [];
        this.categoryFilter = document.getElementById('categoryFilter');
        this.loading = false;
        this.init();
    }

    async init() {
        await this.fetchCategories();
        await this.renderCategories();
    }

    async fetchCategories() {
        try {
            this.loading = true;
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);

            const categories = await response.json();
            if (!Array.isArray(categories)) throw new Error('Invalid categories data format');

            // Cache categories
            localStorage.setItem('forumCategories', JSON.stringify(categories));
            this.categories = categories;
            return categories;

        } catch (error) {
            console.error('Error fetching categories:', error);
            // Try cached categories
            const cached = localStorage.getItem('forumCategories');
            this.categories = cached ? JSON.parse(cached) : [];
            return this.categories;
        } finally {
            this.loading = false;
        }
    }

    async renderCategories() {
        if (!this.categoryFilter) return;

        try {
            this.categoryFilter.classList.remove('hidden');
            this.categoryFilter.innerHTML = `
                <button class="btn btn-secondary" data-category="all">All Posts</button>
                ${this.categories.map(cat => `
                    <button class="btn btn-secondary" 
                        data-category-id="${cat.id}"
                        data-category-name="${cat.name}">
                        ${cat.name}
                    </button>
                `).join('')}
            `;

            this.setupCategoryListeners();
        } catch (error) {
            console.error('Error rendering categories:', error);
            this.categoryFilter.innerHTML = '<p>Failed to load categories</p>';
        }
    }

    setupCategoryListeners() {
        this.categoryFilter.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryId = btn.dataset.categoryId;
                
                // Update active state
                this.categoryFilter.querySelectorAll('button')
                    .forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Filter posts
                if (categoryId === 'all') {
                    window.postManager?.filterByCategory(null);
                } else {
                    window.postManager?.filterByCategory(parseInt(categoryId));
                }
            });
        });
    }

    getCurrentUser() {
        const userCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('user='));
        return userCookie ? JSON.parse(decodeURIComponent(userCookie.split('=')[1])) : null;
    }

    async addCategory(categoryName) {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getCurrentUser()?.token}`
                },
                body: JSON.stringify({ name: categoryName })
            });

            if (!response.ok) throw new Error('Failed to add category');

            const newCategory = await response.json();
            this.categories.push(newCategory);
            await this.renderCategories();
            return newCategory;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    }
}

export default CategoryManager;