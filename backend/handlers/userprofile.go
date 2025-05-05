package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"forum/models"
	"forum/utils"
)

func UploadAvatar(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	// Get authenticated user
	userID := r.Context().Value("userID").(int)

	tx, err := db.Begin()
	if err != nil {
		utils.SendJSONError(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Get current user data
	var user models.User
	err = tx.QueryRow(`
        SELECT id, username, email, avatar_url, created_at, updated_at 
        FROM users WHERE id = ?`, userID).Scan(
		&user.ID, &user.Username, &user.Email,
		&user.AvatarURL, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		utils.SendJSONError(w, "User not found", http.StatusNotFound)
		return
	}

	// Handle file upload
	file, header, err := r.FormFile("avatar")
	if err != nil {
		utils.SendJSONError(w, "No file uploaded", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file
	if err := utils.ValidateAvatarFile(header.Header.Get("Content-Type"), header.Size); err != nil {
		utils.SendJSONError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Prepare upload directory
	uploadDir := "uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0o755); err != nil {
		utils.SendJSONError(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Generate filename and save
	ext := utils.ValidImageTypes[header.Header.Get("Content-Type")]
	filename := fmt.Sprintf("user_%d_%d%s", user.ID, time.Now().Unix(), ext)
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
		os.Remove(filePath)
		utils.SendJSONError(w, "Failed to save file", http.StatusInternalServerError)
		return
	}

	// Update user model
	oldAvatar := user.AvatarURL
	user.AvatarURL = avatarURL
	user.UpdatedAt = time.Now()

	// Update database
	_, err = tx.Exec("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?",
		user.AvatarURL, user.UpdatedAt, user.ID)
	if err != nil {
		os.Remove(filePath)
		utils.SendJSONError(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		os.Remove(filePath)
		utils.SendJSONError(w, "Failed to commit changes", http.StatusInternalServerError)
		return
	}

	// Clean up old avatar
	if oldAvatar != "" && oldAvatar != "/images/default-avatar.png" {
		os.Remove(filepath.Join(".", oldAvatar))
	}

	utils.JSONResponse(w, http.StatusOK, user)
}
