package models

type Like struct {
	ID        int    `json:"id" db:"id"`
	UserID    int    `json:"user_id" db:"user_id"`
	PostID    int    `json:"post_id,omitempty" db:"post_id"`     // Optional (if liking a post)
	CommentID int    `json:"comment_id,omitempty" db:"comment_id"` // Optional (if liking a comment)
	Type      string `json:"type" db:"type"`                      // "like" or "dislike"
}