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
        this.ProfileManager = new ProfileManager();
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
        this.ProfileManager.init();
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

    const app = new App();
    window.app = app; // Make accessible globally for use inside page loaders

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
        mainContent.innerHTML = `
            <section>
                <h1>Feed</h1>
                <div id="postList" class="grid gap-4 mt-4"></div>
            </section>
        `;
        app.postManager.renderPosts(document.getElementById('postList'));
    }

    function loadProfilePage() {
        mainContent.innerHTML = `
            <section>
                <h1>My Profile</h1>
                <div id="profileDetails" class="mt-4"></div>
            </section>
        `;
        app.ProfileManager.renderProfile(document.getElementById('profileDetails'));
    }

    function loadTrendsPage() {
        mainContent.innerHTML = `
            <section>
                <h1>Trending Now</h1>
                <div id="trendingPosts" class="grid gap-4 mt-4"></div>
            </section>
        `;
        app.trendingManager.renderTrending(document.getElementById('trendingPosts'));
    }

    function loadSavedPage() {
        mainContent.innerHTML = `
            <section>
                <h1>Saved Posts</h1>
                <div id="savedPosts" class="grid gap-4 mt-4"></div>
            </section>
        `;
        app.postManager.renderSavedPosts(document.getElementById('savedPosts'));
    }

    // Load the default page
    loadPage('home');
});
new App();
