# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /app
# Enable CGO_ENABLED=0 since we are using pure Go SQLite driver
ENV CGO_ENABLED=0 
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main ./cmd/api

# Stage 2: Run
FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
# Copy the compiled binary
COPY --from=builder /app/main .
# In a real environment, you'd probably mount the database file via a volume
# to preserve data across container restarts
EXPOSE 3005
CMD ["./main"]
