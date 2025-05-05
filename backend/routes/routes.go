package routes

import (
	"database/sql"
	"net/http"

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

	// Add root route
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to the Forum API!"))
	})

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

	// Favicon route
	mux.HandleFunc("/favicon.ico", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/public/favicon.ico") // Adjusted path to the favicon
	})

	// Trends route
	mux.HandleFunc("/api/trends", func(w http.ResponseWriter, r *http.Request) {
		handlers.GetTrends(w, r, db) // Pass the db instance here
	})

	return mux
}