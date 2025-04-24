package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"forum/utils"
)

// Define a custom type to avoid key collisions
type contextKey string

const userIDKey contextKey = "userID"

// AuthMiddleware checks if a user is logged in
func AuthMiddleware(db *sql.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := utils.GetUserIDFromSession(db, r)
		if err != nil || userID == 0 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Use the custom key type
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
