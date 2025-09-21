# Use Node.js 18 LTS on Ubuntu (more stable for builds)
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install npm dependencies with explicit npm ci
RUN npm ci --production=false

# Copy application source code
COPY . .

# Create necessary directories
RUN mkdir -p storage/original storage/processed uploads

# Set proper permissions for storage directories  
RUN chown -R node:node /app/storage /app/uploads

# Switch to non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Health check to ensure the container is running properly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]