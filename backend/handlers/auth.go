package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"forum/sqlite"
	"forum/utils"
)

func RegisterUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form data (e.g., image + text)
	err := r.ParseMultipartForm(5 << 20) // 5 MB max
	if err != nil {
		utils.SendJSONError(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	username := r.FormValue("username")
	email := r.FormValue("email")
	password := r.FormValue("password")

	if username == "" || email == "" || password == "" {
		utils.SendJSONError(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Handle avatar upload
	var avatarURL string
	file, handler, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()
		avatarFilename := fmt.Sprintf("avatar_%d_%s", time.Now().UnixNano(), handler.Filename)
		avatarPath := filepath.Join("static", avatarFilename)
		dst, err := os.Create(avatarPath)
		if err != nil {
			utils.SendJSONError(w, "Failed to save avatar", http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		_, err = io.Copy(dst, file)
		if err != nil {
			utils.SendJSONError(w, "Error saving avatar", http.StatusInternalServerError)
			return
		}
		avatarURL = "/" + avatarPath
	} else {
		// Use default avatar if no image uploaded
		avatarURL = "/static/default-avatar.png"
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		utils.SendJSONError(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Save user to DB
	err = sqlite.CreateUser(db, username, email, hashedPassword, avatarURL)
	if err != nil {
		if sqlite.IsUniqueConstraintError(err) {
			utils.SendJSONError(w, "Username or email already exists", http.StatusConflict)
		} else {
			utils.SendJSONError(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "User registered successfully"}, http.StatusCreated)
}

func LoginUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		http.Error(w, "Invalid credentials format", http.StatusBadRequest)
		return
	}
	if credentials.Password == "" {
		utils.SendJSONError(w, "Password cannot be empty", http.StatusBadRequest)
		return
	}

	// Get user from DB
	user, err := sqlite.GetUserByEmail(db, credentials.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.SendJSONError(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}
		utils.SendJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Validate password
	if !utils.CheckPasswordHash(credentials.Password, user.PasswordHash) {
		utils.SendJSONError(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Create session in database
	sessionID, err := sqlite.CreateSession(db, user.ID)
	if err != nil {
		utils.SendJSONError(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
	})

	utils.SendJSONResponse(w, map[string]string{"message": "Logged in"}, http.StatusOK)
}

func GetUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil {
		utils.SendJSONError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := sqlite.GetUserByID(db, userID)
	if err != nil {
		utils.SendJSONError(w, "User not found", http.StatusNotFound)
		return
	}

	utils.SendJSONResponse(w, user, http.StatusOK)
}

func LogoutUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session cookie
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		utils.SendJSONError(w, "No active session", http.StatusUnauthorized)
		return
	}

	// Remove session from database
	err = sqlite.DeleteSession(db, sessionCookie.Value)
	if err != nil && err != sql.ErrNoRows {
		utils.SendJSONError(w, "Failed to log out", http.StatusInternalServerError)
		return
	}

	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "session_id",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	utils.SendJSONResponse(w, map[string]string{"message": "Logged out"}, http.StatusOK)
}

func RequireAuth(db *sql.DB, w http.ResponseWriter, r *http.Request) (int, bool) {
	userID, err := utils.GetUserIDFromSession(db, r)
	if err != nil || userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}
	return userID, true
}
