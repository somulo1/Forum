package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"forum/models"
	"forum/sqlite"
	"forum/utils"
)

// CreateComment creates a new comment
func CreateComment(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var comment models.Comment
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, "Invalid comment data", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, ok := RequireAuth(db, w, r)
	if !ok || *userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	comment.UserID = *userID

	comm, err := sqlite.CreateComment(db, comment.UserID, comment.PostID, comment.Content)
	if err != nil {
		utils.SendJSONError(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, comm, http.StatusCreated)
}

// GetComments fetches comments for a post
func GetComments(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Retrieve `post_id` from query parameters
	postIDStr := r.URL.Query().Get("post_id")
	if postIDStr == "" {
		http.Error(w, "Missing post_id parameter", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post_id parameter", http.StatusBadRequest)
		return
	}

	// Fetch comments from the database
	comments, err := sqlite.GetPostComments(db, postID)
	if err != nil {
		utils.SendJSONError(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}

	// Send comments as JSON response
	utils.SendJSONResponse(w, comments, http.StatusOK)
}

// DeleteComment deletes a comment
func DeleteComment(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		CommentID int `json:"comment_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Validate user session and check if the user is the author of the comment
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	isAuthor, err := utils.IsAuthor(db, userID, request.CommentID, false)
	if err != nil || !isAuthor {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Delete comment from database
	err = sqlite.DeleteComment(db, request.CommentID)
	if err != nil {
		utils.SendJSONError(w, "Failed to delete comment", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "Comment deleted"}, http.StatusOK)
}
