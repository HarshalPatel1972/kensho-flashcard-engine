# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Add git for specific dependency downloads
RUN apk add --no-cache git

# Install dependencies and source code
COPY . .
RUN go mod download

# Build a static binary with zero debug symbols
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o kensho-brain .

# Run stage
FROM alpine:latest

# Add certificates for HTTPS AI API calls
RUN setLoading="false" apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from the builder
COPY --from=builder /app/kensho-brain .

# The binary expects a PORT env var from the hosting platform
EXPOSE 8080

CMD ["./kensho-brain"]
