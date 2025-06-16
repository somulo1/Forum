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

	// Get category names from the form
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

	// Get category IDs by resolving category names
	categoryIDs, err := sqlite.GetOrCreateCategoryIDs(db, categoryNames)
	if err != nil {
		http.Error(w, "Failed to resolve categories", http.StatusInternalServerError)
		return
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

	var post models.Post
	err := json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, "Invalid post data", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == "" {
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

// DeleteAllPosts removes all posts from the database (admin function)
func DeleteAllPosts(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// For security, you might want to add admin authentication here
	// For now, we'll allow any authenticated user to clear posts
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err = sqlite.DeleteAllPosts(db)
	if err != nil {
		log.Printf("Error deleting all posts: %v", err)
		utils.SendJSONError(w, "Failed to delete all posts", http.StatusInternalServerError)
		return
	}

	log.Printf("All posts deleted by user: %s", userID)
	utils.SendJSONResponse(w, map[string]string{"message": "All posts deleted successfully"}, http.StatusOK)
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
