package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

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

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Could not parse form data", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	content := r.FormValue("content")

	// Get category IDs or names from the form
	categoryIDStrings := r.Form["category_ids[]"]
	categoryNames := r.Form["category_names[]"]

	// Validate user session
	userID, ok := RequireAuth(db, w, r)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Handle optional image upload
	var imageURL string
	file, header, err := r.FormFile("image")
	if err == nil {
		defer file.Close()

		ext := filepath.Ext(header.Filename)
		filename := fmt.Sprintf("post_%s_%d%s", userID, time.Now().UnixNano(), ext)
		dstPath := filepath.Join("static/pictures", filename)

		dst, err := os.Create(dstPath)
		if err != nil {
			http.Error(w, "Unable to save image", http.StatusInternalServerError)
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			http.Error(w, "Failed to write image", http.StatusInternalServerError)
			return
		}

		imageURL = "/" + dstPath
	}

	// Get category IDs - either from direct IDs or by resolving names
	var categoryIDs []int

	if len(categoryIDStrings) > 0 {
		// Convert string IDs to integers
		for _, idStr := range categoryIDStrings {
			if id, err := strconv.Atoi(idStr); err == nil {
				categoryIDs = append(categoryIDs, id)
			}
		}
	} else if len(categoryNames) > 0 {
		// Resolve category names to IDs (legacy support)
		var err error
		categoryIDs, err = sqlite.GetOrCreateCategoryIDs(db, categoryNames)
		if err != nil {
			http.Error(w, "Failed to resolve categories", http.StatusInternalServerError)
			return
		}
	}

	// Create the post with categories
	post, err := sqlite.CreatePost(db, userID, categoryIDs, title, content, imageURL)
	if err != nil {
		log.Println("Error creating post:", err)
		utils.SendJSONError(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	// Send response
	utils.SendJSONResponse(w, post, http.StatusCreated)
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
		fmt.Println("THE ERROR IS HERE")
		utils.SendJSONError(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	var fullPosts []models.Post

	for _, post := range posts {
		userInfo, err := sqlite.GetUserByID(db, post.UserID)
		if err != nil {
			utils.SendJSONError(w, "Failed to fetch post user information", http.StatusInternalServerError)
			return
		}
		post.ProfileAvatar = userInfo.AvatarURL
		fullPosts = append(fullPosts, post)
	}

	utils.SendJSONResponse(w, fullPosts, http.StatusOK)
}

// UpdatePost updates an existing post
func UpdatePost(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Could not parse form data", http.StatusBadRequest)
		return
	}

	postIDStr := r.FormValue("post_id")
	if postIDStr == "" {
		http.Error(w, "Missing post_id", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post_id", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	content := r.FormValue("content")

	// Get category IDs from the form
	categoryIDStrings := r.Form["category_ids[]"]

	// Validate user session
	userID, ok := RequireAuth(db, w, r)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Ensure the post belongs to the user
	existingPostData, err := sqlite.GetPost(db, postID)
	if err != nil {
		utils.SendJSONError(w, "Failed to read post data", http.StatusInternalServerError)
		return
	}

	if existingPostData.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Handle image update/removal
	var imageURL string
	if existingPostData.ImageURL != nil {
		imageURL = *existingPostData.ImageURL
	}

	// Check if image should be removed
	if r.FormValue("remove_image") == "true" {
		// Remove the old image file if it exists
		if existingPostData.ImageURL != nil && *existingPostData.ImageURL != "" {
			oldImagePath := "." + *existingPostData.ImageURL
			os.Remove(oldImagePath) // Ignore error if file doesn't exist
		}
		imageURL = ""
	} else {
		// Check for new image upload
		file, header, err := r.FormFile("image")
		if err == nil {
			defer file.Close()

			// Remove old image if new one is uploaded
			if existingPostData.ImageURL != nil && *existingPostData.ImageURL != "" {
				oldImagePath := "." + *existingPostData.ImageURL
				os.Remove(oldImagePath) // Ignore error if file doesn't exist
			}

			ext := filepath.Ext(header.Filename)
			filename := fmt.Sprintf("post_%s_%d%s", userID, time.Now().UnixNano(), ext)
			dstPath := filepath.Join("static/pictures", filename)

			dst, err := os.Create(dstPath)
			if err != nil {
				http.Error(w, "Unable to save image", http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			if _, err := io.Copy(dst, file); err != nil {
				http.Error(w, "Failed to write image", http.StatusInternalServerError)
				return
			}

			imageURL = "/" + dstPath
		}
	}

	// Convert category ID strings to integers
	var categoryIDs []int
	for _, idStr := range categoryIDStrings {
		if id, err := strconv.Atoi(idStr); err == nil {
			categoryIDs = append(categoryIDs, id)
		}
	}

	// Update the post
	err = sqlite.UpdatePostWithCategories(db, postID, title, content, imageURL, categoryIDs)
	if err != nil {
		log.Println("Error updating post:", err)
		utils.SendJSONError(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	// Get the updated post to return
	updatedPost, err := sqlite.GetPost(db, postID)
	if err != nil {
		utils.SendJSONError(w, "Failed to fetch updated post", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, updatedPost, http.StatusOK)
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
	if err != nil || userID == "" {
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

	var fullComments []models.Comment

	for _, comment := range comments {
		userInfo, err := sqlite.GetUserByID(db, comment.UserID)
		if err != nil {
			utils.SendJSONError(w, "Failed to fetch comment user information", http.StatusInternalServerError)
			return
		}
		comment.UserName = userInfo.Username
		comment.ProfileAvatar = userInfo.AvatarURL

		fullComments = append(fullComments, comment)

	}

	utils.SendJSONResponse(w, fullComments, http.StatusOK)
}
