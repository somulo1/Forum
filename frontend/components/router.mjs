// SPA Routing Integration for your existing app.js
import { renderCreatePostSection, fetchForumPosts, renderPosts, renderCategories } from './app.js';
import { renderProfile } from './profile.mjs';

const routes = {
    feed: renderPosts,
    profile: renderProfile,
    // saved: renderSaved,
    trending: renderTrending,
};
  
export function handleRoute(view, pushState = true) {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;
    mainContent.innerHTML = "";
  
    const render = routes[view];
    if (render) {
      render();
      setActiveSidebar(view);
      if (pushState) {
        const path = view === "feed" ? "/" : `/${view}`;
        history.pushState({ view }, "", path);
      }
    } else {
      mainContent.innerHTML = "<h2>404 - Page Not Found</h2>";
    }
}
  
function setActiveSidebar(view) {
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === view);
    });
}
  
document.addEventListener("click", (e) => {
    const menuItem = e.target.closest(".menu-item");
    if (menuItem && menuItem.dataset.view) {
      e.preventDefault();
      handleRoute(menuItem.dataset.view);
    }
});
  
window.addEventListener("popstate", (e) => {
    const view = e.state?.view || "feed";
    handleRoute(view, false);
});
  
window.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.replace("/", "") || "feed";
    handleRoute(path);
});
  
  // View renderers
function renderFeed() {
    renderCreatePostSection();
    fetchForumPosts().then((posts) => {
      forumPosts = posts;
      renderPosts(forumPosts);
      renderCategories();
    });
}
  
// function renderSaved() {
//     const main = document.getElementById("mainContent");
//     main.innerHTML = `<section class="create-post-section"><h2>Saved Posts</h2></section>`;
//     // TODO: Fetch and render saved posts from backend
// }
  
export async function renderTrending() {
    const main = document.getElementById("mainContent");
  main.innerHTML = "<section class='create-post-section'><h2>Loading trending posts...</h2></section>";

  try {
    const res = await fetch("http://localhost:8080/api/posts/trending");
    if (!res.ok) throw new Error("Failed to fetch trending posts");

    const posts = await res.json();

    if (posts.length === 0) {
      main.innerHTML = "<section class='create-post-section'><p>No trending posts available.</p></section>";
      return;
    }

    main.innerHTML = "<section class='create-post-section'><h2>Trending Posts</h2><div id='trendingPosts'></div></section>";
    const trendingContainer = document.getElementById("trendingPosts");
    await renderPosts(posts);
  } catch (err) {
    main.innerHTML = `<section class='create-post-section'><p>Error loading trending posts.</p></section>`;
    console.error("Trending error:", err);
  }
}

  