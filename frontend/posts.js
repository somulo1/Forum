

const api = 'http://localhost:8080/api'; 

// const postsPage = document.getElementById("posts-container");

// if (postsPage) {
//     getPosts();    
// }

// async function getPosts() {

//     try {
//         const response = await fetch(api+"/posts", {
//             method: 'GET',            
//         });

//         const result = await response.json();

//         if (result.error) {
//             throw new error(result.error);
//         }

//         loadPosts(result);

//     } catch(error) {
//         return {error: error.message || 'something went wrong.'}
//     }
// }

// function loadPosts(posts) {

//     postsPage.innerHTML='';
    
//     posts.forEach(post=> {
//         let el = document.createElement("div");
//         el.classList.add("post-card");

//         el.innerHTML= `
//         <h3>${post.title}</h3>
//         <p><em>${post.userName}</em></p>
//         <p>${post.content}</p>

//         `;
        
//     });

// }



async function sendPostForm(title, content) {
    const formData = new URLSearchParams();
    formData.append("title", title);
    formData.append("content", content);
  
    try {
      const response = await fetch(api+"/posts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData,
        credentials: "include" // Send cookies like session_id
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
  
      const data = await response.json(); // Use .json() if response is JSON
      console.log("Success:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  }



  sendPostForm("first post", "rpoiuwjfeeepeprepoiurqo8ewui0-iujclkjkjhkjsihiuhewurhdnjvfsdhiuruioireoijeoireuoijr");
  