package models

import "time"

type Post struct {
	ID           int        `json:"id" gorm:"primaryKey"`
	Title        string     `json:"title" validate:"required" gorm:"not null"`
	ImageURL     string     `json:"image_url,omitempty" gorm:"type:text"`
	Content      string     `json:"content" validate:"required" gorm:"not null"`
	Username     string     `json:"username" gorm:"-"`
	UserID       int        `json:"user_id" gorm:"not null"`
	AvatarURL    string     `json:"avatar_url"`
	CategoryID   *int       `json:"category_id,omitempty"`
	CategoryName string     `json:"category_name,omitempty" gorm:"-"`
	Categories   []Category `json:"categories"`
	CategoryIDs  []int      `json:"category_ids" gorm:"-"`
	Comments     []Comment  `json:"comments" gorm:"foreignKey:PostID"`
	CommentCount int        `json:"comment_count" gorm:"-"`
	Likes        []Like     `json:"likes" gorm:"foreignKey:PostID"`
	LikeCount    int        `json:"like_count" gorm:"-"`
	UserLiked    bool       `json:"user_liked" gorm:"-"`
	CreatedAt    time.Time  `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"autoUpdateTime"`
}
