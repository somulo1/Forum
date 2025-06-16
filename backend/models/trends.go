package models

// Post represents a forum post with relevant fields
type Trend struct {
	ID           int    `json:"id"`
	Title        string `json:"title"`
	Content      string `json:"content"`
	LikeCount    int    `json:"like_count"`    // Number of likes
	CommentCount int    `json:"comment_count"` // Number of comments
}
