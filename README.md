# Web Forum Project

## Overview
This project involves creating a web forum that allows users to communicate by creating posts and comments, associating categories with posts, and liking/disliking content. The forum also provides filtering options for posts and ensures secure user authentication. The project is implemented using **SQLite** for the database, **Docker** for containerization, and **Go** for the backend. The frontend is built using plain HTML, CSS, and JavaScript without any frameworks.

---

## Features

### 1. **User Authentication**
- Users can register with a unique email, username, and password.
- Passwords are encrypted using **bcrypt** before storing in the database.
- Users can log in and maintain a session using cookies with expiration dates.

### 2. **Posts and Comments**
- Only registered users can create posts and comments.
- Posts can be associated with one or more categories.
- Posts and comments are visible to all users (registered and non-registered).
- Non-registered users can only view posts and comments (no interaction).

### 3. **Likes and Dislikes**
- Only registered users can like or dislike posts and comments.
- The number of likes and dislikes is visible to all users.

### 4. **Filtering**
- Users can filter posts by:
  - Categories (e.g., show only posts in the "Technology" category).
  - Posts created by the logged-in user.
  - Posts liked by the logged-in user.
- Filtering by created and liked posts is only available for registered users.

### 5. **Error Handling**
- The application handles website errors (e.g., 404, 500) and returns appropriate HTTP status codes.
- Technical errors (e.g., database connection issues, invalid input) are handled gracefully.

---

## Technical Requirements

### 1. **Database**
- **SQLite** is used to store data (users, posts, comments, categories, likes/dislikes).
- The database schema is designed efficiently, and an entity-relationship diagram (ERD) is provided.

### 2. **Backend**
- The backend is implemented in **Go**.
- RESTful API endpoints are provided for all functionalities (authentication, posts, comments, likes/dislikes, filtering).
- Middleware is used for authentication and logging.

### 3. **Frontend**
- The frontend will be implemented separately.

### 4. **Docker**
- The application is containerized using Docker.
- A `Dockerfile` and `docker-compose.yml` file are provided for easy setup and deployment.

### 5. **Security**
- Passwords are encrypted using **bcrypt**.
- Cookies with expiration dates are used for session management.
- Optionally, UUIDs are used for session IDs (bonus task).

### 6. **Testing**
- Unit tests are written for backend functionality (e.g., handlers, models, utilities).
- The application is tested to ensure it is free of critical bugs and handles edge cases gracefully.

---

## Directory Structure

```
forum-project/
├── backend/
│   ├── sqlite/               # SQLite database setup and queries
│   │   ├── database.go       # Database connection and initialization
│   │   └── queries.go        # SQL queries (CREATE, INSERT, SELECT, etc.)
│   ├── models/               # Data models (structs for users, posts, comments, etc.)
│   │   ├── user.go
│   │   ├── post.go
│   │   ├── comment.go
│   │   └── category.go
│   ├── handlers/             # HTTP handlers (logic for handling requests)
│   │   ├── auth.go           # Authentication handlers (register, login, logout)
│   │   ├── post.go           # Post-related handlers (create, read, update, delete)
│   │   ├── comment.go        # Comment-related handlers
│   │   └── like.go           # Like/dislike handlers
│   ├── controllers/          # Business logic (if needed, can merge with handlers)
│   │   ├── auth_controller.go
│   │   ├── post_controller.go
│   │   └── comment_controller.go
│   ├── routes/               # API routes
│   │   └── routes.go         # Define all API endpoints
│   ├── middleware/           # Middleware (authentication, logging, etc.)
│   │   ├── auth.go           # Auth middleware (check if user is logged in)
│   │   └── logger.go         # Logging middleware
│   ├── main.go               # Entry point for the backend
│   └── utils/                # Utility functions (e.g., password hashing, UUID generation)
│       ├── auth_utils.go
│       └── response_utils.go # Helper functions for JSON responses
├── frontend/
│   ├── index.html            # Main HTML file
│   ├── js/
│   │   ├── app.js            # Main JavaScript file for frontend logic
│   │   ├── api.js            # API communication functions
│   │   ├── auth.js           # Authentication logic (login, register)
│   │   ├── posts.js          # Post-related logic (display, create, like/dislike)
│   │   ├── comments.js       # Comment functionality
│   │   └── utils.js          # Utility functions
│   ├── css/
│   │   └── styles.css        # Main stylesheet
│   └── assets/               # Static assets (images, icons, etc.)
├── Dockerfile                # Dockerfile for containerizing the backend
├── docker-compose.yml        # Docker Compose file for multi-container setup
└── README.md                 # Project documentation
```

---

## Setup Instructions

### Prerequisites
- Docker installed on your machine.
- Go installed (if running locally without Docker).

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/forum-project.git
   cd forum-project
   ```

2. Build and run the application using Docker:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: Open `http://localhost:8080` in your browser.
   - Backend API: Access endpoints at `http://localhost:8080/api`.

4. (Optional) Run the backend locally:
   - Navigate to the `backend` directory:
     ```bash
     cd backend
     ```
   - Run the Go application:
     ```bash
     go run main.go
     ```

---

## API Endpoints

### Authentication
- **POST /api/register**: Register a new user.
- **POST /api/login**: Log in and create a session.
- **POST /api/logout**: Log out and clear the session.

### Posts
- **GET /api/posts**: Get all posts (filterable by category, user, or liked posts).
- **POST /api/posts**: Create a new post.
- **GET /api/posts/{id}**: Get a specific post by ID.
- **PUT /api/posts/{id}**: Update a post (only by the author).
- **DELETE /api/posts/{id}**: Delete a post (only by the author).

### Comments
- **GET /api/posts/{postId}/comments**: Get all comments for a post.
- **POST /api/posts/{postId}/comments**: Add a comment to a post.
- **DELETE /api/comments/{id}**: Delete a comment (only by the author).

### Likes/Dislikes
- **POST /api/posts/{id}/like**: Like a post.
- **POST /api/posts/{id}/dislike**: Dislike a post.
- **POST /api/comments/{id}/like**: Like a comment.
- **POST /api/comments/{id}/dislike**: Dislike a comment.

---

## Testing
- Run unit tests for the backend:
  ```bash
  cd backend
  go test ./...
  ```

---

## Bonus Tasks
1. Implement UUIDs for session management.
2. Add frontend styling using CSS to make the forum visually appealing.
3. Implement pagination for posts and comments.
4. Allow users to edit or delete their posts and comments.
5. Add a search functionality for posts.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments
- Thanks to the Go community for excellent documentation and libraries.
- Inspiration from popular web forums like Reddit and Stack Overflow.