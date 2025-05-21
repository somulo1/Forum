package models

import "time"

type Comment struct {
	ID            int       `json:"id" gorm:"primaryKey"`
	UserID        string    `json:"user_id" validate:"required" gorm:"not null"`
	UserName      string    `json:"username"`
	ProfileAvatar string    `json:"avatar_url"`
	PostID        int       `json:"post_id,omitempty"` // nullable for replies
	Content       string    `json:"content" validate:"required" gorm:"not null"`
	CreatedAt     time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Optional: Nested replies (not stored in DB, but useful for JSON/API)
	Replies []ReplyComment `json:"replies,omitempty" gorm:"-"`
}

type ReplyComment struct {
	ID              int       `json:"id" gorm:"primaryKey"`
	UserID          string    `json:"user_id" validate:"required" gorm:"not null"`
	UserName        string    `json:"username"`
	ProfileAvatar   string    `json:"avatar_url"`
	ParentCommentID int       `json:"parent_comment_id,omitempty"` // nullable for top-level comments
	Content         string    `json:"content" validate:"required" gorm:"not null"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
