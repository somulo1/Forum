import { API_BASE_URL } from '../config.mjs';

export class CategoryManager {
    constructor() {
        this.categories = new Set();
        this.categoryFilter = document.getElementById('categoryFilter');
    }

    async init() {
        await this.fetchCategories();
        await this.renderCategories();
    }

    async fetchCategories() {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getCurrentUser()?.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const categories = await response.json();
            this.categories = new Set(categories.map(cat => cat.name));
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to default categories if API fails
            this.categories = new Set(['General', 'Technology', 'News', 'Introduction']);
        }
    }

    async renderCategories() {
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

    async addCategory(category) {
        try {
            const response = await fetch(`${API_BASE_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getCurrentUser()?.token}`
                },
                body: JSON.stringify({ name: category })
            });

            if (!response.ok) {
                throw new Error('Failed to add category');
            }

            const newCategory = await response.json();
            this.categories.add(newCategory.name);
            await this.renderCategories();
        } catch (error) {
            console.error('Error adding category:', error);
            // Fallback to local addition if API fails
            this.categories.add(category);
            await this.renderCategories();
        }
    }
}