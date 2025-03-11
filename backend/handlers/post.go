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

// CreatePost creates a new post
func CreatePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var post models.Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, "Invalid post data", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	post.UserID = userID
	err = sqlite.CreatePost(db, post.UserID, post.Title, post.Content)
	if err != nil {
		utils.SendJSONError(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, post, http.StatusCreated)
}

// GetPosts fetches posts (with optional filters)
func GetPosts(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	posts, err := sqlite.GetPosts(db, 1, 10) // Example pagination (can be modified)
	if err != nil {
		utils.SendJSONError(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, posts, http.StatusOK)
}

// UpdatePost updates an existing post
func UpdatePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var post models.Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, "Invalid post data", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Ensure the post belongs to the user
	existingPost := sqlite.GetPost(db, post.ID)

	var existingPostData models.Post
	if err := existingPost.Scan(&existingPostData.ID, &existingPostData.UserID, &existingPostData.Title, &existingPostData.Content); err != nil {
		utils.SendJSONError(w, "Failed to read post data", http.StatusInternalServerError)
		return
	}

	if existingPostData.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	err = sqlite.UpdatePost(db, post.ID, post.Title, post.Content)
	if err != nil {
		utils.SendJSONError(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, post, http.StatusOK)
}

func DeletePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		PostID int `json:"post_id"`
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

	// Ensure the post belongs to the user
	existingPost := sqlite.GetPost(db, request.PostID)

	var existingPostData models.Post
	if err := existingPost.Scan(&existingPostData.ID, &existingPostData.UserID, &existingPostData.Title, &existingPostData.Content); err != nil {
		utils.SendJSONError(w, "Failed to read post data", http.StatusInternalServerError)
		return
	}

	if existingPostData.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	err = sqlite.DeletePost(db, request.PostID)
	if err != nil {
		utils.SendJSONError(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "Post deleted"}, http.StatusOK)
}

func GetPostComments(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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
	comments, err := sqlite.GetPostComments(db, postID)
	if err != nil {
		utils.SendJSONError(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, comments, http.StatusOK)
}
