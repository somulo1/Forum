// --- Constants & Configuration ---
const API_BASE_URL = "http://localhost:8080";

// --- Application State ---
import { AppState } from './components/state.mjs';

// --- Navigation ---
import { renderNavLogo } from './components/nav.mjs';

// --- Helpers ---
import { createElement, getTimeAgo } from './components/helpers.mjs';

// --- API Service ---
import { ApiService } from './components/api.mjs';

// --- Component Rendering Functions ---
import { renderPostFeed, renderCreatePostSection } from './components/post.mjs';
import { renderProfileView } from './components/profile.mjs';
import { renderTrendingView } from './components/trending.mjs';
import { renderSavedView } from './components/saved.mjs';

// --- SPA Router ---
const routes = {
    home: renderFeedView,
    profile: renderProfileView,
    trending: renderTrendingView,
    saved: renderSavedView,
};

async function navigate(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    window.history.pushState({ view }, "", `/${view}`);
    await handleRoute();
}

async function handleRoute() {
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

function setActiveSidebar(view) {
    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item.dataset.view === view);
    });
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    renderNavLogo("http://localhost:8080");

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', navigate);
    });

    handleRoute();
});

window.addEventListener("popstate", () => {
    handleRoute();
});

// --- SPA View Rendering Functions ---
async function renderFeedView() {
    renderCreatePostSection();
    const posts = await ApiService.getPosts();
    await renderPostFeed(posts);
}
