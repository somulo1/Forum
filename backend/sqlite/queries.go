package sqlite

import (
	"database/sql"
	"time"

	"forum/models"

	"github.com/google/uuid"
)

// GetUserByUsername retrieves a user by username
func GetUserByUsername(db *sql.DB, username string) *sql.Row {
	return db.QueryRow(`SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?`, username)
}

// CreateUser inserts a new user into the database
func CreateUser(db *sql.DB, username, email, passwordHash string) error {
	_, err := db.Exec(`
		INSERT INTO users (username, email, password_hash)
		VALUES (?, ?, ?)
	`, username, email, passwordHash)
	return err
}

// CreatePost inserts a new post
func CreatePost(db *sql.DB, userID int, title, content string) error {
	_, err := db.Exec(`
		INSERT INTO posts (user_id, title, content)
		VALUES (?, ?, ?)
	`, userID, title, content)
	return err
}

// GetPost retrieves a single post by ID
func GetPost(db *sql.DB, postID int) (models.Post, error) {
	var post models.Post
	err := db.QueryRow(`
        SELECT id, user_id, title, content FROM posts WHERE id = ?
    `, postID).Scan(&post.ID, &post.UserID, &post.Title, &post.Content)
	if err != nil {
		return models.Post{}, err
	}
	return post, nil
}

// GetPosts retrieves posts with pagination
func GetPosts(db *sql.DB, page, limit int) ([]models.Post, error) {
	var posts []models.Post
	offset := (page - 1) * limit

	rows, err := db.Query(`
		SELECT id, user_id, title, content, created_at FROM posts
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.Post
		if err := rows.Scan(&post.ID, &post.UserID, &post.Title, &post.Content, &post.CreatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// DeletePost removes a post by ID
func DeletePost(db *sql.DB, postID int) error {
	_, err := db.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}

// ToggleLike toggles a like for a post or comment
func ToggleLike(db *sql.DB, userID, postID int, commentID *int) error {
	var res sql.Result
	var err error

	if commentID == nil {
		res, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`, userID, postID)
	} else {
		res, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND comment_id = ?`, userID, *commentID)
	}
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		if commentID == nil {
			_, err = db.Exec(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, userID, postID)
		} else {
			_, err = db.Exec(`INSERT INTO likes (user_id, comment_id) VALUES (?, ?)`, userID, *commentID)
		}
	}
	return err
}

// CleanupSessions removes expired sessions
func CleanupSessions(db *sql.DB, expiryHours int) error {
	_, err := db.Exec(`
	DELETE FROM sessions WHERE created_at <= datetime('now', '-'|| ? || ' hours')
`, -expiryHours)
	return err
}

// GetUserIDFromSession retrieves a user ID from a session ID
func GetUserIDFromSession(db *sql.DB, sessionID string) (int, error) {
	var userID int
	err := db.QueryRow(`
		SELECT user_id FROM sessions WHERE id = ?
	`, sessionID).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, nil // No user found
		}
		return 0, err
	}
	return userID, nil
}

// CreateComment inserts a new comment
func CreateComment(db *sql.DB, userID, postID int, content string) error {
	_, err := db.Exec(`
		INSERT INTO comments (user_id, post_id, content)
		VALUES (?, ?, ?)
	`, userID, postID, content)
	return err
}

// GetPostComments retrieves comments for a specific post
func GetPostComments(db *sql.DB, postID int) ([]map[string]interface{}, error) {
	rows, err := db.Query(`
		SELECT id, user_id, content, created_at
		FROM comments
		WHERE post_id = ?
		ORDER BY created_at ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []map[string]any
	for rows.Next() {
		var id, userID int
		var content string
		var createdAt string
		if err := rows.Scan(&id, &userID, &content, &createdAt); err != nil {
			return nil, err
		}

		comments = append(comments, map[string]any{
			"id":         id,
			"user_id":    userID,
			"content":    content,
			"created_at": createdAt,
		})
	}
	return comments, nil
}

// CreateCategory inserts a new category
func CreateCategory(db *sql.DB, name string) error {
	_, err := db.Exec(`
		INSERT INTO categories (name)
		VALUES (?)
	`, name)
	return err
}

// GetCategories retrieves all categories
func GetCategories(db *sql.DB) (*sql.Rows, error) {
	return db.Query(`
		SELECT id, name FROM categories
	`)
}

// UpdatePost updates an existing post's title and content
func UpdatePost(db *sql.DB, postID int, title, content string) error {
	_, err := db.Exec(`
		UPDATE posts 
		SET title = ?, content = ?
		WHERE id = ?
	`, title, content, postID)
	return err
}

// DeleteComment removes a comment from the database by its ID
func DeleteComment(db *sql.DB, commentID int) error {
	_, err := db.Exec(`
		DELETE FROM comments WHERE id = ?
	`, commentID)
	return err
}

// GetUserByEmail retrieves a user by email
func GetUserByEmail(db *sql.DB, email string) *sql.Row {
	return db.QueryRow(`
		SELECT id, username, email, password_hash FROM users WHERE email = ?
	`, email)
}

// CreateSession creates a new session for a user and returns the session ID
func CreateSession(db *sql.DB, userID int) (string, error) {
	sessionID := uuid.New().String()
	_, err := db.Exec(`
		INSERT INTO sessions (id, user_id, created_at) VALUES (?, ?, ?)
	`, sessionID, userID, time.Now())
	if err != nil {
		return "", err
	}
	return sessionID, nil
}

// DeleteSession removes a session from the database
func DeleteSession(db *sql.DB, sessionID string) error {
	_, err := db.Exec(`
		DELETE FROM sessions WHERE id = ?
	`, sessionID)
	return err
}
