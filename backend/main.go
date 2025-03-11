package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"forum/routes"
	"forum/sqlite"
)

func main() {
	// Initialize the database
	err := sqlite.InitializeDatabase("forum.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer sqlite.CloseDatabase()

	// Setup routes
	mux := routes.SetupRoutes(sqlite.DB)

	// Start a separate goroutine to run cleanup at midnight every day
	go scheduleDailyCleanup()

	// Start server
	port := ":8080"
	fmt.Printf("🚀 Server started on http://localhost%s\n", port)
	log.Fatal(http.ListenAndServe(port, mux))
}

// scheduleDailyCleanup runs session cleanup at midnight every day
func scheduleDailyCleanup() {
	for {
		// Calculate the duration until next midnight
		now := time.Now()
		nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
		sleepDuration := time.Until(nextMidnight)

		fmt.Printf("🕛 Scheduled session cleanup in %v at midnight...\n", sleepDuration)
		time.Sleep(sleepDuration) // Wait until midnight

		// Run session cleanup
		if err := sqlite.CleanupSessions(sqlite.DB, -24); err != nil {
			fmt.Println("❌ Failed to clean up old sessions:", err)
		} else {
			fmt.Println("✅ Expired sessions cleaned up successfully at midnight.")
		}
	}
}
