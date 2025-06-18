/**
 * SPA Router module: handles route mapping, navigation, and view rendering.
 * Import your view functions and export router utilities.
 */

import { renderFeedView } from './post.mjs';
import { renderProfileView } from './profile.mjs';
import { renderTrendingView } from './trending.mjs';
import { renderSavedView } from './saved.mjs';

/**
 * Route mapping: maps route names to view rendering functions.
 */
export const routes = {
    home: renderFeedView,
    profile: renderProfileView,
    trending: renderTrendingView,
    saved: renderSavedView,
};

/**
 * Navigates to a view and updates browser history.
 * @param {Event} e
 */
export async function navigate(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    window.history.pushState({ view }, "", `/${view}`);
    await handleRoute();
}

/**
 * Handles the current route: renders the correct view.
 */
export async function handleRoute() {
    const path = window.location.pathname.replace("/", "") || "home";
    const view = routes[path] ? path : "home";

    document.getElementById("createPostSection").innerHTML = '';
    const postFeed = document.getElementById("postFeed");
    postFeed.innerHTML = `<div class="loading">Loading...</div>`;

    if (routes[view]) {
        try {
            await routes[view]();
        } catch (error) {
            console.error(`Error rendering ${view} view:`, error);
            postFeed.innerHTML = `<div class="error-message">Failed to load view. Please try again later.</div>`;
        }
    }
    setActiveSidebar(view);
}

/**
 * Sets the active sidebar/menu item.
 * @param {string} view
 */
export function setActiveSidebar(view) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });
}