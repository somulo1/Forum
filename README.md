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
│   ├── app.js                # Main JavaScript file for frontend logic
│   ├── components/           # Reusable components
│   │   ├── auth.js           # Authentication logic (login, register)
│   │   └── post.js           # Post-related logic (display, create, like/dislike)
│   ├── styles/               # CSS files (optional)
│   │   └── styles.css
│   └── assets/               # Static assets (images, icons, etc.)
├── Dockerfile                # Dockerfile for containerizing the backend
├── docker-compose.yml        # Docker Compose file for multi-container setup
└── README.md                 # Project documentation