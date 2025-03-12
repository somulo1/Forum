package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"forum/routes"
	"forum/sqlite"
)

func main() {
	// Initialize the database
	if len(os.Args) > 2 {
		fmt.Println("Usage:\n\n$ go run .\n\nor\n\n$ go run . 'port no'\n\nwhere port no; is a four digit integer greater than 1023 and not equal to 3306/3389")
		return
	}
	port := ":8080"
	if len(os.Args) == 2 {
		p, er := strconv.Atoi(os.Args[1])
		if er != nil || !(p > 1023 && p != 3306 && p != 3389) {
			fmt.Println("Usage:\n\n$ go run .\n\nor\n\n$ go run . 'port no'\n\nwhere port no; is a four digit integer greater than 1023 and not equal to 3306/3389")
			return
		}
		port = ":" + os.Args[1]
	}
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

	fmt.Printf("🚀 [%s] Server is running at http://localhost%s\n", time.Now().Format(time.RFC3339), port)
	log.Fatal(http.ListenAndServe(port, mux))
}

// scheduleDailyCleanup runs session cleanup at midnight every day
func scheduleDailyCleanup() {
	for {
		// Calculate the duration until next midnight
		now := time.Now()
		nextMidnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, now.Location())
		sleepDuration := time.Until(nextMidnight)

		fmt.Println("🕛 Session cleanup scheduled for midnight...")

		// Start countdown in hours and minutes
		for remaining := sleepDuration; remaining > 0; remaining -= time.Minute {
			hours := int(remaining.Hours())
			minutes := int(remaining.Minutes()) % 60
			fmt.Printf("\r⏳ Time until cleanup: %02d h %02d min   ", hours, minutes) // Overwrites same line
			time.Sleep(1 * time.Minute)
		}

		fmt.Println("\n🚀 Running session cleanup...")

		// Run session cleanup
		if err := sqlite.CleanupSessions(sqlite.DB, 24); err != nil {
			fmt.Printf("❌ [%s] Session cleanup failed: %v\n", time.Now().Format(time.RFC3339), err)
		} else {
			fmt.Println("✅ Expired sessions cleaned up successfully at midnight.")
		}
	}
}
