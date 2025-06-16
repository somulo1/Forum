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

	// Apply schema from schema.sql file only if tables don't exist
	if err := applySchemaIfNeeded(); err != nil {
		return fmt.Errorf("failed to apply schema: %w", err)
	}

	// Run migrations for existing databases
	if err := runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

// applySchemaIfNeeded checks if tables exist and applies schema if needed
func applySchemaIfNeeded() error {
	// Check if users table exists
	var tableName string
	err := DB.QueryRow("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").Scan(&tableName)

	if err != nil {
		// Table doesn't exist, apply schema
		return applySchemaFromFile("schema.sql")
	}

	// Tables exist, no need to apply schema
	fmt.Println("✅ Database tables already exist, skipping schema application")
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

// runMigrations applies database migrations
func runMigrations() error {
	// Check if parent_id column exists in comments table
	var columnExists bool
	err := DB.QueryRow(`
		SELECT COUNT(*) > 0
		FROM pragma_table_info('comments')
		WHERE name = 'parent_id'
	`).Scan(&columnExists)

	if err != nil {
		return fmt.Errorf("failed to check parent_id column: %w", err)
	}

	if !columnExists {
		fmt.Println("🔄 Adding parent_id column to comments table...")
		_, err = DB.Exec(`ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL`)
		if err != nil {
			return fmt.Errorf("failed to add parent_id column: %w", err)
		}

		// Create index for parent_id
		_, err = DB.Exec(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)`)
		if err != nil {
			return fmt.Errorf("failed to create parent_id index: %w", err)
		}

		fmt.Println("✅ Successfully added nested comments support")
	}

	return nil
}

// CloseDatabase closes the database connection
func CloseDatabase() {
	if DB != nil {
		DB.Close()
	}
}
