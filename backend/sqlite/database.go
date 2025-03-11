package sqlite

import (
	"database/sql"
	"fmt"
	"io"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

// InitializeDatabase initializes the SQLite database
func InitializeDatabase(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
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
	return err
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	if DB != nil {
		DB.Close()
	}
}
