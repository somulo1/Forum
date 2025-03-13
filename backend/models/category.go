package models

type Category struct {
<<<<<<< HEAD
    ID       int    `json:"id" validate:"required"`
    Name     string `json:"name" validate:"required,min=3,max=32"`
}
=======
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" validate:"required" gorm:"unique;not null"`
}
>>>>>>> backend-handlers
