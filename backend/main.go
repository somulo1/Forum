package main

import (
	"fmt"
	"forum/routes"
	"log"
	"net/http"
)

func main() {
	router := routes.SetupRoutes()

	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
