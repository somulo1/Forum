package models

type Post struct {
    ID          int    `json:"id" validate:"required"`
    Title       string `json:"title" validate:"required,min=3,max=128"`
    Content     string `json:"content" validate:"required,min=3,max=1024"`
    UserID      int    `json:"user_id" validate:"required"`
    CategoryID  int    `json:"category_id" validate:"required"`
}