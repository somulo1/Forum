async function renderPosts() {
    try {
        const response = await fetch("http://localhost:8080/api/posts");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const posts = await response.json();
        console.log("Fetched posts:", posts);
    
        const postsContainer = document.getElementById('postFeed');
    
        if (postsContainer) {
          posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');
    
            const titleElement = document.createElement('h3');
            titleElement.textContent = post.title;
    
            const contentElement = document.createElement('p');
            contentElement.textContent = post.content;
    
            const createdAtElement = document.createElement('p');
            createdAtElement.classList.add('created-at');
            createdAtElement.textContent = `Created At: ${new Date(post.created_at).toLocaleString()}`;
    
            const updatedAtElement = document.createElement('p');
            updatedAtElement.classList.add('updated-at');
            updatedAtElement.textContent = `Updated At: ${new Date(post.updated_at).toLocaleString()}`;
    
            postDiv.appendChild(titleElement);
            postDiv.appendChild(contentElement);
            postDiv.appendChild(createdAtElement);
            postDiv.appendChild(updatedAtElement);
    
            if (post.image_url) { // Check if image_url exists and is not empty
              const imageElement = document.createElement('img');
              imageElement.src = "http://localhost:8080"+post.image_url;
              imageElement.alt = post.title || 'Post Image';
              imageElement.id = "post-image";
              postDiv.appendChild(imageElement);
            }
    
            postsContainer.appendChild(postDiv);
        });
    } else {
          console.error("Error: 'posts-container' element not found in the HTML.");
    }
    
    } catch (error) {
        console.error("Error fetching and displaying posts:", error);
    }
}
document.addEventListener('DOMContentLoaded', renderPosts);