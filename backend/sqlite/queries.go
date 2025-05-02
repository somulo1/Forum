package sqlite

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"forum/models"

	"github.com/google/uuid"
)

// GetUserByUsername retrieves a user by username
func GetUserByUsername(db *sql.DB, username string) (models.User, error) {
	var user models.User
	err := db.QueryRow(`
		SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?
	`, username).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		return models.User{}, err
	}
	return user, nil
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
func CreatePost(db *sql.DB, userID int, categoryID *int, title, content string) error {
	result, err := db.Exec(`
		INSERT INTO posts (user_id, category_id, title, content, created_at, updated_at)
		VALUES (?, COALESCE(?, NULL), ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`, userID, categoryID, title, content)
	if err != nil {
		log.Println("❌ Error inserting post:", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		log.Println("⚠️ No rows were inserted.")
	}
	fmt.Println("\n", result)
	return nil
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
		SELECT 
			posts.id, 
			posts.user_id, 
			users.username, 
			posts.title, 
			posts.content, 
			posts.category_id, 
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
			&post.Username, // You'll need to add this to your Post struct
			&post.Title,
			&post.Content,
			&post.CategoryID,
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
func ToggleLike(db *sql.DB, userID int, postID *int, commentID *int) error {
	if (postID == nil && commentID == nil) || (postID != nil && commentID != nil) {
		return errors.New("must provide either postID or commentID, but not both")
	}

	var res sql.Result
	var err error

	if commentID == nil {
		res, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND post_id = ?`, userID, postID)
	} else {
		res, err = db.Exec(`DELETE FROM likes WHERE user_id = ? AND comment_id = ?`, userID, commentID)
	}

	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		if commentID == nil {
			_, err = db.Exec(`INSERT INTO likes (user_id, post_id) VALUES (?, ?)`, userID, postID)
		} else {
			_, err = db.Exec(`INSERT INTO likes (user_id, comment_id) VALUES (?, ?)`, userID, commentID)
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

// IsUniqueConstraintError checks if an error is due to a unique constraint violation in SQLite
func IsUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
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
// trending

func FetchTrendingPosts(db *sql.DB) ([]models.Post, error) {
	var posts []models.Post

	query := `
		SELECT p.id, p.title, p.content, COUNT(l.id) AS like_count, COUNT(c.id) AS comment_count
		FROM posts p
		LEFT JOIN likes l ON p.id = l.post_id
		LEFT JOIN comments c ON p.id = c.post_id
		WHERE p.created_at >= datetime('now', '-7 days')
		GROUP BY p.id
		ORDER BY (COUNT(l.id) + COUNT(c.id)) DESC
		LIMIT 10;
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post models.Post
		if err := rows.Scan(&post.ID, &post.Title, &post.Content, 0, 0); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

// Define the Trend struct to match your database structure
type Trend struct {
	Tag   string `json:"tag"`
	Posts int    `json:"posts"`
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
		SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?
	`, email).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt)
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

	query := `SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE id = ?`
	err := db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}
