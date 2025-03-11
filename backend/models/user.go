package models

import "time"

type User struct {
	ID        int       `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" validate:"required" gorm:"unique;not null"`
	Email     string    `json:"email" validate:"required,email" gorm:"unique;not null"`
	Password  string    `json:"-" validate:"required"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}
