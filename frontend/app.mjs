/**
 * Forum Application - Main Entry Point
 * This file now imports and orchestrates modular components
 */

import { App } from './components/core/App.js';

// Global app instance
let forumApp = null;

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        console.log('Initializing Forum Application...');
        forumApp = new App();

        // Make app instance globally available for debugging
        window.forumApp = forumApp;

    } catch (error) {
        console.error('Failed to initialize Forum Application:', error);
        alert('Failed to load the application. Please refresh the page.');
    }
});

// Export for potential external use
export { forumApp };
