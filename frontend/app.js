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
    }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const mainContent = document.getElementById('mainContent');

    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            const view = item.getAttribute('data-view');
            loadPage(view);
        });
    });

    function loadPage(view) {
        switch(view) {
            case 'home':
                loadFeedPage();
                break;
            case 'profile':
                loadProfilePage();
                break;
            case 'trending':
                loadTrendsPage();
                break;
            case 'saved':
                loadSavedPage();
                break;
            default:
                loadFeedPage(); // Default to feed if view is not recognized
        }
    }

    function loadFeedPage() {
        mainContent.innerHTML = '<h1>Feed</h1><p>Loading feed content...</p>';
        // Here you can call your function to fetch and display posts
    }

    function loadProfilePage() {
        mainContent.innerHTML = '<h1>Profile</h1><p>Loading profile content...</p>';
        // Here you can call your function to fetch and display user profile
    }

    function loadTrendsPage() {
        mainContent.innerHTML = '<h1>Trends</h1><p>Loading trends content...</p>';
        // Here you can call your function to fetch and display trends
    }

    function loadSavedPage() {
        mainContent.innerHTML = '<h1>Saved</h1><p>Loading saved content...</p>';
        // Here you can call your function to fetch and display saved posts
    }

    // Load the default page on initial load
    loadPage('feed');
});
new App();