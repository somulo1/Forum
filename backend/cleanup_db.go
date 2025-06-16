package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func main() {
	// Open database
	db, err := sql.Open("sqlite", "./forum.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}
	defer db.Close()

	// Check current data
	fmt.Println("=== Current Database State ===")
	
	// Check posts
	var postCount int
	err = db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&postCount)
	if err != nil {
		log.Fatal("Failed to count posts:", err)
	}
	fmt.Printf("Posts: %d\n", postCount)

	// Check users
	var userCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		log.Fatal("Failed to count users:", err)
	}
	fmt.Printf("Users: %d\n", userCount)

	// Check categories
	var categoryCount int
	err = db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&categoryCount)
	if err != nil {
		log.Fatal("Failed to count categories:", err)
	}
	fmt.Printf("Categories: %d\n", categoryCount)

	// Check for hardcoded image references
	fmt.Println("\n=== Checking for hardcoded images ===")
	
	rows, err := db.Query("SELECT id, title, image_url FROM posts WHERE image_url LIKE '%icon%.png' OR image_url LIKE '%post%.png'")
	if err != nil {
		log.Fatal("Failed to query posts:", err)
	}
	defer rows.Close()

	var foundHardcoded bool
	for rows.Next() {
		var id int
		var title, imageURL string
		err := rows.Scan(&id, &title, &imageURL)
		if err != nil {
			log.Fatal("Failed to scan row:", err)
		}
		fmt.Printf("Found hardcoded image in post %d (%s): %s\n", id, title, imageURL)
		foundHardcoded = true
	}

	// Check users with hardcoded avatars
	userRows, err := db.Query("SELECT id, username, avatar_url FROM users WHERE avatar_url LIKE '%icon%.png'")
	if err != nil {
		log.Fatal("Failed to query users:", err)
	}
	defer userRows.Close()

	for userRows.Next() {
		var id, username, avatarURL string
		err := userRows.Scan(&id, &username, &avatarURL)
		if err != nil {
			log.Fatal("Failed to scan user row:", err)
		}
		fmt.Printf("Found hardcoded avatar for user %s: %s\n", username, avatarURL)
		foundHardcoded = true
	}

	if foundHardcoded {
		fmt.Println("\n=== Cleaning up hardcoded references ===")
		
		// Clean up hardcoded post images
		result, err := db.Exec("UPDATE posts SET image_url = NULL WHERE image_url LIKE '%icon%.png' OR image_url LIKE '%post%.png'")
		if err != nil {
			log.Fatal("Failed to clean post images:", err)
		}
		affected, _ := result.RowsAffected()
		fmt.Printf("Cleaned %d post images\n", affected)

		// Clean up hardcoded user avatars
		result, err = db.Exec("UPDATE users SET avatar_url = '' WHERE avatar_url LIKE '%icon%.png'")
		if err != nil {
			log.Fatal("Failed to clean user avatars:", err)
		}
		affected, _ = result.RowsAffected()
		fmt.Printf("Cleaned %d user avatars\n", affected)

		fmt.Println("Database cleanup completed!")
	} else {
		fmt.Println("No hardcoded image references found.")
	}

	// Add some basic categories if none exist
	if categoryCount == 0 {
		fmt.Println("\n=== Adding basic categories ===")
		categories := []string{
			"General Discussion",
			"Technology",
			"Programming",
			"Web Development",
			"Mobile Development",
			"Data Science",
			"DevOps",
			"Cybersecurity",
			"AI & Machine Learning",
			"Gaming",
		}

		for _, category := range categories {
			_, err := db.Exec("INSERT INTO categories (name) VALUES (?)", category)
			if err != nil {
				fmt.Printf("Failed to insert category %s: %v\n", category, err)
			} else {
				fmt.Printf("Added category: %s\n", category)
			}
		}
	}

	fmt.Println("\n=== Final Database State ===")
	err = db.QueryRow("SELECT COUNT(*) FROM posts").Scan(&postCount)
	if err == nil {
		fmt.Printf("Posts: %d\n", postCount)
	}
	
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err == nil {
		fmt.Printf("Users: %d\n", userCount)
	}
	
	err = db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&categoryCount)
	if err == nil {
		fmt.Printf("Categories: %d\n", categoryCount)
	}
}
