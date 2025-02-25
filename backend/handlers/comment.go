package handlers

import (
	"encoding/json"
	"net/http"

	"forum/models"
	"forum/utils"
)

// CreateComment creates a new comment
func CreateComment(w http.ResponseWriter, r *http.Request) {
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

	// Validate user session, save comment to database
	// Example: comment.UserID = utils.GetUserIDFromSession(r)
	// Save comment to database (e.g., db.CreateComment(&comment))
	utils.SendJSONResponse(w, comment, http.StatusCreated)
}

// GetComments fetches comments for a post
func GetComments(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	postID := r.URL.Query().Get("post_id")
	if postID == "" {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Fetch comments from database for the given post ID
	// Example: comments := db.GetComments(postID)
	comments := []models.Comment{
		{ID: 1, Content: "Comment 1", PostID: 1, UserID: 1},
		{ID: 2, Content: "Comment 2", PostID: 1, UserID: 2},
	}

	utils.SendJSONResponse(w, comments, http.StatusOK)
}

// DeleteComment deletes a comment
func DeleteComment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	commentID := r.URL.Query().Get("id")
	if commentID == "" {
		http.Error(w, "Comment ID is required", http.StatusBadRequest)
		return
	}

	// Validate user session and check if the user is the author of the comment
	// Example: if !utils.IsAuthor(r, commentID) { http.Error(w, "Unauthorized", http.StatusUnauthorized) }
	// Delete comment from database (e.g., db.DeleteComment(commentID))
	utils.SendJSONResponse(w, map[string]string{"message": "Comment deleted"}, http.StatusOK)
}
