-- Migration to add parent_id column to comments table for nested comments support

-- Add parent_id column to comments table if it doesn't exist
ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL;

-- Add foreign key constraint for parent_id (SQLite doesn't support adding FK constraints to existing tables)
-- So we'll handle this in the application logic

-- Create index for better performance on parent_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
