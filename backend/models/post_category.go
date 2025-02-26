package models

// Join table for many-to-many relationship between posts and categories
type PostCategory struct {
	PostID     int `json:"post_id" db:"post_id"`
	CategoryID int `json:"category_id" db:"category_id"`
}
