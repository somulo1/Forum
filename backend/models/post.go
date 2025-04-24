package models

import "time"

type Post struct {
	ID            int       `json:"id" gorm:"primaryKey"`
	Title         string    `json:"title" validate:"required" gorm:"not null"`
	Content       string    `json:"content" validate:"required" gorm:"not null"`
	UserID        int       `json:"user_id" gorm:"not null"`
	CategoryID    *int      `json:"category_id,omitempty"` // Supports both single & multiple categories
	CategoryIDs   []int     `json:"category_ids" gorm:"-"` // Excluded from DB, handled manually
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	LikeCount     int       `json:"like_count"`     // Number of likes
	CommentCount   int      `json:"comment_count"`  // Number of comments
}