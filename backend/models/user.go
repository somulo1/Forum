package models

import (
	"time"
)

type User struct {
	ID        int       `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password"` // Never expose password in JSON responses
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	AvatarURL string    `json:"avatar_url,omitempty" db:"avatar_url"` // Optional profile picture
}
