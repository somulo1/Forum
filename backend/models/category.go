package models

type Category struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" validate:"required" gorm:"unique;not null"`
}
