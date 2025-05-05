package models

import "time"

type User struct {
	ID           int       `json:"id" gorm:"primaryKey"`
	Username     string    `json:"username" gorm:"unique;not null"`
	Email        string    `json:"email" gorm:"unique;not null"`
	AvatarURL    string    `json:"avatar_url"`
	PasswordHash string    `json:"-" gorm:"not null"` // ✅ Ensure this field exists
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
