package routes

import (
	"database/sql"
	"net/http"

	"forum/handlers"
	"forum/middleware"
)

// HandlerWrapper wraps handlers to include the database connection
func HandlerWrapper(db *sql.DB, handler func(*sql.DB, http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(db, w, r)
	}
}

func SetupRoutes(db *sql.DB) http.Handler {
	mux := http.NewServeMux()
	// Fetch user data
	mux.Handle("/api/user", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.GetUser)))

	// Authentication routes
	mux.HandleFunc("/api/register", HandlerWrapper(db, handlers.RegisterUser))
	mux.HandleFunc("/api/login", HandlerWrapper(db, handlers.LoginUser))
	mux.HandleFunc("/api/logout", HandlerWrapper(db, handlers.LogoutUser))

	// Post routes (protected by auth middleware)
	mux.Handle("/api/posts/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreatePost)))
	mux.HandleFunc("/api/posts", HandlerWrapper(db, handlers.GetPosts)) // Allow public access
	mux.Handle("/api/posts/update", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.UpdatePost)))
	mux.Handle("/api/posts/delete", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeletePost)))

	// Comment routes (protected by auth middleware)
	mux.Handle("/api/comments/delete", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeleteComment)))

	mux.Handle("/api/comments/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateComment)))
	mux.HandleFunc("/api/comments/get", HandlerWrapper(db, handlers.GetPostComments)) // Public access

	// Category routes (protected by auth middleware)
	mux.Handle("/api/categories/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateCategory)))
	mux.HandleFunc("/api/categories", HandlerWrapper(db, handlers.GetCategories))
	// Like routes (protected by auth middleware)
	mux.Handle("/api/likes/toggle", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.ToggleLike)))

	return mux
}
