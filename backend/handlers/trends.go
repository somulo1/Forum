package handlers

import (
	"net/http"
	"encoding/json"
	"forum/sqlite" // Adjust based on your actual import path
	"database/sql" // Ensure you import the database/sql package
)

// GetTrends handles the request to fetch trending posts
func GetTrends(w http.ResponseWriter, r *http.Request, db *sql.DB) { // Ensure db is passed
	posts, err := sqlite.FetchTrendingPosts(db) // Pass the db instance
	if err != nil {
		http.Error(w, "Failed to fetch trends", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts) // Encode the posts slice to JSON
}