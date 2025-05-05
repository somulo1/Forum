package utils

import (
	"encoding/json"
	"net/http"
)

// JSONResponse sends a JSON response with the given status code and data
func JSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse sends a JSON response with an error message
func ErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	JSONResponse(w, statusCode, map[string]string{"error": message})
}

// SuccessResponse sends a JSON response with a success message
func SuccessResponse(w http.ResponseWriter, message string) {
	JSONResponse(w, http.StatusOK, map[string]string{"message": message})
}

// SendJSONError sends a JSON response with an error message
func SendJSONError(w http.ResponseWriter, message string, statusCode int) {
	JSONResponse(w, statusCode, map[string]string{"error": message})
}

// SendJSONResponse sends a JSON response with a success message
func SendJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	JSONResponse(w, statusCode, data)
}
