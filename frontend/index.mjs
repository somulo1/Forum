import { fetchPosts, renderCreatePostForm, deletePost } from './posts.mjs';
import { isAuthenticated, promptAuthentication } from './authentication.mjs';
import { loadComments} from './comments.mjs';
import { handleLike } from './like.mjs';
import { logoutUser, renderAuthButtons, checkAuthStatus } from './loginout.mjs';

// Load and display posts
async function loadPosts() {
  try {
    const posts = await fetchPosts();
    const container = document.getElementById('main-content');
    container.innerHTML = '';

    if (posts.length === 0) {
      container.innerHTML = '<p>No posts available.</p>';
      return;
    }

    posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      postElement.innerHTML = `
        <h3>${post.username}</h3>
        <p>${post.content}</p>
        <button class="like-btn" data-post-id="${post.id}">Like</button>
        <button class="comment-btn" data-post-id="${post.id}">Comment</button>
        ${post.isOwner ? `<button class="delete-btn" data-post-id="${post.id}">Delete</button>` : ''}
        <div id="comments-${post.id}" class="comments-section"></div> <!-- Comments Section Added -->
      `;
      container.appendChild(postElement);
    });
    

    attachEventListeners();
  } catch (error) {
    console.error('Failed to load posts:', error);
  }
}

// Attach event listeners to like, comment, and delete buttons
function attachEventListeners() {
  document.querySelectorAll('.like-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = e.target.dataset.postId;
      if (await isAuthenticated()) {
        handleLike(postId);
      } else {
        promptAuthentication();
      }
    });
  });

  document.querySelectorAll('.comment-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = e.target.dataset.postId;
      if (await isAuthenticated()) {
        loadComments(postId);
      } else {
        promptAuthentication();
      }
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = e.target.dataset.postId;
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          await deletePost(postId);
          alert('Post deleted successfully');
          loadPosts();
        } catch (error) {
          alert(error.message);
        }
      }
    });
  });
  // Handle logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logoutUser();
    });
  }
}

// Add a Create Post button for authenticated users
async function addCreatePostButton() {
  if (await isAuthenticated()) {
    const createPostButton = document.createElement('button');
    createPostButton.textContent = 'Create Post';
    createPostButton.addEventListener('click', renderCreatePostForm);
    document.body.insertBefore(createPostButton, document.getElementById('main'));
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await addCreatePostButton();
  // checkAuthStatus();
  // renderAuthButtons();
  loadPosts();
});
