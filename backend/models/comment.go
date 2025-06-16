package models

import "time"

type Comment struct {
	ID         int       `json:"id" gorm:"primaryKey"`
	UserID     int       `json:"user_id" validate:"required" gorm:"not null"`
	Username   string    `json:"username" gorm:"-"`
	PostID     int       `json:"post_id" validate:"required" gorm:"not null"`
	ParentID   *int      `json:"parent_id,omitempty" gorm:"default:null"`
	Content    string    `json:"content" validate:"required" gorm:"not null"`
	Likes      []Like    `json:"likes" gorm:"foreignKey:CommentID"`
	LikesCount int       `json:"likes_count" gorm:"-"`
	UserLiked  bool      `json:"user_liked" gorm:"-"`
	Replies    []Comment `json:"replies,omitempty" gorm:"-"`
	CreatedAt  time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
