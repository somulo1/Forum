package sqlite

import (
	"database/sql"
	"errors"
	"time"
)

// User-related queries
func CreateUser(username, email, passwordHash string) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO users (username, email, password_hash)
		VALUES (?, ?, ?)
	`, username, email, passwordHash)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func GetUserByUsername(username string) (*sql.Row, error) {
	return DB.QueryRow(`
		SELECT id, username, email, password_hash, created_at
		FROM users
		WHERE username = ?
	`, username), nil
}

// Category-related queries
func CreateCategory(name, description string) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO categories (name, description)
		VALUES (?, ?)
	`, name, description)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func GetCategories() (*sql.Rows, error) {
	return DB.Query(`
		SELECT id, name, description, created_at
		FROM categories
		ORDER BY name
	`)
}

// Post-related queries
func CreatePost(title, content string, userID, categoryID int64) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO posts (title, content, user_id, category_id)
		VALUES (?, ?, ?, ?)
	`, title, content, userID, categoryID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func GetPost(postID int64) (*sql.Row, error) {
	return DB.QueryRow(`
		SELECT p.id, p.title, p.content, p.created_at, p.updated_at,
			   u.username, c.name as category_name
		FROM posts p
		JOIN users u ON p.user_id = u.id
		JOIN categories c ON p.category_id = c.id
		WHERE p.id = ?
	`, postID), nil
}

func GetPosts(page, pageSize int) (*sql.Rows, error) {
	offset := (page - 1) * pageSize
	return DB.Query(`
		SELECT p.id, p.title, p.content, p.created_at,
			   u.username, c.name as category_name,
			   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
			   (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND is_like = true) as like_count
		FROM posts p
		JOIN users u ON p.user_id = u.id
		JOIN categories c ON p.category_id = c.id
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`, pageSize, offset)
}

// Comment-related queries
func CreateComment(content string, userID, postID int64, parentID *int64) (int64, error) {
	result, err := DB.Exec(`
		INSERT INTO comments (content, user_id, post_id, parent_id)
		VALUES (?, ?, ?, ?)
	`, content, userID, postID, parentID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func GetPostComments(postID int64) (*sql.Rows, error) {
	return DB.Query(`
		SELECT c.id, c.content, c.created_at, c.parent_id,
			   u.username,
			   (SELECT COUNT(*) FROM likes WHERE comment_id = c.id AND is_like = true) as like_count
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at
	`, postID)
}

// Like-related queries
func ToggleLike(userID, postID, commentID int64, isLike bool) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if a like/dislike already exists
	var existingID int64
	var existingIsLike bool
	err = tx.QueryRow(`
		SELECT id, is_like FROM likes
		WHERE user_id = ? AND post_id = ? AND comment_id = ?
	`, userID, postID, commentID).Scan(&existingID, &existingIsLike)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Create new like/dislike
			_, err = tx.Exec(`
				INSERT INTO likes (user_id, post_id, comment_id, is_like)
				VALUES (?, ?, ?, ?)
			`, userID, postID, commentID, isLike)
		}
		return err
	}

	// Update existing like/dislike
	if existingIsLike != isLike {
		_, err = tx.Exec(`
			UPDATE likes
			SET is_like = ?, updated_at = ?
			WHERE id = ?
		`, isLike, time.Now(), existingID)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
