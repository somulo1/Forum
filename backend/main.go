package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"forum/routes"
	"forum/sqlite"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Initialize database
	err := sqlite.InitializeDatabase("forum.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer sqlite.CloseDatabase()

	// Setup routes with database connection
	mux := routes.SetupRoutes(sqlite.DB)
	go func() {
		for {
			time.Sleep(1 * time.Hour) // Runs every 1 hour
			if err := sqlite.CleanupSessions(sqlite.DB, -24); err != nil {
				fmt.Println("Warning: Failed to clean up old sessions:", err)
			}
		}
	}()
	// Start server
	port := ":8080"
	fmt.Printf("Server started on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}
