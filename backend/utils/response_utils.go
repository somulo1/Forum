package utils

import (
	"encoding/json"
	"net/http"
)

// SendJSONResponse sends a JSON response
func SendJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// SendJSONError sends a JSON error response
func SendJSONError(w http.ResponseWriter, message string, statusCode int) {
	SendJSONResponse(w, map[string]string{"error": message}, statusCode)
}
