package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"forum/utils"
)

// AuthMiddleware checks if a user is logged in
func AuthMiddleware(db *sql.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := utils.GetUserIDFromSession(db, r)
		if err != nil || userID == 0 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "userID", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
