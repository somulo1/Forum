import { API_BASE_URL } from './config.mjs';

// Fetch posts from the backend API
export async function fetchPosts() {
  try {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'GET',
      credentials: 'include', // Ensures cookies are sent for authentication
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Create a new post
export async function createPost(content, categoryId = null) {
  try {
    const postData = { content };
    if (categoryId !== null) {
      postData.category_id = categoryId;
    }

    const response = await fetch(`${API_BASE_URL}/posts/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}

// Delete a post
export async function deletePost(postId) {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete post');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Render Create Post Form
export function renderCreatePostForm() {
  const container = document.getElementById('main');
  const formHTML = `
    <div class="create-post-form">
      <textarea id="post-content" placeholder="What's on your mind?"></textarea>
      <select id="category-select">
        <option value="">Select Category</option>
      </select>
      <button id="submit-post">Post</button>
    </div>
  `;
  container.insertAdjacentHTML('afterbegin', formHTML);

  // Fetch categories for the select dropdown
  fetchCategories();

  document.getElementById('submit-post').addEventListener('click', async () => {
    const content = document.getElementById('post-content').value;
    const categoryId = parseInt(document.getElementById('category-select').value) || null;

    if (!content.trim()) {
      alert('Post content cannot be empty');
      return;
    }

    try {
      await createPost(content, categoryId);
      alert('Post created successfully!');
      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  });
}

// Fetch categories from backend and populate the select dropdown
async function fetchCategories() {
    const select = document.getElementById('category-select');
    if (!select) return;
  
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const categories = await response.json();
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
}
