package models

type Comment struct {
    ID       int    `json:"id" validate:"required"`
    Content  string `json:"content" validate:"required,min=3,max=1024"`
    PostID   int    `json:"post_id" validate:"required"`
    UserID   int    `json:"user_id" validate:"required"`
}