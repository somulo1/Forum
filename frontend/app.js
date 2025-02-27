import { AuthManager } from './components/auth.js';
import { PostManager } from './components/post.js';
import { CategoryManager } from './components/category.js';
import { ProfileManager } from './components/profile.js';
import { TrendingManager } from './components/trending.js';
import { StoryManager } from './components/story.js';
import { NavigationManager } from './components/navigation.js';

class App {
    constructor() {
        this.authManager = new AuthManager();
        this.postManager = new PostManager();
        this.categoryManager = new CategoryManager();
        this.profileManager = new ProfileManager();
        this.trendingManager = new TrendingManager();
        this.storyManager = new StoryManager();
        this.navigationManager = new NavigationManager(this.postManager);
        
        this.init();
    }

    init() {
        // Initialize all managers
        this.authManager.init();
        this.postManager.init();
        this.categoryManager.init();
        this.profileManager.init();
        this.trendingManager.init();
        this.storyManager.init();
        this.navigationManager.init();
        
        // Setup global event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });

        // Close buttons in modals
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                button.closest('.modal').classList.add('hidden');
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    handleSearch(query) {
        if (query.length > 2) {
            // Filter posts by search query
            this.postManager.filterBySearch(query);
        } else {
            // Reset to normal view
            this.postManager.resetFilter();
        }
    }
}

// Initialize the application
new App();