package sqlite

import (
	"database/sql"
	"fmt"
	"io"
	"os"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitializeDatabase initializes the SQLite database
func InitializeDatabase(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Enable foreign key constraints
	_, err = DB.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return fmt.Errorf("failed to enable foreign key constraints: %w", err)
	}

	// Apply schema from schema.sql file
	if err := applySchemaFromFile("schema.sql"); err != nil {
		return fmt.Errorf("failed to apply schema: %w", err)
	}
	return nil
}

// applySchemaFromFile reads and executes schema.sql
func applySchemaFromFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("failed to open schema file: %w", err)
	}
	defer file.Close()

	schemaSQL, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	_, err = DB.Exec(string(schemaSQL))
	if err != nil {
		fmt.Printf("❌ Schema execution failed: %v\nContents of schema.sql:\n%s\n", err, string(schemaSQL))
		return err
	}

	return nil
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	if DB != nil {
		DB.Close()
	}
}
