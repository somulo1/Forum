package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"forum/sqlite"
	"forum/utils"
)

// // LikePost handles liking/disliking a post
// func LikePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
// 		return
// 	}

// 	var like models.Like
// 	err := json.NewDecoder(r.Body).Decode(&like)
// 	if err != nil {
// 		http.Error(w, "Invalid request body", http.StatusBadRequest)
// 		return
// 	}

// 	// Validate user session
// 	userID, err := utils.GetUserIDFromSession(db, r)
// 	if err != nil || userID == 0 {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	like.UserID = userID

// 	err = sqlite.ToggleLike(db, like.UserID, like.PostID, like.CommentID)
// 	if err != nil {
// 		utils.SendJSONError(w, "Failed to toggle like", http.StatusInternalServerError)
// 		return
// 	}

// 	utils.SendJSONResponse(w, like, http.StatusCreated)
// }

func ToggleLike(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Define the request struct
	var request struct {
		PostID    *int `json:"post_id,omitempty"`
		CommentID *int `json:"comment_id,omitempty"`
	}

	// Decode request body
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Ensure exactly one of PostID or CommentID is provided
	if (request.PostID != nil && request.CommentID != nil) || (request.PostID == nil && request.CommentID == nil) {
		http.Error(w, "Must provide either post_id or comment_id, but not both", http.StatusBadRequest)
		return
	}

	// Call the database function to toggle like
	err = sqlite.ToggleLike(db, userID, request.PostID, request.CommentID)
	if err != nil {
		utils.SendJSONError(w, fmt.Sprintf("Database error: %v", err), http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "Like toggled successfully"}, http.StatusOK)
}
