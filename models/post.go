package models

type Post struct {
    ID       int    `json:"id"`
    Title    string `json:"title"`
    Content  string `json:"content"`
    UserID   int    `json:"user_id"`
    CategoryID int    `json:"category_id"`
}