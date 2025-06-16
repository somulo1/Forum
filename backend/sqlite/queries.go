package sqlite

import (
	"database/sql"
	"errors"
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
        INSERT INTO posts (user_id, category_id, ImageURL, title, content, created_at, updated_at)
        VALUES (?, COALESCE(?, NULL), '', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, userID, categoryID, title, content)
	if err != nil {
		log.Println("❌ Error inserting post:", err)
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		log.Println("⚠️ No rows were inserted.")
	}
	return nil
}

// GetPost retrieves a single post by ID
func GetPost(db *sql.DB, postID int) (models.Post, error) {
	var post models.Post
	err := db.QueryRow(`
        SELECT 
            id,
            user_id,
            title,
            content,
            ImageURL,
            category_id,
            created_at,
            updated_at
        FROM posts 
        WHERE id = ?
    `, postID).Scan(
		&post.ID,
		&post.UserID,
		&post.Title,
		// &post.AvatarURL,
		&post.Content,
		&post.ImageURL,
		&post.CategoryID,
		&post.CreatedAt,
		&post.UpdatedAt,
	)
	if err != nil {
		return models.Post{}, err
	}
	return post, nil
}

func GetPosts(db *sql.DB, page, limit int, categoryID *int) ([]models.Post, error) {
	offset := (page - 1) * limit

	// Build the query with optional category filter
	query := `
        SELECT
            posts.id,
            posts.user_id,
            users.username,
			users.AvatarURL,
            posts.title,
			posts.ImageURL,
            posts.content,
            posts.category_id,
            categories.name as category_name,
            posts.created_at,
            posts.updated_at,
            COUNT(DISTINCT comments.id) as comment_count,
            COUNT(DISTINCT likes.user_id) as like_count
        FROM posts
        JOIN users ON posts.user_id = users.id
        LEFT JOIN categories ON posts.category_id = categories.id
        LEFT JOIN comments ON posts.id = comments.post_id
        LEFT JOIN likes ON posts.id = likes.post_id`

	args := []interface{}{}

	// Add category filter if specified
	if categoryID != nil {
		query += ` WHERE posts.category_id = ?`
		args = append(args, *categoryID)
	}

	query += `
        GROUP BY posts.id
        ORDER BY posts.created_at DESC
        LIMIT ? OFFSET ?`

	args = append(args, limit, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Println("Error fetching posts:", err) // Log the error
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		// var user models.User
		var commentCount, likeCount int
		err := rows.Scan(
			&post.ID,
			&post.UserID,
			&post.Username,
			&post.AvatarURL,
			&post.Title,
			&post.ImageURL,
			&post.Content,
			&post.CategoryID,
			&post.CategoryName,
			&post.CreatedAt,
			&post.UpdatedAt,
			&commentCount,
			&likeCount,
		)
		if err != nil {
			return nil, err
		}

		// Get latest comments
		comments, err := GetPostComments(db, post.ID)
		if err != nil {
			return nil, err
		}
		post.Comments = comments
		post.CommentCount = commentCount
		post.LikeCount = likeCount

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
	return CreateCommentWithParent(db, userID, postID, nil, content)
}

// CreateCommentWithParent inserts a new comment with optional parent (for replies)
func CreateCommentWithParent(db *sql.DB, userID, postID int, parentID *int, content string) error {
	_, err := db.Exec(`
		INSERT INTO comments (user_id, post_id, parent_id, content)
		VALUES (?, ?, ?, ?)
	`, userID, postID, parentID, content)
	return err
}

// GetPostComments retrieves comments for a specific post with like data
func GetPostComments(db *sql.DB, postID int) ([]models.Comment, error) {
	return GetPostCommentsWithUser(db, postID, 0)
}

// GetPostCommentsWithUser retrieves comments for a specific post with like data and user like status
func GetPostCommentsWithUser(db *sql.DB, postID int, userID int) ([]models.Comment, error) {
	query := `
		SELECT
			c.id,
			c.user_id,
			c.parent_id,
			c.content,
			c.created_at,
			u.username,
			COUNT(DISTINCT l.user_id) as like_count,
			CASE WHEN ul.user_id IS NOT NULL THEN 1 ELSE 0 END as user_liked
		FROM comments c
		JOIN users u ON c.user_id = u.id
		LEFT JOIN likes l ON c.id = l.comment_id
		LEFT JOIN likes ul ON c.id = ul.comment_id AND ul.user_id = ?
		WHERE c.post_id = ?
		GROUP BY c.id, c.user_id, c.parent_id, c.content, c.created_at, u.username, ul.user_id
		ORDER BY c.parent_id ASC, c.created_at ASC
	`

	rows, err := db.Query(query, userID, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		var username string
		var likeCount int
		var userLiked int
		if err := rows.Scan(&comment.ID, &comment.UserID, &comment.ParentID, &comment.Content, &comment.CreatedAt, &username, &likeCount, &userLiked); err != nil {
			return nil, err
		}
		comment.Username = username
		comment.LikesCount = likeCount
		comment.UserLiked = userLiked == 1
		comments = append(comments, comment)
	}
	// Organize comments into threaded structure
	return organizeCommentsIntoThreads(comments), nil
}

// organizeCommentsIntoThreads converts flat comment list into nested structure
func organizeCommentsIntoThreads(flatComments []models.Comment) []models.Comment {
	commentMap := make(map[int]*models.Comment)
	var rootComments []models.Comment

	// First pass: create map of all comments
	for i := range flatComments {
		comment := flatComments[i]
		commentMap[comment.ID] = &comment
	}

	// Second pass: organize into threads
	for _, comment := range flatComments {
		if comment.ParentID == nil {
			// Root comment
			rootComments = append(rootComments, comment)
		} else {
			// Reply comment - add to parent's replies
			if parent, exists := commentMap[*comment.ParentID]; exists {
				parent.Replies = append(parent.Replies, comment)
			}
		}
	}

	return rootComments
}

// CreateCategory inserts a new category
func CreateCategory(db *sql.DB, name string) error {
	_, err := db.Exec(`
		INSERT INTO categories (name)
		VALUES (?)
	`, name)
	return err
}

// GetCategories retrieves all categories with post counts
func GetCategories(db *sql.DB) ([]models.Category, error) {
	query := `
		SELECT
			c.id,
			c.name,
			COUNT(p.id) as posts_count
		FROM categories c
		LEFT JOIN posts p ON c.id = p.category_id
		GROUP BY c.id, c.name
		ORDER BY c.name ASC
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var category models.Category
		var postsCount int
		if err := rows.Scan(&category.ID, &category.Name, &postsCount); err != nil {
			return nil, err
		}
		category.PostsCount = postsCount
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

	query := `SELECT id, username, email, AvatarURL, password_hash, created_at, updated_at FROM users WHERE id = ?`
	err := db.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.AvatarURL, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetPostsByUser fetches posts created by a specific user
func GetPostsByUser(db *sql.DB, userID, page, limit int) ([]models.Post, error) {
	offset := (page - 1) * limit

	query := `
        SELECT
            p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at,
            u.username,
            COALESCE(like_counts.like_count, 0) as like_count,
            COALESCE(comment_counts.comment_count, 0) as comment_count,
            c.name as category_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as like_count
            FROM likes
            WHERE post_id IS NOT NULL
            GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as comment_count
            FROM comments
            GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var categoryName sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.UserID, &post.CreatedAt, &post.UpdatedAt,
			&post.Username, &post.LikeCount, &post.CommentCount, &categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid && categoryName.String != "" {
			post.Categories = append(post.Categories, models.Category{Name: categoryName.String})
		}

		posts = append(posts, post)
	}

	return posts, nil
}

// GetPostsLikedByUser fetches posts liked by a specific user
func GetPostsLikedByUser(db *sql.DB, userID, page, limit int) ([]models.Post, error) {
	offset := (page - 1) * limit

	query := `
        SELECT
            p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at,
            u.username,
            COALESCE(like_counts.like_count, 0) as like_count,
            COALESCE(comment_counts.comment_count, 0) as comment_count,
            c.name as category_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN likes l ON p.id = l.post_id AND l.user_id = ?
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as like_count
            FROM likes
            WHERE post_id IS NOT NULL
            GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as comment_count
            FROM comments
            GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var categoryName sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.UserID, &post.CreatedAt, &post.UpdatedAt,
			&post.Username, &post.LikeCount, &post.CommentCount, &categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid && categoryName.String != "" {
			post.Categories = append(post.Categories, models.Category{Name: categoryName.String})
		}

		posts = append(posts, post)
	}

	return posts, nil
}

// HasUserLikedPost checks if a user has liked a specific post
func HasUserLikedPost(db *sql.DB, userID, postID int) (bool, error) {
	query := `SELECT COUNT(*) FROM likes WHERE user_id = ? AND post_id = ?`

	var count int
	err := db.QueryRow(query, userID, postID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// SearchPosts searches for posts by title, content, or author
func SearchPosts(db *sql.DB, searchQuery string, page, limit int) ([]models.Post, error) {
	offset := (page - 1) * limit

	// Use LIKE with wildcards for search
	searchPattern := "%" + searchQuery + "%"

	query := `
        SELECT
            p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at,
            u.username,
            COALESCE(like_counts.like_count, 0) as like_count,
            COALESCE(comment_counts.comment_count, 0) as comment_count,
            c.name as category_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as like_count
            FROM likes
            WHERE post_id IS NOT NULL
            GROUP BY post_id
        ) like_counts ON p.id = like_counts.post_id
        LEFT JOIN (
            SELECT post_id, COUNT(*) as comment_count
            FROM comments
            GROUP BY post_id
        ) comment_counts ON p.id = comment_counts.post_id
        WHERE (
            p.title LIKE ? OR
            p.content LIKE ? OR
            u.username LIKE ?
        )
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    `

	rows, err := db.Query(query, searchPattern, searchPattern, searchPattern, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var post models.Post
		var categoryName sql.NullString

		err := rows.Scan(
			&post.ID, &post.Title, &post.Content, &post.UserID, &post.CreatedAt, &post.UpdatedAt,
			&post.Username, &post.LikeCount, &post.CommentCount, &categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryName.Valid && categoryName.String != "" {
			post.Categories = append(post.Categories, models.Category{Name: categoryName.String})
		}

		posts = append(posts, post)
	}

	return posts, nil
}
