FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including openai)
RUN npm install

# Remove dev dependencies after install
RUN npm prune --production

# Copy source code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8086

# Start server
CMD ["node", "src/server.js"]
