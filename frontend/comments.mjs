import { API_BASE_URL } from './config.mjs';
import { handleLike } from './like.mjs';
import { isAuthenticated } from './authentication.mjs';

// Load comments for a specific post
export async function loadComments(postId) {
  const commentsContainer = document.getElementById(`comments-${postId}`);
  commentsContainer.innerHTML = '<p>Loading comments...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/comments/get?post_id=${postId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');

    const comments = await response.json();
    commentsContainer.innerHTML = '<h4>Comments</h4>';

    if (comments.length === 0) {
      commentsContainer.innerHTML += '<p>No comments yet. Be the first to comment!</p>';
    }

    comments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.classList.add('comment');
      commentElement.innerHTML = `
        <p><strong>${comment.username}</strong>: ${comment.content}</p>
        <button class="like-comment-btn" data-comment-id="${comment.id}">Like (${comment.likes})</button>
        ${comment.isOwner ? `<button class="delete-comment-btn" data-comment-id="${comment.id}">Delete</button>` : ''}
      `;
      commentsContainer.appendChild(commentElement);
    });

    // Add comment form
    commentsContainer.innerHTML += `
      <textarea id="comment-input-${postId}" placeholder="Add a comment..."></textarea>
      <button id="add-comment-btn-${postId}">Comment</button>
    `;

    // Attach event listeners
    attachCommentEventListeners(postId);
  } catch (error) {
    console.error('Error loading comments:', error);
    commentsContainer.innerHTML = '<p>Error loading comments.</p>';
  }
}

// Attach event listeners for like and delete actions
function attachCommentEventListeners(postId) {
  document.querySelectorAll('.like-comment-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.dataset.commentId;
      if (await isAuthenticated()) {
        handleLike(null, commentId); // Assuming handleLike handles comment likes
      }
    });
  });

  document.querySelectorAll('.delete-comment-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.dataset.commentId;
      if (await isAuthenticated()) {
        deleteComment(commentId, postId);
      }
    });
  });

  document.getElementById(`add-comment-btn-${postId}`).addEventListener('click', () => {
    addComment(postId);
  });
}

// Add comment to a post
export async function addComment(postId) {
  const commentInput = document.getElementById(`comment-input-${postId}`);
  const content = commentInput.value.trim();
  if (!content) return;

  try {
    const response = await fetch(`${API_BASE_URL}/comments/create`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, content })
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    loadComments(postId); // Reload comments
    commentInput.value = ''; // Clear input field
  } catch (error) {
    console.error('Error adding comment:', error);
  }
}

// Delete comment
export async function deleteComment(commentId, postId) {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId })
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    loadComments(postId); // Reload comments
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}
