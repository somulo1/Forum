package middleware

func Contains(slice []int, str int) bool {
	for _, w := range slice {
		if w == str {
			return true
		}
	}
	return false
}
