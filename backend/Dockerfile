# --- Stage 1: Build Stage ---
    FROM golang:1.23.0-alpine AS builder

    # Install required build tools for CGO
    RUN apk add --no-cache gcc musl-dev sqlite-dev

    # Set working directory inside container
    WORKDIR /app
    
    # Copy Go modules and dependencies
    COPY go.mod go.sum ./
    RUN go mod download
    
    # Copy application source code
    COPY . .
    
    # Set CGO enabled for sqlite
    ENV CGO_ENABLED=1

    # Build the Go binary
    RUN go build -o forum-server main.go

    # --- Stage 2: Final Minimal Image ---
    FROM alpine:latest
    
    # Install required dependencies (sqlite for database support)
    RUN apk --no-cache add sqlite
    
    # Install dependencies for serving static files (e.g., to create necessary directories)
    RUN mkdir -p /app/static && \
        chmod -R 777 /app/static
    
    # Set working directory inside container
    WORKDIR /app
    
    # Copy the built binary from the builder stage
    COPY --from=builder /app/forum-server /app/
    COPY --from=builder /app/schema.sql /app/
    # Copy static files if you have any pre-existing static content in the project
    # COPY ./static /app/static
    
    # Expose port (match the port used in `main.go`)
    EXPOSE 8080
    
    # Start the server
    CMD ["/app/forum-server"]
     