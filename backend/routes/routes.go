package routes

import (
	"net/http"

	"forum/handlers"
	"forum/middleware"
)

func SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	// Authentication routes
	mux.HandleFunc("/api/register", handlers.RegisterUser)
	mux.HandleFunc("/api/login", handlers.LoginUser)
	mux.HandleFunc("/api/logout", handlers.LogoutUser)

	// Post routes (protected by auth middleware)
	mux.Handle("/api/posts", middleware.AuthMiddleware(http.HandlerFunc(handlers.CreatePost)))
	mux.Handle("/api/posts", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetPosts)))
	mux.Handle("/api/posts/update", middleware.AuthMiddleware(http.HandlerFunc(handlers.UpdatePost)))
	mux.Handle("/api/posts/delete", middleware.AuthMiddleware(http.HandlerFunc(handlers.DeletePost)))

	// Comment routes (protected by auth middleware)
	mux.Handle("/api/comments", middleware.AuthMiddleware(http.HandlerFunc(handlers.CreateComment)))
	mux.Handle("/api/comments", middleware.AuthMiddleware(http.HandlerFunc(handlers.GetComments)))
	mux.Handle("/api/comments/delete", middleware.AuthMiddleware(http.HandlerFunc(handlers.DeleteComment)))

	return mux
}
