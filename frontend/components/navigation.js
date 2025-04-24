import { TrendingManager } from './trending.js'; // Adjust the path as needed

// Example of defining trendingManager
// window.trendingManager = new TrendingManager();
// Example of defining trendingManager
window.trendingManager = new TrendingManager(); // Ensure this is executed before navigation.js
export class NavigationManager {
    constructor(postManager) {
        this.postManager = postManager;
        // console.log("PostManager in NavigationManager:", this.postManager); // Debugging line
        this.menuItems = document.querySelectorAll('.menu-item');
    }

    init() {
        this.setupNavigationListeners();
    }

    setupNavigationListeners() {
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(item.dataset.view);

                // Update active state
                this.menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    handleNavigation(view) {
        if (!this.postManager) {
            console.error('PostManager is not defined.');
            return;
        }
        this.postManager.setView(view);
        
        switch (view) {
            case 'feed':
                document.title = 'Home - Forum';
                break;
            case 'profile':
                document.title = 'Profile - Forum';
                break;
            case 'trending':
                document.title = 'Trending - Forum';
                window.trendingManager.render();
                break;
            case 'saved':
                document.title = 'Saved Posts - Forum';
                break;
        }
    }
}