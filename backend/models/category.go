package models

type Category struct {
	ID         int     `json:"id" gorm:"primaryKey"`
	Name       string  `json:"name" validate:"required" gorm:"unique;not null"`
	Posts      []*Post `json:"posts,omitempty" gorm:"many2many:post_categories"`
	PostsCount int     `json:"posts_count" gorm:"-"`
}
