package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"path/filepath"
)

// ValidImageTypes maps valid MIME types to file extensions
var ValidImageTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
}

// Error variables for avatar handling
var (
	ErrInvalidFileType = errors.New("invalid file type")
	ErrFileTooLarge    = errors.New("file too large")
)

// JSONResponse sends a JSON response with the given status code and data
func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse sends a JSON response with an error message
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	JSONResponse(w, statusCode, map[string]string{"error": message})
}

// SuccessResponse sends a JSON response with a success message
func SuccessResponse(w http.ResponseWriter, message string) {
	JSONResponse(w, http.StatusOK, map[string]string{"message": message})
}

// SendJSONError sends a JSON response with an error message
func SendJSONError(w http.ResponseWriter, message string, statusCode int) {
	JSONResponse(w, statusCode, map[string]string{"error": message})
}

// SendJSONResponse sends a JSON response with a success message
func SendJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	JSONResponse(w, statusCode, data)
}

// AvatarUploadResponse sends response for avatar upload
func AvatarUploadResponse(w http.ResponseWriter, avatarURL string) {
	SendJSONResponse(w, map[string]string{
		"avatar_url": avatarURL,
		"message":    "Avatar uploaded successfully",
	}, http.StatusOK)
}

// ValidateAvatarFile checks if file is valid image
func ValidateAvatarFile(contentType string, fileSize int64) error {
	if _, valid := ValidImageTypes[contentType]; !valid {
		return ErrInvalidFileType
	}

	maxSize := int64(5 * 1024 * 1024) // 5MB
	if fileSize > maxSize {
		return ErrFileTooLarge
	}

	return nil
}

// GenerateAvatarFilename creates unique filename for avatar
func GenerateAvatarFilename(userID int, contentType string) string {
	ext := ValidImageTypes[contentType]
	return filepath.Join("avatars", fmt.Sprintf("user_%d%s", userID, ext))
}

// AvatarErrorResponse sends error for avatar operations
func AvatarErrorResponse(w http.ResponseWriter, err error) {
	switch err {
	case ErrInvalidFileType:
		SendJSONError(w, "Invalid file type. Only JPG, PNG and GIF allowed", http.StatusBadRequest)
	case ErrFileTooLarge:
		SendJSONError(w, "File too large. Maximum size is 5MB", http.StatusBadRequest)
	default:
		SendJSONError(w, "Failed to process avatar", http.StatusInternalServerError)
	}
}
