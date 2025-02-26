package models

import (
	"time"
)

type Comment struct {
	ID        int       `json:"id" db:"id"`
	Content   string    `json:"content" db:"content"`
	UserID    int       `json:"user_id" db:"user_id"` // Author ID
	PostID    int       `json:"post_id" db:"post_id"` // Parent post ID
	Likes     int       `json:"likes" db:"likes"`
	Dislikes  int       `json:"dislikes" db:"dislikes"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
