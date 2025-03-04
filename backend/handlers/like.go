package handlers

import (
	"encoding/json"
	"net/http"

	"forum/models"
	"forum/utils"
)

// LikePost handles liking/disliking a post
func LikePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var like models.Like
	err := json.NewDecoder(r.Body).Decode(&like)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate user session
	userID := utils.GetUserIDFromSession(r)
	if userID == 0 {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	like.UserID = userID

	// Save like to database (e.g., db.CreateLike(&like))
	utils.SendJSONResponse(w, like, http.StatusCreated)
}
