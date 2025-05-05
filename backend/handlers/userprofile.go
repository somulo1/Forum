package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"forum/utils"
)

func UploadAvatar(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	// Get user ID from context
	userID := r.Context().Value("userID").(int)

	// Get file from request
	file, header, err := r.FormFile("avatar")
	if err != nil {
		utils.SendJSONError(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type and size
	if err := utils.ValidateAvatarFile(header.Header.Get("Content-Type"), header.Size); err != nil {
		utils.SendJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		utils.SendJSONError(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Generate unique filename
	ext := utils.ValidImageTypes[header.Header.Get("Content-Type")]
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)
	avatarURL := fmt.Sprintf("/uploads/avatars/%s", filename)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		utils.SendJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		utils.SendJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Update database
	_, err = db.Exec("UPDATE users SET avatar_url = ? WHERE id = ?", avatarURL, userID)
	if err != nil {
		os.Remove(filePath) // Cleanup file if DB update fails
		utils.SendJSONError(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	utils.AvatarUploadResponse(w, avatarURL)
}
