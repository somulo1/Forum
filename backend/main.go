package main

import (
	"log"
	"forum/sqlite"
	"fmt"
	"forum/models"
)

func main() {
	// Initialize the database
	err := sqlite.InitDB("database.db")
	if err != nil {
		log.Fatal("Failed to initialize the database:", err)
	}

	// Ensure the database closes when the program exits
	defer sqlite.CloseDB()

	log.Println("Database setup complete!")

	    // Create a new user
		user := models.User{
			Username: "john",
			Email:    "john@example.com",
			Password: "password",
		}
	
		// Create a new post
		post := models.Post{
			Title:    "Hello World",
			Content:  "This is a sample post",
			UserID:   1,
			CategoryID: 1,
		}
	
		// Create a new comment
		comment := models.Comment{
			Content:  "This is a sample comment",
			PostID:   1,
			UserID:   1,
		}
	
		// Create a new category
		category := models.Category{
			Name:     "Sample Category",
		}
	
		fmt.Println("User:", user)
		fmt.Println("Post:", post)
		fmt.Println("Comment:", comment)
		fmt.Println("Category:", category)
}
