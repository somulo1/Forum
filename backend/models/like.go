package models

type Like struct {
    ID       int    `json:"id" validate:"required"`
    UserID   int    `json:"user_id" validate:"required"`
    PostID   int    `json:"post_id" validate:"required"`
    CommentID int    `json:"comment_id" validate:"required"`
    IsLike   bool   `json:"is_like" validate:"required"`
}