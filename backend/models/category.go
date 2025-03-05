package models

type Category struct {
    ID       int    `json:"id" validate:"required"`
    Name     string `json:"name" validate:"required,min=3,max=32"`
}