package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"forum/models"
	"forum/sqlite"
	"forum/utils"
)

func RegisterUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var user models.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		utils.SendJSONError(w, "Error hashing password", http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

	// Save user to DB
	err = sqlite.CreateUser(db, user.Username, user.Email, user.Password)
	if err != nil {
		utils.SendJSONError(w, "Error registering user", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, map[string]string{"message": "User registered"}, http.StatusCreated)
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

	// Get user from DB
	userRow := sqlite.GetUserByEmail(db, credentials.Email)
	var user models.User
	err = userRow.Scan(&user.ID, &user.Username, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.SendJSONError(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}
		utils.SendJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Validate password
	if !utils.CheckPasswordHash(credentials.Password, user.Password) {
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
	if err != nil {
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
