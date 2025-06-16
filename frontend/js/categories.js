// Categories Management
class Categories {
    constructor() {
        this.categories = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
    }

    setupEventListeners() {
        // Category filter change
        const categoryFilter = Utils.$('#category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }

        // Create category form (if exists)
        const createCategoryForm = Utils.$('#create-category-form');
        if (createCategoryForm) {
            createCategoryForm.addEventListener('submit', (e) => this.handleCreateCategory(e));
        }

        // Create category button
        const createCategoryBtn = Utils.$('#create-category-btn');
        if (createCategoryBtn) {
            createCategoryBtn.addEventListener('click', () => this.showCreateCategoryModal());
        }
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

    // Handle create category form submission
    async handleCreateCategory(event) {
        event.preventDefault();
        
        if (!AuthHelpers.requireAuth()) return;

        const formData = Utils.getFormData(event.target);
        
        if (!formData.name || !formData.name.trim()) {
            Utils.showError('Please enter a category name');
            return;
        }

        try {
            Utils.showLoading();
            
            await api.createCategory({
                name: formData.name.trim()
            });
            
            Utils.showSuccess('Category created successfully');
            Utils.clearForm(event.target);
            Utils.closeModal('#create-category-modal');

            // Reload categories
            await this.loadCategories();
            this.renderCategoryFilter();

            // Refresh categories page if we're on it
            if (window.App && window.App.currentPage === 'categories') {
                this.renderCategoriesList('#categories-list');
            }

        } catch (error) {
            ApiHelpers.handleError(error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Get category by ID
    getCategoryById(id) {
        return this.categories.find(category => category.id === parseInt(id));
    }

    // Get category by name
    getCategoryByName(name) {
        return this.categories.find(category => category.name.toLowerCase() === name.toLowerCase());
    }

    // Get all categories
    getAllCategories() {
        return this.categories;
    }

    // Format categories for display
    formatCategoriesForPost(categoryIds) {
        if (!categoryIds || !Array.isArray(categoryIds)) return [];
        
        return categoryIds.map(id => {
            const category = this.getCategoryById(id);
            return category ? category.name : `Category ${id}`;
        });
    }

    // Render categories list (for admin/management)
    renderCategoriesList(containerId) {
        const container = Utils.$(containerId);
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = '<p class="no-categories">No categories found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="categories-grid">
                ${this.categories.map(category => `
                    <div class="category-item" data-category-id="${category.id}">
                        <div class="category-info">
                            <h4 class="category-name">${Utils.escapeHtml(category.name)}</h4>
                            <span class="category-id">ID: ${category.id}</span>
                        </div>
                        ${AuthHelpers.isLoggedIn() ? `
                            <div class="category-actions">
                                <button class="btn btn-sm btn-outline" onclick="window.Categories.editCategory(${category.id})">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="window.Categories.deleteCategory(${category.id})">Delete</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Render category checkboxes for post creation
    renderCategoryCheckboxes(containerId) {
        const container = Utils.$(containerId);
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = '<p class="no-categories">No categories available.</p>';
            return;
        }

        container.innerHTML = this.categories.map(category => `
            <label class="category-checkbox">
                <input type="checkbox" name="categories" value="${Utils.escapeHtml(category.name)}">
                <span>${Utils.escapeHtml(category.name)}</span>
            </label>
        `).join('');
    }

    // Edit category (placeholder for future implementation)
    async editCategory(categoryId) {
        Utils.showWarning('Edit category functionality not implemented yet');
    }

    // Delete category (placeholder for future implementation)
    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) return;
        
        Utils.showWarning('Delete category functionality not implemented yet');
    }

    // Search categories
    searchCategories(query) {
        if (!query || !query.trim()) return this.categories;
        
        const searchTerm = query.toLowerCase().trim();
        return this.categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm)
        );
    }

    // Get popular categories (placeholder - would need backend support)
    getPopularCategories(limit = 5) {
        // For now, just return the first few categories
        return this.categories.slice(0, limit);
    }

    // Refresh categories
    async refresh() {
        await this.loadCategories();
        this.renderCategoryFilter();
    }

    // Clear categories cache
    clearCache() {
        this.categories = [];
    }

    // Load categories page
    async loadCategoriesPage() {
        try {
            Utils.showLoading();

            // Load categories
            await this.loadCategories();

            // Render categories list
            this.renderCategoriesList('#categories-list');

            // Show create button if logged in
            const createBtn = Utils.$('#create-category-btn');
            if (createBtn) {
                createBtn.style.display = AuthHelpers.isLoggedIn() ? 'block' : 'none';
            }

        } catch (error) {
            console.error('Error loading categories page:', error);
            Utils.showError('Failed to load categories');
        } finally {
            Utils.hideLoading();
        }
    }

    // Show create category modal
    showCreateCategoryModal() {
        if (!AuthHelpers.requireAuth()) return;
        Utils.openModal('#create-category-modal');
    }
}

// Initialize categories when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.Categories = new Categories();
});
