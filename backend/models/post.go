package models

import (
	"time"
)

type Post struct {
	ID         int       `json:"id" db:"id"`
	Title      string    `json:"title" db:"title"`
	Content    string    `json:"content" db:"content"`
	UserID     int       `json:"user_id" db:"user_id"` // Author ID
	Categories []string  `json:"categories" db:"-"`    // Not stored directly (handled via join table)
	Likes      int       `json:"likes" db:"likes"`
	Dislikes   int       `json:"dislikes" db:"dislikes"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at,omitempty" db:"updated_at"` // Optional
	Comments   []Comment `json:"comments,omitempty" db:"-"`            // Optional (loaded separately)
}
