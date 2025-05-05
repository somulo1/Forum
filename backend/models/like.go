package models

import "time"

type Like struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	UserID    int       `json:"user_id" validate:"required" gorm:"not null"`
	PostID    *int      `json:"post_id,omitempty"`
	CommentID *int      `json:"comment_id,omitempty"`
	IsLike    bool      `json:"is_like" validate:"required" gorm:"not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
