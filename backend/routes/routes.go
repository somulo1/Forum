package routes

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"path/filepath"

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

	// --- API Routes ---

	// User
	mux.Handle("/api/user", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.GetUser)))

	// Auth
	mux.HandleFunc("/api/register", HandlerWrapper(db, handlers.RegisterUser))
	mux.HandleFunc("/api/login", HandlerWrapper(db, handlers.LoginUser))
	mux.HandleFunc("/api/logout", HandlerWrapper(db, handlers.LogoutUser))

	// Posts
	mux.Handle("/api/posts/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreatePost)))
	mux.HandleFunc("/api/posts", HandlerWrapper(db, handlers.GetPosts)) // Public
	mux.Handle("/api/posts/update", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.UpdatePost)))
	mux.Handle("/api/posts/delete", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeletePost)))

	// Comments
	mux.Handle("/api/comments/delete", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeleteComment)))
	mux.Handle("/api/comments/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateComment)))
	mux.HandleFunc("/api/comments/get", HandlerWrapper(db, handlers.GetPostComments)) // Public

	// Categories
	mux.Handle("/api/categories/create", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateCategory)))
	mux.HandleFunc("/api/categories", HandlerWrapper(db, handlers.GetCategories))

	// Likes
	mux.Handle("/api/likes/toggle", middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.ToggleLike)))

	// --- Secure Static File Serving ---

	staticFS := http.FileServer(http.Dir("./static"))
	mux.Handle("/static/", http.StripPrefix("/static/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath := filepath.Join("./static", r.URL.Path)

		// If it's a directory, block it
		if info, err := os.Stat(requestPath); err == nil && info.IsDir() {
			log.Printf("⚠️  Directory listing blocked: /static/%s", r.URL.Path)
			http.Error(w, "Access Denied", http.StatusUnauthorized)
			return
		}

		// Serve file
		staticFS.ServeHTTP(w, r)
	})))

	return mux
}
