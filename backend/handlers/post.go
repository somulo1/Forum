package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"forum/middleware"
	"forum/models"
	"forum/utils"
)

// CreatePost creates a new post
func CreatePost(w http.ResponseWriter, r *http.Request) {
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
	userID := utils.GetUserIDFromSession(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Set the user ID for the post
	post.UserID = userID

	// Save post to database (e.g., db.CreatePost(&post))
	// Example: db.CreatePost(&post)
	utils.SendJSONResponse(w, post, http.StatusCreated)
}

// GetPosts fetches posts (with optional filters)
func GetPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract filters from query params (category, user ID, liked posts)
	filters := r.URL.Query()
	category := filters.Get("category")
	userID := filters.Get("user_id")
	// likedByUserID := filters.Get("liked_by_user_id")

	// Fetch posts from database based on filters
	// Example: posts := db.GetPosts(category, userID, likedByUserID)
	posts := []models.Post{
		{ID: 1, Title: "Post 1", Content: "Content 1", UserID: 1, Categories: []string{"Technology"}},
		{ID: 2, Title: "Post 2", Content: "Content 2", UserID: 2, Categories: []string{"Science"}},
	}

	// Apply filters (example logic)
	filteredPosts := make([]models.Post, 0)
	for _, post := range posts {
		if category != "" && !middleware.Contains(post.Categories, category) {
			continue
		}
		if userID != "" && strconv.Itoa(post.UserID) != userID {
			continue
		}
		// LikedByUserID logic would require a database query to check likes
		filteredPosts = append(filteredPosts, post)
	}

	utils.SendJSONResponse(w, filteredPosts, http.StatusOK)
}

// UpdatePost updates an existing post
func UpdatePost(w http.ResponseWriter, r *http.Request) {
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

	// Validate user session and check if the user is the author of the post
	userID := utils.GetUserIDFromSession(r)
	if userID == 0 || userID != post.UserID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Update post in database (e.g., db.UpdatePost(&post))
	// Example: db.UpdatePost(&post)
	utils.SendJSONResponse(w, post, http.StatusOK)
}

// DeletePost deletes a post
func DeletePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	postID := r.URL.Query().Get("id")
	if postID == "" {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Validate user session and check if the user is the author of the post
	userID := utils.GetUserIDFromSession(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Fetch post from database to check ownership
	// Example: post := db.GetPost(postID)
	post := models.Post{ID: 1, Title: "Post 1", Content: "Content 1", UserID: 1} // Placeholder

	if post.UserID != userID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Delete post from database (e.g., db.DeletePost(postID))
	// Example: db.DeletePost(postID)
	utils.SendJSONResponse(w, map[string]string{"message": "Post deleted"}, http.StatusOK)
}
