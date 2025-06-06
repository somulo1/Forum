package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
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

	// Use a temporary struct for decoding JSON
	var request struct {
		Title      string `json:"title"`
		Content    string `json:"content"`
		CategoryID *int   `json:"category_id,omitempty"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
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

	// Create post in database
	err = sqlite.CreatePost(db, userID, request.CategoryID, request.Title, request.Content)
	if err != nil {
		log.Println("Error creating post:", err) // Debugging
		utils.SendJSONError(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "Post created successfully"}, http.StatusCreated)
}

// GetPosts fetches posts (with optional filters)
func GetPosts(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract pagination parameters from the URL query
	page, limit := utils.GetPaginationParams(r)

	// Fetch posts with pagination
	posts, err := sqlite.GetPosts(db, page, limit)
	if err != nil {
		utils.SendJSONError(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, posts, http.StatusOK)
}

//handle the user profile pic


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
	existingPostData, err := sqlite.GetPost(db, post.ID)
	if err != nil {
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
	existingPostData, err := sqlite.GetPost(db, request.PostID)
	if err != nil {
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
