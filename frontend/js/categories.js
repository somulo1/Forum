// Categories Management

class Categories {
    constructor() {
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadCategories();
        this.setupEventListeners();
        this.renderCategoryFilter();
    }

    setupEventListeners() {
        // Category filter change
        const categoryFilter = Utils.$('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }

        // Create category button (if we add one later)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.create-category-btn')) {
                this.showCreateCategoryModal();
            }
        });
    }

    // Load categories from API
    async loadCategories() {
        try {
            this.categories = await api.getCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    // Render category filter dropdown
    renderCategoryFilter() {
        const filterSelect = Utils.$('#category-filter');
        if (!filterSelect) return;

        const options = [
            '<option value="">All Categories</option>',
            ...this.categories.map(category => 
                `<option value="${category.id}">${Utils.escapeHtml(category.name)}</option>`
            )
        ];

        filterSelect.innerHTML = options.join('');
    }

    // Handle category filter change
    handleCategoryFilter(categoryId) {
        if (window.Posts) {
            window.Posts.setCategoryFilter(categoryId);
        }
    }

    // Get category name by ID
    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Unknown Category';
    }

    // Get category by ID
    getCategory(categoryId) {
        return this.categories.find(cat => cat.id === categoryId);
    }

    // Get all categories
    getAllCategories() {
        return this.categories;
    }

    // Create new category
    async createCategory(name) {
        if (!AuthHelpers.requireAuth()) return;

        if (!name || name.trim().length < 2) {
            Utils.showError('Category name must be at least 2 characters long');
            return;
        }

        // Check if category already exists
        const existingCategory = this.categories.find(cat => 
            cat.name.toLowerCase() === name.trim().toLowerCase()
        );

        if (existingCategory) {
            Utils.showError('Category already exists');
            return;
        }

        try {
            await api.createCategory({ name: name.trim() });
            Utils.showSuccess('Category created successfully!');
            
            // Reload categories
            await this.loadCategories();
            this.renderCategoryFilter();
            
            return true;
        } catch (error) {
            ApiHelpers.handleError(error);
            return false;
        }
    }

    // Show create category modal (if implemented)
    showCreateCategoryModal() {
        const categoryName = prompt('Enter category name:');
        if (categoryName) {
            this.createCategory(categoryName);
        }
    }

    // Render categories for post creation form
    renderCategoriesForForm(containerId) {
        const container = Utils.$(containerId);
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = `
                <p class="text-muted">No categories available. 
                   <button type="button" class="btn btn-small btn-secondary create-category-btn">
                       Create Category
                   </button>
                </p>
            `;
            return;
        }

        const checkboxes = this.categories.map(category => `
            <label class="category-checkbox">
                <input type="checkbox" name="categories" value="${Utils.escapeHtml(category.name)}">
                <span>${Utils.escapeHtml(category.name)}</span>
            </label>
        `).join('');

        container.innerHTML = `
            ${checkboxes}
            <button type="button" class="btn btn-small btn-secondary create-category-btn mt-2">
                Add New Category
            </button>
        `;
    }

    // Get selected categories from form
    getSelectedCategories(formElement) {
        const checkboxes = formElement.querySelectorAll('input[name="categories"]:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    }

    // Render category tags for display
    renderCategoryTags(categoryIds) {
        if (!categoryIds || categoryIds.length === 0) return '';

        return categoryIds.map(categoryId => {
            const categoryName = this.getCategoryName(categoryId);
            return `<span class="category-tag">${Utils.escapeHtml(categoryName)}</span>`;
        }).join('');
    }

    // Filter posts by category
    filterPostsByCategory(posts, categoryId) {
        if (!categoryId) return posts;

        return posts.filter(post => 
            post.category_ids && post.category_ids.includes(parseInt(categoryId))
        );
    }

    // Get popular categories (categories with most posts)
    getPopularCategories(posts, limit = 5) {
        const categoryCounts = {};

        posts.forEach(post => {
            if (post.category_ids) {
                post.category_ids.forEach(categoryId => {
                    categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
                });
            }
        });

        return Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([categoryId, count]) => ({
                category: this.getCategory(parseInt(categoryId)),
                count
            }))
            .filter(item => item.category);
    }

    // Search categories
    searchCategories(query) {
        if (!query) return this.categories;

        const lowerQuery = query.toLowerCase();
        return this.categories.filter(category =>
            category.name.toLowerCase().includes(lowerQuery)
        );
    }

    // Validate category selection
    validateCategorySelection(selectedCategories) {
        if (!selectedCategories || selectedCategories.length === 0) {
            return { valid: false, error: 'Please select at least one category' };
        }

        if (selectedCategories.length > 5) {
            return { valid: false, error: 'Please select no more than 5 categories' };
        }

        // Check if all selected categories exist
        const invalidCategories = selectedCategories.filter(categoryName => 
            !this.categories.some(cat => cat.name === categoryName)
        );

        if (invalidCategories.length > 0) {
            return { 
                valid: false, 
                error: `Invalid categories: ${invalidCategories.join(', ')}` 
            };
        }

        return { valid: true };
    }

    // Refresh categories
    async refresh() {
        await this.loadCategories();
        this.renderCategoryFilter();
    }

    // Get category statistics
    getCategoryStats(posts) {
        const stats = {};

        this.categories.forEach(category => {
            stats[category.id] = {
                name: category.name,
                postCount: 0,
                totalLikes: 0,
                totalComments: 0
            };
        });

        posts.forEach(post => {
            if (post.category_ids) {
                post.category_ids.forEach(categoryId => {
                    if (stats[categoryId]) {
                        stats[categoryId].postCount++;
                        // Add likes and comments if available
                        if (post.likes) stats[categoryId].totalLikes += post.likes;
                        if (post.comments_count) stats[categoryId].totalComments += post.comments_count;
                    }
                });
            }
        });

        return stats;
    }
}

// Initialize categories when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Categories = new Categories();
});

// Helper functions for other modules
window.CategoriesHelpers = {
    // Get category name by ID
    getCategoryName: (categoryId) => {
        if (window.Categories) {
            return window.Categories.getCategoryName(categoryId);
        }
        return 'Unknown Category';
    },

    // Get all categories
    getAll: () => {
        if (window.Categories) {
            return window.Categories.getAllCategories();
        }
        return [];
    },

    // Render category tags
    renderTags: (categoryIds) => {
        if (window.Categories) {
            return window.Categories.renderCategoryTags(categoryIds);
        }
        return '';
    },

    // Validate category selection
    validate: (selectedCategories) => {
        if (window.Categories) {
            return window.Categories.validateCategorySelection(selectedCategories);
        }
        return { valid: false, error: 'Categories not loaded' };
    },

    // Create new category
    create: (name) => {
        if (window.Categories) {
            return window.Categories.createCategory(name);
        }
        return Promise.resolve(false);
    },

    // Refresh categories
    refresh: () => {
        if (window.Categories) {
            return window.Categories.refresh();
        }
        return Promise.resolve();
    }
};
