package models

import (
	"time"
)

type Session struct {
	ID        string    `json:"id" db:"id"` // Session ID (UUID)
	UserID    int       `json:"user_id" db:"user_id"`
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
}
