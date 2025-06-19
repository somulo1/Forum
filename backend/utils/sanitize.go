package utils

import (
	"html"
	"regexp"
	"strings"
)

// SanitizeHTML removes all HTML tags and escapes HTML entities to prevent XSS attacks
func SanitizeHTML(input string) string {
	if input == "" {
		return ""
	}

	// First, remove all HTML tags using regex
	htmlTagRegex := regexp.MustCompile(`<[^>]*>`)
	cleaned := htmlTagRegex.ReplaceAllString(input, "")

	// Escape any remaining HTML entities
	escaped := html.EscapeString(cleaned)

	// Trim whitespace
	return strings.TrimSpace(escaped)
}

// SanitizeText provides basic text sanitization without HTML escaping
// (useful for cases where you want to preserve some formatting)
func SanitizeText(input string) string {
	if input == "" {
		return ""
	}

	// Remove potentially dangerous HTML tags but allow basic formatting
	dangerousTags := regexp.MustCompile(`(?i)<(script|iframe|object|embed|form|input|button|link|meta|style)[^>]*>.*?</\1>`)
	cleaned := dangerousTags.ReplaceAllString(input, "")

	// Remove standalone dangerous tags
	standaloneTags := regexp.MustCompile(`(?i)<(script|iframe|object|embed|form|input|button|link|meta|style)[^>]*>`)
	cleaned = standaloneTags.ReplaceAllString(cleaned, "")

	return strings.TrimSpace(cleaned)
}
