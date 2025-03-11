package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"forum/models"
	"forum/sqlite"
	"forum/utils"
)

// LikePost handles liking/disliking a post
func LikePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var like models.Like
	err := json.NewDecoder(r.Body).Decode(&like)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	like.UserID = userID
	id := *like.CommentID
	err = sqlite.ToggleLike(db, like.UserID, like.PostID, id)
	if err != nil {
		utils.SendJSONError(w, "Failed to toggle like", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, like, http.StatusCreated)
}

func ToggleLike(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		PostID    *int `json:"post_id,omitempty"`
		CommentID *int `json:"comment_id,omitempty"`
	}
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

	// Ensure at least one of postID or commentID is provided
	if request.PostID == nil && request.CommentID == nil {
		http.Error(w, "Missing post_id or comment_id", http.StatusBadRequest)
		return
	}

	// Dereference pointers before passing to the database function
	postID := 0
	commentID := 0
	if request.PostID != nil {
		postID = *request.PostID
	}
	if request.CommentID != nil {
		commentID = *request.CommentID
	}

	err = sqlite.ToggleLike(db, userID, postID, commentID)
	if err != nil {
		utils.SendJSONError(w, "Failed to toggle like", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "Like toggled successfully"}, http.StatusOK)
}
