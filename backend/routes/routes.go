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

	// Authentication routes
	mux.HandleFunc("/api/register", HandlerWrapper(db, handlers.RegisterUser))
	mux.HandleFunc("/api/login", HandlerWrapper(db, handlers.LoginUser))
	mux.HandleFunc("/api/logout", HandlerWrapper(db, handlers.LogoutUser))

	// Post routes (protected by auth middleware)
	mux.Handle("/api/posts/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreatePost)))
	mux.Handle("/api/posts", http.HandlerFunc(HandlerWrapper(db, handlers.GetPosts))) // Allow public access
	mux.Handle("/api/posts/update", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.UpdatePost)))
	mux.Handle("/api/comments/delete", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeleteComment)))

	// Comment routes (protected by auth middleware)
	mux.Handle("/api/comments/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateComment)))
	mux.Handle("/api/comments/post", http.HandlerFunc(HandlerWrapper(db, handlers.GetPostComments))) // Public access
	mux.Handle("/api/comments/delete", middleware.AuthMiddleware(db, http.HandlerFunc(HandlerWrapper(db, handlers.DeleteComment))))
	// Category routes (protected by auth middleware)
	mux.Handle("/api/categories/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateCategory)))
	// Like routes (protected by auth middleware)
	mux.Handle("/api/likes/toggle", middleware.AuthMiddleware(HandlerWrapper(db, handlers.ToggleLike)))

	return mux
}
