package sqlite

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"forum/models"

	"github.com/google/uuid"
)

// GetUserByUsername retrieves a user by username
func GetUserByUsername(db *sql.DB, username string) (models.User, error) {
	var user models.User
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, avatar_url, created_at, updated_at
		FROM users WHERE username = ?
	`, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
}

// CreateUser inserts a new user into the database
func CreateUser(db *sql.DB, username, email, passwordHash, avatarURL string) error {
	_, err := db.Exec(`
		INSERT INTO users (username, email, password_hash, avatar_url)
		VALUES (?, ?, ?, ?)
	`, username, email, passwordHash, avatarURL)
	return err
}

// CreatePost inserts a new post and its category associations
func CreatePost(db *sql.DB, userID int, categoryIDs []int, title, content, imageURL string) (models.Post, error) {
	var post models.Post

	// Insert into posts table
	query := `
		INSERT INTO posts (user_id, title, content, image_url)
		VALUES (?, ?, ?, ?)
		RETURNING id, user_id, title, content, image_url, created_at
	`
	err := db.QueryRow(query, userID, title, content, imageURL).Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.ImageURL,
		&post.CreatedAt,
	)
	if err != nil {
		return post, err
	}

	// Insert into post_categories table
	for _, catID := range categoryIDs {
		_, err := db.Exec(`INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`, post.ID, catID)
		if err != nil {
			return post, fmt.Errorf("failed to insert into post_categories: %w", err)
		}
	}

	post.CategoryIDs = categoryIDs
	return post, nil
}

// GetPost retrieves a single post by ID with its category IDs
func GetPost(db *sql.DB, postID int) (models.Post, error) {
	var post models.Post

	// Fetch main post data
	err := db.QueryRow(`
        SELECT id, user_id, title, content, image_url, created_at, updated_at
        FROM posts WHERE id = ?
    `, postID).Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		&post.Content,
		&post.ImageURL,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		return post, err
	}

	// Fetch category IDs from join table
	rows, err := db.Query(`SELECT category_id FROM post_categories WHERE post_id = ?`, postID)
	if err != nil {
		return post, err
	}
	defer rows.Close()

	for rows.Next() {
		var catID int
		if err := rows.Scan(&catID); err != nil {
			return post, err
		}
		post.CategoryIDs = append(post.CategoryIDs, catID)
	}

	return post, nil
}


// GetPosts retrieves posts with pagination
func GetPosts(db *sql.DB, page, limit int) ([]models.Post, error) {
	var posts []models.Post
	offset := (page - 1) * limit

	rows, err := db.Query(`
		SELECT 
			posts.id, 
			posts.user_id, 
			users.username, 
			posts.title, 
			posts.content, 
			posts.category_id, 
			posts.image_url,
			posts.created_at, 
			posts.updated_at
		FROM posts
		JOIN users ON posts.user_id = users.id
		ORDER BY posts.created_at DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.Post
		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Username,
			&post.Title,
			&post.Content,
			&post.CategoryID,
			&post.ImageURL,
			&post.CreatedAt,
			&post.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// DeletePost removes a post by ID
func DeletePost(db *sql.DB, postID int) error {
	_, err := db.Exec(`DELETE FROM posts WHERE id = ?`, postID)
	return err
}

// ToggleLike toggles a like for a post or comment
func ToggleLike(db *sql.DB, userID int, postID *int, commentID *int, reactionType string) error {
	if reactionType != "like" && reactionType != "dislike" {
		return errors.New("invalid reaction type")
	}
	if (postID == nil && commentID == nil) || (postID != nil && commentID != nil) {
		return errors.New("must provide either postID or commentID, but not both")
	}

	var existingType string
	var query string
	var args []interface{}

	if postID != nil {
		query = `SELECT type FROM likes WHERE user_id = ? AND post_id = ?`
		args = []interface{}{userID, *postID}
	} else {
		query = `SELECT type FROM likes WHERE user_id = ? AND comment_id = ?`
		args = []interface{}{userID, *commentID}
	}

	err := db.QueryRow(query, args...).Scan(&existingType)

	switch {
	case err == sql.ErrNoRows:
		// No existing reaction — insert
		if postID != nil {
			_, err = db.Exec(`INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, ?)`, userID, *postID, reactionType)
		} else {
			_, err = db.Exec(`INSERT INTO likes (user_id, comment_id, type) VALUES (?, ?, ?)`, userID, *commentID, reactionType)
		}
	case err == nil && existingType == reactionType:
		// Same reaction exists — toggle off (delete)
		if postID != nil {
			_, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`, userID, *postID)
		} else {
			_, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND comment_id = ?`, userID, *commentID)
		}
	case err == nil:
		// Different reaction — update
		if postID != nil {
			_, err = db.Exec(`UPDATE likes SET type = ? WHERE user_id = ? AND post_id = ?`, reactionType, userID, *postID)
		} else {
			_, err = db.Exec(`UPDATE likes SET type = ? WHERE user_id = ? AND comment_id = ?`, reactionType, userID, *commentID)
		}
	default:
		return err
	}

	return err
}

func CountLikesAndDislikes(db *sql.DB, postID *int, commentID *int) (likes int, dislikes int, err error) {
	if (postID == nil && commentID == nil) || (postID != nil && commentID != nil) {
		return 0, 0, errors.New("must provide either postID or commentID, but not both")
	}

	var rows *sql.Rows
	if postID != nil {
		rows, err = db.Query(`SELECT type, COUNT(*) FROM likes WHERE post_id = ? GROUP BY type`, *postID)
	} else {
		rows, err = db.Query(`SELECT type, COUNT(*) FROM likes WHERE comment_id = ? GROUP BY type`, *commentID)
	}
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var typ string
		var count int
		if err = rows.Scan(&typ, &count); err != nil {
			return
		}
		if typ == "like" {
			likes = count
		} else if typ == "dislike" {
			dislikes = count
		}
	}
	return
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

// IsUniqueConstraintError checks if an error is due to a unique constraint violation in SQLite
func IsUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}

// CreateComment inserts a new comment
func CreateComment(db *sql.DB, userID, postID int, content string) (models.Comment, error) {
	var comment models.Comment
	query := `
		INSERT INTO comments (user_id, post_id, content)
		VALUES (?, ?, ?)
		RETURNING id, user_id, post_id, content, created_at
	`
	err := db.QueryRow(query, userID, postID, content).Scan(
		&comment.ID,
		&comment.UserID,
		&comment.PostID,
		&comment.Content,
		&comment.CreatedAt,
	)
	return comment, err
}

// GetPostComments retrieves comments for a specific post
func GetPostComments(db *sql.DB, postID int) ([]models.Comment, error) {
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

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(&comment.ID, &comment.UserID, &comment.Content, &comment.CreatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
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
func GetCategories(db *sql.DB) ([]models.Category, error) {
	rows, err := db.Query(`SELECT id, name FROM categories`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		if err := rows.Scan(&category.ID, &category.Name); err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}
	return categories, nil
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
func GetUserByEmail(db *sql.DB, email string) (models.User, error) {
	var user models.User
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, avatar_url, created_at, updated_at
		FROM users
		WHERE email = ?
	`, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
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

func GetUserByID(db *sql.DB, userID int) (*models.User, error) {
	var user models.User

	query := `
		SELECT id, username, email, password_hash, avatar_url, created_at, updated_at
		FROM users
		WHERE id = ?
	`
	err := db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.AvatarURL,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
