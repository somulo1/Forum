
# Forum Backend

This is the backend for the Forum application. It provides APIs for handling user authentication, posts, comments, categories, likes, and more. The backend is built using Go and SQLite.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Setup Instructions](#setup-instructions)
- [Docker](#docker-setup)
- [Makefile](#makefile)

## API Endpoints

### User Routes

- **POST /api/register**: Register a new user

Request Body:

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "avatar_url": "string (optional)"
}

```

Response:

``` bash
    200 OK: User registered successfully

    400 Bad Request: Invalid data
```

- **POST /api/login**: Log in with email and password

Request Body:

```json
{
  "username": "string",
  "password": "string"
}
```

Respone:

```bash
    200 OK: Login successful, session created

    401 Unauthorized: Invalid credentials
```

- **POST /api/logout**: Log out and invalidate session
Response:

```bash
    200 OK: Logout successful
```

- **GET /api/user**: Get user details (protected)
Protected: Yes (requires authentication)

Response:

```bash
    200 OK: Returns user data in JSON format
```

### Post Routes

- **POST /api/posts/create**: Create a new post (protected)
Request Body:

```json
{
  "title": "string",
  "content": "string",
  "category_id": 1,
  "image_url": "url_to_image"
}
```

Response:

```bash
    201 Created: Post created successfully

    400 Bad Request: Invalid data
```

- **GET /api/posts**: Get all posts (public)
Response:

```bash
    200 OK: Returns a list of posts
```

- **POST /api/posts/update**: Update an existing post (protected)
Request Body:

```json
{
  "post_id": 1,
  "title": "Updated title",
  "content": "Updated content"
}
```

- **POST /api/posts/delete**: Delete a post (protected)
Request Body:

```json
{
  "post_id": 1
}
```

Response:

```bash
    200 OK: Post deleted successfully

    404 Not Found: Post not found
```

### Comment Routes

- **POST /api/comments/create**: Create a comment on a post (protected)
Request Body:

```json
{
  "post_id": 1,
  "content": "Comment content"
}
```

Response:

```bash
    201 Created: Comment created successfully

    400 Bad Request: Invalid data
```

- **POST /api/comments/delete**: Delete a comment (protected)
Request Body:

```json
{
  "comment_id": 1
}
```

Response:

```bash
    200 OK: Comment deleted successfully
```

- **GET /api/comments/get**: Get all comments on a post (public)
Request Parameters:

    post_id: ID of the post

Response:

```bash
    200 OK: Returns a list of comments for the post
```

### Category Routes

- **POST /api/categories/create**: Create a new category (protected)

- **GET /api/categories**: Get all categories (public)

### Like Routes

- **POST /api/likes/toggle**: Toggle like on a post (protected)
Request Body:

```json
{
  "post_id": 1
}
```

Protected: Yes (requires authentication)

Response:

```bash
    200 OK: Like toggled successfully

    400 Bad Request: Invalid data
```

### File Routes

- **GET /api/files/{filename}**: Download a file (public)
- **File Upload**
Image Upload for Post

    Folder: static/uploads/

    Description: Images for posts are uploaded via the POST /api/posts/create endpoint. The images will be stored in the static/uploads/ directory.

    Image File Storage: Uploaded files are saved using a unique filename in the server's static/uploads/ directory. The URL to the image is then returned in the response and can be used in the post content.

## Setup Instructions

### Requirements

- Go 1.20+
- SQLite
- Docker (optional)

### Install Dependencies

```bash
go mod tidy
```

### Run Locally

1. Build the binary:

   ```bash
   make build
   ```

2. Run the server:

   ```bash
   make run
   ```

### Docker Setup

To run the backend with Docker, use the following commands:

1. Build and start the container:

   ```bash
   make docker-up
   ```

2. Stop and remove the container:

   ```bash
   make docker-down
   ```

## Makefile

- `make build`: Builds the Go binary
- `make run`: Runs the server locally
- `make clean`: Cleans up the Go binary
- `make docker-up`: Starts the Docker container
- `make docker-down`: Stops and removes the Docker container

## Testing

- **Integration tests**
The backend application can be tested using tools like Postman or CURL to make requests to the above API endpoints.

- **Unit tests**
<!-- TODO -->

## License

This project is licensed under the MIT License.
