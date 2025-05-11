package utils

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"
	"time"

	"forum/sqlite"

	"golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hashed), err
}

// CheckPasswordHash compares a hashed password with a plain password
func CheckPasswordHash(password, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

// IsAuthor checks if the given user is the author of a specific comment
func IsAuthor(db *sql.DB, userID, id int, isPost bool) (bool, error) {
	var authorID int
	query := "SELECT user_id FROM comments WHERE id = ?"
	if isPost {
		query = "SELECT user_id FROM posts WHERE id = ?"
	}
	err := db.QueryRow(query, id).Scan(&authorID)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return authorID == userID, nil
}

// IsAuthenticated checks if the user is logged in
func IsAuthenticated(db *sql.DB, r *http.Request) (bool, error) {
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		return false, err // Return error instead of just false
	}

	valid, err := validateSession(db, sessionCookie.Value)
	if err != nil {
		log.Println("Session validation error:", err)
		return false, err
	}
	return valid, nil
}

// GetUserIDFromSession retrieves the user ID from the session
func GetUserIDFromSession(db *sql.DB, r *http.Request) (string, error) {
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		return "", err
	}
	return getUserIDFromSession(db, sessionCookie.Value)
}

// validateSession validates the session
func validateSession(db *sql.DB, sessionID string) (bool, error) {
	var userID int
	var createdAt time.Time

	err := db.QueryRow(`
        SELECT user_id, created_at FROM sessions WHERE id = ?
    `, sessionID).Scan(&userID, &createdAt)
	if err != nil {
		return false, err
	}

	// Ensure session is not expired (e.g., 24 hours validity)
	if time.Since(createdAt) > 24*time.Hour {
		return false, nil
	}

	return userID > 0, nil
}

// getUserIDFromSession retrieves the user ID from the session
func getUserIDFromSession(db *sql.DB, sessionID string) (string, error) {
	userID, err := sqlite.GetUserIDFromSession(db, sessionID)
	if err != nil {
		return "", err
	}
	return userID, nil
}

// GetPaginationParams extracts "page" and "limit" from query parameters
func GetPaginationParams(r *http.Request) (int, int) {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1 // Default to first page
	}

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit < 1 {
		limit = 10 // Default page size
	}

	return page, limit
}

// func Contains(slice []int, str int) bool {
// 	for _, w := range slice {
// 		if w == str {
// 			return true
// 		}
// 	}
// 	return false
// }
