package models

import "time"

type Post struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" validate:"required" gorm:"not null"`
	Content     string    `json:"content" validate:"required" gorm:"not null"`
	Username    string    `json:"username" gorm:"-"`
	UserID      int       `json:"user_id" gorm:"not null"`
	CategoryIDs []int     `json:"category_ids" gorm:"-"` // For multiple categories
	ImageURL    *string   `json:"image_url,omitempty"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
