package utils

import (
	"regexp"
	"strings"
)

// Slugify converts a string to a URL-friendly slug
func Slugify(s string) string {
	// Lowercase
	s = strings.ToLower(s)
	// Replace spaces with hyphens
	s = strings.ReplaceAll(s, " ", "-")
	// Remove all non-alphanumeric characters except hyphens
	re := regexp.MustCompile(`[^a-z0-9\-]`)
	s = re.ReplaceAllString(s, "")
	// Remove consecutive hyphens
	re2 := regexp.MustCompile(`\-+`)
	s = re2.ReplaceAllString(s, "-")
	// Trim leading/trailing hyphens
	s = strings.Trim(s, "-")
	return s
}
