import { renderPosts } from "./app.js";

export async function renderProfile() {
    const main = document.getElementById("mainContent");
    main.innerHTML = "<section class='create-post-section'><h2>Loading profile...</h2></section>";
  
    try {
      const userRes = await fetch("http://localhost:8080/api/user");
      if (!userRes.ok) throw new Error("Not logged in");
  
      const user = await userRes.json();
  
      // Create a profile header
      main.innerHTML = `
        <section class="create-post-section">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img class="post-author-img" src="http://localhost:8080${user.avatar_url}" alt="Avatar" />
            <div>
              <h2>${user.username}</h2>
              <p style="color: var(--muted-text);">${user.email}</p>
            </div>
          </div>
          <hr style="margin: 1rem 0;" />
          <h3>Your Posts</h3>
          <div id="userPosts"></div>
        </section>
      `;
  
      const postRes = await fetch(`http://localhost:8080/api/posts?user_id=${user.id}`);
      if (!postRes.ok) throw new Error("Could not fetch posts");
      const posts = await postRes.json();
  
      const userPostContainer = document.getElementById("userPosts");
      if (posts.length > 0) {
        await renderPosts(posts); // reuse existing function
      } else {
        userPostContainer.innerHTML = "<p>No posts yet.</p>";
      }
  
    } catch (err) {
      main.innerHTML = `<section class='create-post-section'><p>Error loading profile. Please login.</p></section>`;
      console.error("Profile error:", err);
    }
}
