# Forum Frontend Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Project Structure](#project-structure)
3. [Component Modules](#component-modules)
4. [Configuration](#configuration)
5. [Authentication Flow](#authentication-flow)
6. [State Management](#state-management)
7. [API Interactions](#api-interactions)
8. [Running the Frontend](#running-the-frontend)
9. [Deployment](#deployment)

## Project Overview

This is a modern, single-page web application for a forum platform. The frontend is built using vanilla JavaScript (ES modules) and provides a responsive, interactive user experience for forum interactions.

## Project Structure

```bash
frontend/
  app.mjs
  index.html
  components/
    api.mjs
    helpers.mjs
    nav.mjs
    post.mjs
    profile.mjs
    router.mjs
    saved.mjs
    state.mjs
    trending.mjs
  static/
    pictures/
    styles/
  README.md
```

## Component Modules

- **state.mjs**  
  Global application state (posts, user, categories).

- **helpers.mjs**  
  Utility functions (DOM creation, time formatting, etc).

- **api.mjs**  
  Centralized API service for fetching posts, user, and reactions.

- **nav.mjs**  
  Renders the navigation logo.

- **router.mjs**  
  SPA router: handles route mapping, navigation, and view rendering.

- **post.mjs**  
  Renders the feed view, post cards, and create post section.

- **profile.mjs**  
  Renders the user's profile view, stats, and their posts.

- **trending.mjs**  
  Renders the trending posts view (top 5 by like count).

- **saved.mjs**  
  Renders a placeholder for the saved posts view.

## Configuration

API endpoints and other constants are defined at the top of `app.mjs` and in `api.mjs`.  
Update `API_BASE_URL` as needed for your backend.

## Authentication Flow

Authentication is handled via API endpoints. The frontend checks authentication status and displays login/register modals as needed.  
Session state is managed via cookies or tokens, depending on backend implementation.

## State Management

- **In-Memory State:**  
  The `AppState` object (in `state.mjs`) holds posts, user, and categories for efficient SPA navigation.
- **Session/Cookies:**  
  Used for authentication and user persistence.

## API Interactions

- **Posts:**  
  - `GET /api/posts` — Fetch all posts
  - `POST /api/posts/create` — Create a new post
- **User:**  
  - `GET /api/user` — Get current user info
- **Likes/Reactions:**  
  - `GET /api/likes/reactions?post_id=...` — Get like/dislike count for a post
- **Other endpoints** as defined by your backend.

## Running the Frontend

1. **Using Node.js static server (recommended for SPA):**

   ```bash
   npx serve -s . -l 8000
   ```

   Then open [http://localhost:8000](http://localhost:3000).

2. **Using Python's HTTP Server (for static files only):**

   ```bash
   python3 -m http.server 8000
   ```

   Open [http://localhost:8000](http://localhost:8000).
   > **Note:** For SPA routing to work with direct URLs, use a static server that supports fallback to `index.html` (like `serve -s .`).

## Deployment

1. **Build/Bundle (optional):**
   - Use a bundler (like Webpack, Parcel, or Vite) for production if desired.

2. **Choose a Hosting Platform:**
   - Netlify, Vercel, GitHub Pages, Firebase Hosting, or any static host.

3. **SPA Routing:**  
   - Ensure your host is configured to serve `index.html` for all non-API, non-static routes.

4. **Environment Variables:**  
   - Set `API_BASE_URL` and other config as needed.

5. **Monitor and Maintain:**  
   - Use analytics and error logging as needed.

---

**This frontend is fully modularized for maintainability and scalability. See each module in `/components` for details.**
