package middleware

func Contains(slice []string, str string) bool {
	for _, w := range slice {
		if w == str {
			return true
		}
	}
	return false
}
