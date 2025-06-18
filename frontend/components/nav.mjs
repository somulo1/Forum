/**
 * Renders the navigation logo into the #navLogoContainer element.
 * @param {string} apiBaseUrl - The base URL for static assets.
 */
export function renderNavLogo(apiBaseUrl) {
    const navLogoContainer = document.getElementById("navLogoContainer");
    if (navLogoContainer) {
        navLogoContainer.innerHTML = `<img src="${apiBaseUrl}/static/pictures/forum-logo.png" alt="Forum" class="nav-logo">`;
    }
}