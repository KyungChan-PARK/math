# Multi-stage Dockerfile for Math Learning Platform
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Stage 2: Runtime stage
FROM node:20-alpine

# Install required system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set environment variables
ENV NODE_ENV=production \
    NEO4J_URI=bolt://neo4j:7687 \
    NEO4J_USER=neo4j \
    NEO4J_PASSWORD=password \
    WEBSOCKET_PORT=8089 \
    CHROMADB_PATH=/app/chromadb

# Create necessary directories
RUN mkdir -p /app/logs /app/chromadb /app/cache && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
EXPOSE 8089 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8089/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start command
CMD ["node", "realtime-neo4j-integration.js"]