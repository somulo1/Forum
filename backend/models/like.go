package models

type Like struct {
	ID        int  `json:"id" gorm:"primaryKey"`
	UserID    int  `json:"user_id" validate:"required" gorm:"not null"`
	PostID    *int `json:"post_id,omitempty"`
	CommentID *int `json:"comment_id,omitempty"` // Allows NULL for post likes
	IsLike    bool `json:"is_like" validate:"required" gorm:"not null"`
}
