// likes.mjs - Handle likes functionality
const API_BASE_URL = "http://localhost:8080/api";

// Handle like toggling
export async function handleLike(postId) {
  try {
    const response = await fetch(`${API_BASE_URL}/likes/toggle`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: parseInt(postId) })
    });

    if (!response.ok) {
      throw new Error('Failed to toggle like');
    }

    // Refresh posts to reflect like changes
    const postsContainer = document.querySelector('#posts-container');
    import('./posts.mjs').then(module => module.loadPosts(postsContainer));
  } catch (error) {
    console.error('Error liking post:', error);
  }
}
