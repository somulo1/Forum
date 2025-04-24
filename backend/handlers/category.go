package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"forum/models"
	"forum/sqlite"
	"forum/utils"
)

func CreateCategory(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var category models.Category
	err := json.NewDecoder(r.Body).Decode(&category)
	if err != nil {
		http.Error(w, "Invalid category data", http.StatusBadRequest)
		return
	}

	err = sqlite.CreateCategory(db, category.Name)
	if err != nil {
		utils.SendJSONError(w, "Failed to create category", http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, category, http.StatusCreated)
}

func GetCategories(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	categories, err := sqlite.GetCategories(db)
	if err != nil {
		log.Printf("Error fetching categories: %v", err) // Log the error
		utils.SendJSONError(w, "Failed to fetch categories", http.StatusInternalServerError)
		return
	}

	if len(categories) == 0 {
		utils.SendJSONResponse(w, []models.Category{}, http.StatusOK) // Return an empty array if no categories
		return
	}

	utils.SendJSONResponse(w, categories, http.StatusOK)
}