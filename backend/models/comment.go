package models

import "time"

type Comment struct {
    ID        int       `json:"id" gorm:"primaryKey"`
    UserID    int       `json:"user_id" validate:"required" gorm:"not null"`
    Username  string    `json:"username" gorm:"-"`
    PostID    int       `json:"post_id" validate:"required" gorm:"not null"`
    Content   string    `json:"content" validate:"required" gorm:"not null"`
    Likes     []Like    `json:"likes" gorm:"foreignKey:CommentID"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}