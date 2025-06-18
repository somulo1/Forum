/**
 * Category Manager - Handles category fetching, rendering, and filtering
 */

import { ApiUtils } from '../utils/ApiUtils.mjs';

export class CategoryManager {
    constructor(onCategoryFilter) {
        this.categories = [];
        this.onCategoryFilter = onCategoryFilter;
        this.categoryContainer = document.getElementById("categoryFilter");
    }

    /**
     * Fetch and render categories
     */
    async renderCategories() {
        try {
            this.categories = await ApiUtils.get("/api/categories");
            this.renderCategoryList();
            this.setupCategoryFilters();
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    }

    /**
     * Render the category list in the sidebar
     */
    renderCategoryList() {
        this.categoryContainer.innerHTML = `
            <h3>Categories</h3>
            <div class="menu-item active" category-id="0">
                <i class="fas fa-tag"></i> All
            </div>
        `;

        this.categories.forEach(category => {
            const categoryItem = document.createElement("div");
            categoryItem.classList.add("menu-item");
            categoryItem.setAttribute("category-id", `${category.id}`);
            categoryItem.innerHTML = `<i class="fas fa-tag"></i> ${category.name}`;
            this.categoryContainer.appendChild(categoryItem);
        });
    }

    /**
     * Setup category filter event listeners
     */
    setupCategoryFilters() {
        const categoryBtns = document.querySelectorAll("#categoryFilter .menu-item");
        
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', async (event) => {
                // Remove active class from all buttons
                categoryBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                event.currentTarget.classList.add('active');

                const catId = event.currentTarget.getAttribute('category-id');
                
                // Add loading state
                const postFeed = document.getElementById('postFeed');
                postFeed.style.opacity = '0.5';
                postFeed.style.transition = 'opacity 0.3s ease';

                try {
                    // Scroll to top smoothly
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    // Trigger category filter callback
                    if (this.onCategoryFilter) {
                        await this.onCategoryFilter(parseInt(catId));
                    }

                    // Remove loading state
                    postFeed.style.opacity = '1';
                } catch (error) {
                    console.error("Error filtering posts:", error);
                    postFeed.style.opacity = '1';
                }
            });
        });
    }

    /**
     * Setup category dropdown for post creation
     */
    setupCategoryDropdown() {
        // Toggle dropdown
        const dropdownToggle = document.getElementById("dropdownToggle");
        const dropdownMenu = document.getElementById("dropdownMenu");
        
        if (dropdownToggle) {
            dropdownToggle.addEventListener("click", () => {
                dropdownMenu.classList.toggle("hidden");
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            const dropdown = document.getElementById("categoryDropdown");
            if (dropdown && !dropdown.contains(e.target)) {
                dropdownMenu.classList.add("hidden");
            }
        });

        // Load categories dynamically
        this.loadCategoriesForDropdown();
    }

    /**
     * Load categories for the post creation dropdown
     */
    async loadCategoriesForDropdown() {
        try {
            const categories = await ApiUtils.get('/api/categories');
            const menu = document.getElementById("dropdownMenu");
            
            if (!menu) return;
            
            menu.innerHTML = "";
            categories.forEach(cat => {
                const item = document.createElement("label");
                item.style.display = "block";
                item.style.padding = "5px 10px";
                item.innerHTML = `
                    <input type="checkbox" name="category_names[]" value="${cat.name}" />
                    ${cat.name}
                `;
                menu.appendChild(item);
            });
        } catch (error) {
            console.error("Failed to load categories:", error);
        }
    }

    /**
     * Get selected categories from dropdown
     * @returns {Array} - Array of selected category names
     */
    getSelectedCategories() {
        const form = document.getElementById("postForm");
        if (!form) return [];
        
        return Array.from(form.querySelectorAll('input[name="category_names[]"]:checked'))
            .map(cb => cb.value);
    }

    /**
     * Reset category dropdown selection
     */
    resetCategoryDropdown() {
        const dropdownMenu = document.getElementById("dropdownMenu");
        if (dropdownMenu) {
            dropdownMenu.classList.add("hidden");
            
            // Uncheck all checkboxes
            const checkboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
        }
    }

    /**
     * Get all categories
     * @returns {Array} - Array of category objects
     */
    getCategories() {
        return this.categories;
    }
}
