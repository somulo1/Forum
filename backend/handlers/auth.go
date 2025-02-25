package handlers

import (
	"encoding/json"
	"forum/models"
	"forum/utils"
	"net/http"
)

// RegisterUser handles user registration
func RegisterUser(w http.ResponseWriter, r *http.Request) {
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

	// Hash password, validate email/username, and save to database
	// ...
	utils.SendJSONResponse(w, map[string]string{"message": "User registered"}, http.StatusCreated)
}

// LoginUser handles user login and session creation
func LoginUser(w http.ResponseWriter, r *http.Request) {
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

	// Validate credentials, generate session cookie
	// ...
	utils.SendJSONResponse(w, map[string]string{"message": "Logged in"}, http.StatusOK)
}

// LogoutUser handles session termination
func LogoutUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Clear session cookie
	// ...
	utils.SendJSONResponse(w, map[string]string{"message": "Logged out"}, http.StatusOK)
}
