package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"forum/sqlite"
	"forum/utils"
)

func RegisterUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	log.Printf("Registration request received")

	var username, email, password string
	var avatarFile *multipart.FileHeader

	// Check content type to determine how to parse the request
	contentType := r.Header.Get("Content-Type")
	log.Printf("Content-Type: %s", contentType)

	if strings.Contains(contentType, "multipart/form-data") {
		// Parse multipart form data (e.g., image + text)
		err := r.ParseMultipartForm(10 << 20) // 10 MB max
		if err != nil {
			log.Printf("Error parsing multipart form: %v", err)
			utils.SendJSONError(w, "Error parsing form data", http.StatusBadRequest)
			return
		}

		username = r.FormValue("username")
		email = r.FormValue("email")
		password = r.FormValue("password")

		// Handle avatar file if present
		if file, handler, err := r.FormFile("avatar"); err == nil {
			file.Close() // Close immediately, we'll reopen later if needed
			avatarFile = handler
		}
	} else {
		// Parse JSON data
		var requestData struct {
			Username string `json:"username"`
			Email    string `json:"email"`
			Password string `json:"password"`
		}

		// Read the body first to log it
		body, err := io.ReadAll(r.Body)
		if err != nil {
			log.Printf("Error reading request body: %v", err)
			utils.SendJSONError(w, "Error reading request data", http.StatusBadRequest)
			return
		}
		log.Printf("Raw request body: %s", string(body))

		err = json.Unmarshal(body, &requestData)
		if err != nil {
			log.Printf("Error parsing JSON: %v", err)
			log.Printf("JSON content: %s", string(body))
			utils.SendJSONError(w, "Error parsing request data", http.StatusBadRequest)
			return
		}

		username = requestData.Username
		email = requestData.Email
		password = requestData.Password
	}

	log.Printf("Registration data - Username: %s, Email: %s", username, email)

	if username == "" || email == "" || password == "" {
		log.Printf("Missing required fields")
		utils.SendJSONError(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// Handle avatar upload - simplified approach
	var avatarURL string = "/static/default.png" // Default avatar

	if avatarFile != nil {
		log.Printf("Avatar file received: %s", avatarFile.Filename)

		// Reopen the file for processing
		file, err := avatarFile.Open()
		if err != nil {
			log.Printf("Error opening avatar file: %v", err)
			// Use default avatar, continue with registration
		} else {
			defer file.Close()

			// Ensure the static directory exists
			staticDir := "static"
			if _, err := os.Stat(staticDir); os.IsNotExist(err) {
				log.Printf("Creating static directory")
				if err := os.MkdirAll(staticDir, 0o755); err != nil {
					log.Printf("Failed to create static directory: %v", err)
					// Don't fail registration, just use default avatar
					avatarURL = "/static/default.png"
				} else {
					// Try to save the avatar
					safeFilename := filepath.Base(avatarFile.Filename)
					avatarFilename := fmt.Sprintf("avatar_%d_%s", time.Now().UnixNano(), safeFilename)
					avatarPath := filepath.Join(staticDir, avatarFilename)

					dst, err := os.Create(avatarPath)
					if err != nil {
						log.Printf("Error creating file: %v", err)
						// Don't fail registration, use default avatar
						avatarURL = "/static/default.png"
					} else {
						defer dst.Close()

						// Check MIME type
						buf := make([]byte, 512)
						_, err = file.Read(buf)
						if err != nil {
							log.Printf("Error reading avatar data: %v", err)
							avatarURL = "/static/default.png"
						} else {
							filetype := http.DetectContentType(buf)
							if filetype != "image/jpeg" && filetype != "image/png" && filetype != "image/gif" {
								log.Printf("Unsupported image format: %s", filetype)
								avatarURL = "/static/default.png"
							} else {
								// Reset file pointer and save
								file.Seek(0, io.SeekStart)
								_, err = io.Copy(dst, file)
								if err != nil {
									log.Printf("Error saving avatar: %v", err)
									avatarURL = "/static/default.png"
								} else {
									avatarURL = "/" + avatarPath
									log.Printf("Avatar uploaded successfully: %s", avatarURL)
								}
							}
						}
					}
				}
			}
		}
	}

	log.Printf("Using avatar URL: %s", avatarURL)

	// Hash password
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		utils.SendJSONError(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	log.Printf("Password hashed successfully")

	// Save user to DB
	err = sqlite.CreateUser(db, username, email, hashedPassword, avatarURL)
	if err != nil {
		log.Printf("Database error creating user: %v", err)
		if sqlite.IsUniqueConstraintError(err) {
			utils.SendJSONError(w, "Username or email already exists", http.StatusConflict)
		} else {
			utils.SendJSONError(w, "Database error", http.StatusInternalServerError)
		}
		return
	}

	log.Printf("User created successfully: %s", username)
	utils.SendJSONResponse(w, map[string]string{"message": "User registered successfully"}, http.StatusCreated)
}

func LoginUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var credentials struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	err := json.NewDecoder(r.Body).Decode(&credentials)
	if err != nil {
		http.Error(w, "Invalid credentials format", http.StatusBadRequest)
		return
	}
	if credentials.Password == "" {
		utils.SendJSONError(w, "Password cannot be empty", http.StatusBadRequest)
		return
	}

	// Get user from DB
	user, err := sqlite.GetUserByEmail(db, credentials.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.SendJSONError(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}
		utils.SendJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Validate password
	if !utils.CheckPasswordHash(credentials.Password, user.PasswordHash) {
		utils.SendJSONError(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Create session in database
	sessionID, err := sqlite.CreateSession(db, user.ID)
	if err != nil {
		utils.SendJSONError(w, "Failed to create session", http.StatusInternalServerError)
		return
	}

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
	})

	utils.SendJSONResponse(w, map[string]string{"message": "Logged in"}, http.StatusOK)
}

func GetUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	userID, err := utils.GetUserIDFromSession(db, r)
	// log.Printf("errr: %v\n", err)

	if err != nil {
		utils.SendJSONError(w, "Unauthorized1", http.StatusUnauthorized)

		return
	}

	user, err := sqlite.GetUserByID(db, userID)
	if err != nil {
		utils.SendJSONError(w, "User not found", http.StatusNotFound)
		return
	}

	utils.SendJSONResponse(w, user, http.StatusOK)
}

func LogoutUser(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get session cookie
	sessionCookie, err := r.Cookie("session_id")
	if err != nil {
		utils.SendJSONError(w, "No active session", http.StatusUnauthorized)
		return
	}

	// Remove session from database
	err = sqlite.DeleteSession(db, sessionCookie.Value)
	if err != nil && err != sql.ErrNoRows {
		utils.SendJSONError(w, "Failed to log out", http.StatusInternalServerError)
		return
	}

	// Clear session cookie
	http.SetCookie(w, &http.Cookie{
		Name:   "session_id",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})

	utils.SendJSONResponse(w, map[string]string{"message": "Logged out"}, http.StatusOK)
}

func RequireAuth(db *sql.DB, w http.ResponseWriter, r *http.Request) (string, bool) {
	userID, err := utils.GetUserIDFromSession(db, r)
	// log.Printf("checking more errors: %v\n", err)

	if err != nil || userID == "" {
		http.Error(w, "Unauthorized2", http.StatusUnauthorized)
		return "", false
	}
	return userID, true
}

func GetOwner(db *sql.DB, w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("user_id")
	user, err := sqlite.GetUserByID(db, userId)
	if err != nil {
		utils.SendJSONError(w, "Wrong User Id", http.StatusBadRequest)
	}
	utils.SendJSONResponse(w, user, http.StatusOK)
}
