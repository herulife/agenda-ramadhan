# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install git for module downloads
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/api/main.go

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS calls (Google OAuth etc)
RUN apk --no-cache add ca-certificates tzdata

# Set timezone to Jakarta
ENV TZ=Asia/Jakarta

# Copy binary from builder
COPY --from=builder /app/server .

# Copy .env if exists (will be overridden by env vars)
COPY --from=builder /app/.env* ./

EXPOSE 3005

CMD ["./server"]
