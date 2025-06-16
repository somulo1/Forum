package routes

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"forum/handlers"
	"forum/middleware"
)

// applyMiddleware applies CORS middleware to a given handler
func applyMiddleware(handler http.Handler) http.Handler {
	return middleware.CORS(handler)
}

// HandlerWrapper wraps handlers to include the database connection
func HandlerWrapper(db *sql.DB, handler func(*sql.DB, http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		handler(db, w, r)
	}
}

func SetupRoutes(db *sql.DB) http.Handler {
	mux := http.NewServeMux()

	// User routes
	mux.Handle("/api/user", middleware.CORS(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.GetUser))))

	// Authentication routes
	mux.HandleFunc("/api/register", func(w http.ResponseWriter, r *http.Request) {
		applyMiddleware(HandlerWrapper(db, handlers.RegisterUser)).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		applyMiddleware(HandlerWrapper(db, handlers.LoginUser)).ServeHTTP(w, r)
	})
	mux.HandleFunc("/api/logout", func(w http.ResponseWriter, r *http.Request) {
		applyMiddleware(HandlerWrapper(db, handlers.LogoutUser)).ServeHTTP(w, r)
	})

	// Post routes (protected by auth middleware)
	mux.Handle("/api/posts/create", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreatePost))))
	mux.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		applyMiddleware(HandlerWrapper(db, handlers.GetPosts)).ServeHTTP(w, r)
	})
	mux.Handle("/api/posts/update", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.UpdatePost))))
	mux.Handle("/api/posts/delete", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeletePost))))

	// Comment routes (protected by auth middleware)
	mux.Handle("/api/comments/delete", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.DeleteComment))))
	mux.Handle("/api/comments/create", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateComment))))
	mux.HandleFunc("/api/comments/get", func(w http.ResponseWriter, r *http.Request) {
		applyMiddleware(HandlerWrapper(db, handlers.GetPostComments)).ServeHTTP(w, r)
	})

	// Category routes (protected by auth middleware)
	mux.Handle("/api/categories/create", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.CreateCategory))))
	mux.Handle("/api/categories", applyMiddleware(HandlerWrapper(db, handlers.GetCategories))) // Public route
	// Like routes (protected by auth middleware)
	mux.Handle("/api/likes/toggle", applyMiddleware(middleware.AuthMiddleware(db, HandlerWrapper(db, handlers.ToggleLike))))

	// Static file serving for frontend
	mux.Handle("/css/", http.StripPrefix("/css/", http.FileServer(http.Dir("../frontend/css/"))))
	mux.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("../frontend/js/"))))
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("../frontend/assets/"))))

	// Favicon route
	mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "../frontend/favicon.ico")
	})

	// Serve the main HTML file for all non-API routes
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("📥 Request: %s %s\n", r.Method, r.URL.Path)

		// If it's an API route, let it pass through (don't handle it here)
		if strings.HasPrefix(r.URL.Path, "/api/") {
			fmt.Printf("🔄 API route detected, should be handled by specific handler: %s\n", r.URL.Path)
			http.NotFound(w, r)
			return
		}

		// If it's not an API route and not root, serve the main HTML file
		if r.URL.Path != "/" {
			// For SPA routing, serve the main HTML file
			fmt.Printf("📄 Serving SPA file for: %s\n", r.URL.Path)
			http.ServeFile(w, r, "../frontend/index.html")
			return
		}
		// Serve the main HTML file for root
		if r.URL.Path == "/" {
			fmt.Printf("📄 Serving index.html for root\n")
			http.ServeFile(w, r, "../frontend/index.html")
			return
		}
	})

	return mux
}
