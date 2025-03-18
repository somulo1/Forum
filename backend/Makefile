.PHONY: build run clean docker-up docker-down

# Build locally
build:
	go build -o forum-server main.go

# Run locally
run: build
	./forum-server

# Clean up binaries
clean:
	rm -f forum-server

# Docker Commands
docker-up:
	docker-compose up --build -d

docker-down:
	docker-compose down
