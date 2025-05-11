package models

type Like struct {
	UserID    int     `json:"user_id" validate:"required"`
	PostID    *int    `json:"post_id,omitempty"`
	CommentID *int    `json:"comment_id,omitempty"`
	Type      string  `json:"type" validate:"required,oneof=like dislike"` // must be "like" or "dislike"
}
