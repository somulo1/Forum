package middleware

import (
	"net/http"
	"forum/utils"
)

// AuthMiddleware checks if a user is logged in
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Validate session cookie
		if !utils.IsAuthenticated(r) {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}